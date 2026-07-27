from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.dependencies import get_db, get_current_admin
from app.models.request_log import RequestLog
from app.models.user import User

router = APIRouter()

class RequestLogUser(BaseModel):
    id: int
    username: str

class RequestLogResponse(BaseModel):
    id: int
    timestamp: datetime
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: int
    status: str
    is_streaming: bool
    error_message: Optional[str] = None
    ip_address: Optional[str] = None
    user: RequestLogUser

    model_config = {"from_attributes": True}

class PaginatedLogsResponse(BaseModel):
    items: List[RequestLogResponse]
    total: int
    page: int
    per_page: int

@router.get("", response_model=PaginatedLogsResponse)
def get_logs(
    page: int = 1,
    per_page: int = 50,
    status: Optional[str] = None,
    model: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    query = db.query(RequestLog, User).join(User, RequestLog.user_id == User.id)
    
    if status:
        query = query.filter(RequestLog.status == status)
    if model:
        query = query.filter(RequestLog.model == model)
    if search:
        query = query.filter(User.username.ilike(f"%{search}%"))

    total = query.count()
    query = query.order_by(desc(RequestLog.timestamp)).offset((page - 1) * per_page).limit(per_page)
    
    results = query.all()
    items = []
    for log, user in results:
        log_dict = {
            "id": log.id,
            "timestamp": log.timestamp,
            "model": log.model,
            "prompt_tokens": log.prompt_tokens,
            "completion_tokens": log.completion_tokens,
            "total_tokens": log.total_tokens,
            "latency_ms": log.latency_ms,
            "status": log.status,
            "is_streaming": log.is_streaming,
            "error_message": log.error_message,
            "ip_address": log.ip_address,
            "user": {"id": user.id, "username": user.username}
        }
        items.append(log_dict)

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page
    }
