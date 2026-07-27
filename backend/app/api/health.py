from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.dependencies import get_db
from app.services.nvidia import get_nvidia_api_key, test_nvidia_connection
from app.models.provider import Provider
from app.models.mcp_server import MCPServer
import time
import psutil

router = APIRouter()

START_TIME = time.time()

@router.get("")
async def health_check(db: Session = Depends(get_db)):
    # Database check
    db_status = "online"
    db_latency = 0
    try:
        t0 = time.time()
        db.execute(text("SELECT 1"))
        db_latency = int((time.time() - t0) * 1000)
    except Exception:
        db_status = "offline"

    # NVIDIA check
    nvidia_status = "offline"
    nvidia_latency = 0
    nvidia_connected = False
    try:
        api_key = get_nvidia_api_key()
        t0 = time.time()
        nvidia_connected = await test_nvidia_connection(api_key)
        nvidia_latency = int((time.time() - t0) * 1000)
        nvidia_status = "online" if nvidia_connected else "offline"
    except Exception:
        pass

    overall = "healthy"
    if db_status != "online":
        overall = "unhealthy"
    elif not nvidia_connected:
        overall = "degraded"

    # CPU/Mem
    cpu_percent = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    
    # Providers
    providers_db = db.query(Provider).all()
    providers = [{"name": p.name, "status": p.health_status} for p in providers_db]
    
    # MCP Servers
    mcp_db = db.query(MCPServer).all()
    mcp_servers = [{"name": m.name, "status": "online" if m.is_connected else "offline"} for m in mcp_db]
    
    # Active Connections mock
    active_connections = 0

    return {
        "status": overall,
        "gateway": {"status": "online", "latency_ms": 0},
        "database": {"status": db_status, "latency_ms": db_latency},
        "nvidia": {"status": nvidia_status, "latency_ms": nvidia_latency, "connected": nvidia_connected},
        "version": "1.0.0",
        "uptime_seconds": int(time.time() - START_TIME),
        "cpu_percent": cpu_percent,
        "memory_percent": mem.percent,
        "active_connections": active_connections,
        "providers": providers,
        "mcp_servers": mcp_servers
    }
