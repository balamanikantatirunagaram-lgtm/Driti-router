from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.models import router as models_router
from app.api.settings import router as settings_router
from app.api.logs import router as logs_router
from app.api.health import router as health_router
from app.api.proxy import router as proxy_router
from app.api.ws import router as ws_router

# Phase 2 routers
from app.api.analytics import router as analytics_router
from app.api.openai_compat import router as openai_compat_router

from app.core.config import settings
from app.db.init_db import init_db
import time

app = FastAPI(
    title="Driti Gateway",
    description="Anthropic-compatible proxy for Claude Code routing to NVIDIA NIM",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Latency tracking middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = int((time.time() - start_time) * 1000)
    response.headers["X-Process-Time-Ms"] = str(process_time)
    return response

@app.on_event("startup")
def on_startup():
    init_db()

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(models_router, prefix="/api/models", tags=["models"])
app.include_router(settings_router, prefix="/api/settings", tags=["settings"])
app.include_router(logs_router, prefix="/api/logs", tags=["logs"])
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(proxy_router, prefix="/v1", tags=["proxy"])
app.include_router(openai_compat_router, prefix="/v1", tags=["openai_compat"])
app.include_router(ws_router, prefix="/ws", tags=["ws"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
