from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.mcp_server import MCPServer
from app.services.mcp_manager import mcp_manager
import json

router = APIRouter()

@router.get("")
def list_mcp_servers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(MCPServer).all()

@router.post("")
def create_mcp_server(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    # basic implementation
    return {"status": "created"}

@router.get("/{server_id}")
def get_mcp_server(server_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    server = db.query(MCPServer).filter(MCPServer.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Not found")
    return server

@router.patch("/{server_id}")
def update_mcp_server(server_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return {"status": "updated"}

@router.delete("/{server_id}")
def delete_mcp_server(server_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    server = db.query(MCPServer).filter(MCPServer.id == server_id).first()
    if server:
        db.delete(server)
        db.commit()
    return {"status": "deleted"}

@router.post("/{server_id}/enable")
def enable_mcp_server(server_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    server = db.query(MCPServer).filter(MCPServer.id == server_id).first()
    if server:
        server.is_enabled = True
        db.commit()
    return {"status": "enabled"}

@router.post("/{server_id}/disable")
def disable_mcp_server(server_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    server = db.query(MCPServer).filter(MCPServer.id == server_id).first()
    if server:
        server.is_enabled = False
        db.commit()
    return {"status": "disabled"}

@router.post("/{server_id}/restart")
def restart_mcp_server(server_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    server = db.query(MCPServer).filter(MCPServer.id == server_id).first()
    if server:
        server.is_connected = False
        db.commit()
    return {"status": "restarting"}

@router.post("/{server_id}/test")
async def test_mcp_connection(server_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    server = db.query(MCPServer).filter(MCPServer.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Not found")
    return await mcp_manager.test_connection(server)

@router.get("/{server_id}/logs")
async def get_mcp_logs(server_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await mcp_manager.get_logs(server_id)
