from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.gateway_token import GatewayToken
from app.models.request_log import RequestLog
from typing import List, Dict, Any
from datetime import datetime, timezone
import hashlib
import os
import json

router = APIRouter()

@router.get("")
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "email": u.email, "is_active": u.is_active, "is_admin": u.is_admin} for u in users]

@router.post("")
def create_user(user_data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return {"message": "User creation not implemented in detail yet."}

@router.get("/{user_id}")
def get_user_detail(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "username": user.username, "email": user.email, "is_active": user.is_active, "is_admin": user.is_admin}

@router.patch("/{user_id}")
def update_user(user_id: int, user_data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if "is_active" in user_data:
        user.is_active = user_data["is_active"]
    if "is_admin" in user_data:
        user.is_admin = user_data["is_admin"]
    db.commit()
    return {"status": "success"}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return {"status": "deleted"}

@router.get("/{user_id}/tokens")
def list_user_tokens(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    tokens = db.query(GatewayToken).filter(GatewayToken.user_id == user_id).all()
    return [{"id": t.id, "name": t.name, "token_prefix": t.token_prefix, "is_active": t.is_active} for t in tokens]

@router.post("/{user_id}/tokens")
def create_gateway_token(user_id: int, token_data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    token_str = "gw_" + os.urandom(16).hex()
    token_hash = hashlib.sha256(token_str.encode()).hexdigest()
    
    token = GatewayToken(
        user_id=user_id,
        name=token_data.get("name", "New Token"),
        token_hash=token_hash,
        token_prefix=token_str[:8],
        scopes=json.dumps(token_data.get("scopes", ["proxy"])),
        created_at=datetime.now(timezone.utc)
    )
    db.add(token)
    db.commit()
    
    return {"token": token_str, "id": token.id, "name": token.name}

@router.delete("/{user_id}/tokens/{token_id}")
def revoke_token(user_id: int, token_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    token = db.query(GatewayToken).filter(GatewayToken.id == token_id, GatewayToken.user_id == user_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    db.delete(token)
    db.commit()
    return {"status": "revoked"}

@router.get("/{user_id}/activity")
def get_user_activity(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    logs = db.query(RequestLog).filter(RequestLog.user_id == user_id).order_by(RequestLog.timestamp.desc()).limit(50).all()
    return logs
