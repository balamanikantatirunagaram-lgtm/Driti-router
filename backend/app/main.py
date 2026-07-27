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
from app.api.users import router as users_router
from app.api.providers import router as providers_router
from app.api.mcp import router as mcp_router
from app.api.routing import router as routing_router
from app.api.analytics import router as analytics_router
from app.api.live import router as live_router
from app.api.agents import router as agents_router
from app.api.openai_compat import router as openai_compat_router

from app.core.config import settings
from app.db.init_db import init_db
import time

app = FastAPI(title="Driti Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(models_router, prefix="/api/models", tags=["models"])
app.include_router(settings_router, prefix="/api/settings", tags=["settings"])
app.include_router(logs_router, prefix="/api/logs", tags=["logs"])
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(proxy_router, prefix="/v1", tags=["proxy"])
app.include_router(openai_compat_router, prefix="/v1", tags=["openai_compat"])
app.include_router(ws_router, prefix="/ws", tags=["ws"])

app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(providers_router, prefix="/api/providers", tags=["providers"])
app.include_router(mcp_router, prefix="/api/mcp", tags=["mcp"])
app.include_router(routing_router, prefix="/api/routing", tags=["routing"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(live_router, prefix="/api/live", tags=["live"])
app.include_router(agents_router, prefix="/api/agents", tags=["agents"])
