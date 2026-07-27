from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_admin
from app.services.stats import get_dashboard_stats
from app.services.online_users import manager as online_users_manager
from app.services.nvidia import get_nvidia_api_key, test_nvidia_connection

router = APIRouter()

@router.get("/stats")
async def get_stats(db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    try:
        api_key = get_nvidia_api_key()
        nvidia_connected = await test_nvidia_connection(api_key)
    except Exception:
        nvidia_connected = False

    online_users = online_users_manager.get_online_count()
    return get_dashboard_stats(db, nvidia_connected, online_users)
