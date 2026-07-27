from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.request_log import RequestLog
from typing import List

router = APIRouter()

@router.get("/requests")
def get_live_requests(limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    logs = db.query(RequestLog).order_by(RequestLog.timestamp.desc()).limit(limit).all()
    return logs

# WS route will be in main or a separate WS router, we'll expose a class to manage it
class LiveRequestManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

live_manager = LiveRequestManager()
