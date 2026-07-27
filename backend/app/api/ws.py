import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.stats import get_dashboard_stats
from app.services.online_users import manager
from app.services.nvidia import get_nvidia_api_key, test_nvidia_connection
from jose import jwt
from app.core.config import settings
from app.core.security import ALGORITHM
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/stats")
async def websocket_stats(websocket: WebSocket):
    await websocket.accept()
    
    # We could require an auth token as the first message or in query params,
    # for simplicity we'll just track this connection.
    # We will use the remote IP as a proxy for the username if token is not sent initially.
    client_id = f"anon_{id(websocket)}"
    
    # Wait for the first message to authenticate
    try:
        data = await asyncio.wait_for(websocket.receive_text(), timeout=5.0)
        payload = json.loads(data)
        token = payload.get("token")
        if token:
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            client_id = decoded.get("sub", client_id)
    except Exception as e:
        logger.warning(f"WebSocket auth failed or timed out: {e}")
        await websocket.close(code=1008)
        return

    manager.connect(client_id)
    try:
        while True:
            db = SessionLocal()
            try:
                api_key = get_nvidia_api_key()
                nvidia_connected = await test_nvidia_connection(api_key)
            except Exception:
                nvidia_connected = False
                
            try:
                stats = get_dashboard_stats(db, nvidia_connected, manager.get_online_count())
                await websocket.send_json(stats)
            except Exception as e:
                logger.error(f"Error fetching stats for WS: {e}")
            finally:
                db.close()
                
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(client_id)
