import asyncio
from app.models.mcp_server import MCPServer

class MCPManager:
    def __init__(self):
        self._logs: dict[int, list[str]] = {}
        self._reconnect_tasks: dict[int, bool] = {}
        
    async def test_connection(self, server: MCPServer) -> dict:
        # Mock test logic
        return {
            "connected": True,
            "latency_ms": 42,
            "capabilities": '["filesystem"]',
            "version": "1.0.0",
            "message": "Connection successful"
        }
    
    async def add_log(self, server_id: int, message: str):
        if server_id not in self._logs:
            self._logs[server_id] = []
        self._logs[server_id].append(message)
        if len(self._logs[server_id]) > 200:
            self._logs[server_id] = self._logs[server_id][-200:]
            
    async def get_logs(self, server_id: int) -> list[str]:
        return self._logs.get(server_id, [])
        
    async def reconnect_loop(self, server_id: int, db):
        pass

mcp_manager = MCPManager()
