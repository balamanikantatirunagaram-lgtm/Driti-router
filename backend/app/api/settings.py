from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.dependencies import get_db, get_current_admin
from app.models.settings import AppSettings
from app.core.encryption import encrypt, decrypt
from app.services.nvidia import test_nvidia_connection
from datetime import datetime, timezone

router = APIRouter()

class SettingsResponse(BaseModel):
    has_api_key: bool
    gateway_name: str
    nvidia_connected: bool
    routing_mode: str
    streaming_enabled: bool
    max_retries: int
    timeout_seconds: int
    max_context_tokens: int
    debug_mode: bool
    rate_limit_rpm: int
    cache_enabled: bool
    health_check_interval: int

class SettingsUpdate(BaseModel):
    nvidia_api_key: Optional[str] = None
    gateway_name: Optional[str] = None
    routing_mode: Optional[str] = None
    streaming_enabled: Optional[bool] = None
    max_retries: Optional[int] = None
    timeout_seconds: Optional[int] = None
    max_context_tokens: Optional[int] = None
    debug_mode: Optional[bool] = None
    rate_limit_rpm: Optional[int] = None
    cache_enabled: Optional[bool] = None
    health_check_interval: Optional[int] = None

class ValidateKeyRequest(BaseModel):
    api_key: str

@router.get("", response_model=SettingsResponse)
async def get_settings(db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    settings_row = db.query(AppSettings).filter(AppSettings.id == 1).first()
    has_key = bool(settings_row and settings_row.nvidia_api_key_encrypted)
    
    connected = False
    if has_key:
        api_key = decrypt(settings_row.nvidia_api_key_encrypted)
        connected = await test_nvidia_connection(api_key)

    return {
        "has_api_key": has_key,
        "gateway_name": settings_row.gateway_name if settings_row else "Driti Gateway",
        "nvidia_connected": connected,
        "routing_mode": settings_row.routing_mode if settings_row and settings_row.routing_mode else "manual",
        "streaming_enabled": settings_row.streaming_enabled if settings_row and settings_row.streaming_enabled is not None else True,
        "max_retries": settings_row.max_retries if settings_row and settings_row.max_retries is not None else 3,
        "timeout_seconds": settings_row.timeout_seconds if settings_row and settings_row.timeout_seconds is not None else 60,
        "max_context_tokens": settings_row.max_context_tokens if settings_row and settings_row.max_context_tokens is not None else 128000,
        "debug_mode": settings_row.debug_mode if settings_row and settings_row.debug_mode is not None else False,
        "rate_limit_rpm": settings_row.rate_limit_rpm if settings_row and settings_row.rate_limit_rpm is not None else 60,
        "cache_enabled": settings_row.cache_enabled if settings_row and settings_row.cache_enabled is not None else False,
        "health_check_interval": settings_row.health_check_interval if settings_row and settings_row.health_check_interval is not None else 30,
    }

@router.post("")
def update_settings(update_data: SettingsUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    settings_row = db.query(AppSettings).filter(AppSettings.id == 1).first()
    if not settings_row:
        settings_row = AppSettings(id=1, updated_at=datetime.now(timezone.utc))
        db.add(settings_row)

    if update_data.nvidia_api_key is not None:
        settings_row.nvidia_api_key_encrypted = encrypt(update_data.nvidia_api_key)
    if update_data.gateway_name is not None:
        settings_row.gateway_name = update_data.gateway_name
    
    if update_data.routing_mode is not None:
        settings_row.routing_mode = update_data.routing_mode
    if update_data.streaming_enabled is not None:
        settings_row.streaming_enabled = update_data.streaming_enabled
    if update_data.max_retries is not None:
        settings_row.max_retries = update_data.max_retries
    if update_data.timeout_seconds is not None:
        settings_row.timeout_seconds = update_data.timeout_seconds
    if update_data.max_context_tokens is not None:
        settings_row.max_context_tokens = update_data.max_context_tokens
    if update_data.debug_mode is not None:
        settings_row.debug_mode = update_data.debug_mode
    if update_data.rate_limit_rpm is not None:
        settings_row.rate_limit_rpm = update_data.rate_limit_rpm
    if update_data.cache_enabled is not None:
        settings_row.cache_enabled = update_data.cache_enabled
    if update_data.health_check_interval is not None:
        settings_row.health_check_interval = update_data.health_check_interval

    settings_row.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "success"}

@router.post("/validate-key")
async def validate_key(req: ValidateKeyRequest, current_user = Depends(get_current_admin)):
    is_valid = await test_nvidia_connection(req.api_key)
    return {
        "valid": is_valid,
        "message": "Connection successful" if is_valid else "Invalid API key or network error"
    }
