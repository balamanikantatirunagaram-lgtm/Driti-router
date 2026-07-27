from app.models.provider import Provider
from app.models.settings import AppSettings

class SmartRouter:
    def __init__(self):
        self.mode = 'manual'
        
    async def route(self, db, request_context: dict) -> dict:
        settings = db.query(AppSettings).first()
        self.mode = settings.routing_mode if settings else 'manual'
        
        default_prov = await self.get_default_provider(db)
        
        return {
            "provider": default_prov.name if default_prov else "nvidia",
            "model": request_context.get("model", "unknown"),
            "fallback_provider": None,
            "reason": f"Routed via {self.mode} mode"
        }
        
    def detect_request_type(self, messages: list, tools: list) -> str:
        if tools:
            return "tool_heavy"
        return "chat"
        
    async def get_default_provider(self, db) -> Provider | None:
        return db.query(Provider).filter(Provider.is_default == True).first()
        
    async def fallback(self, db, failed_provider_id: int) -> Provider | None:
        # returns next highest priority provider
        return db.query(Provider).filter(Provider.is_enabled == True, Provider.id != failed_provider_id).order_by(Provider.priority).first()

smart_router = SmartRouter()
