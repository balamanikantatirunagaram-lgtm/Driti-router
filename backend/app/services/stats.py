from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.request_log import RequestLog
from app.models.model_config import ModelConfig

def get_dashboard_stats(db: Session, nvidia_connected: bool, online_users: int) -> dict:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Defaults
    gateway_status = 'online' if nvidia_connected else 'offline'
    default_model_row = db.query(ModelConfig).filter(ModelConfig.is_default == True).first()
    default_model = default_model_row.model_id if default_model_row else "none"

    # Aggregates
    total_requests = db.query(func.count(RequestLog.id)).scalar() or 0
    requests_today = db.query(func.count(RequestLog.id)).filter(RequestLog.timestamp >= today_start).scalar() or 0
    
    tokens_today = db.query(func.sum(RequestLog.total_tokens)).filter(RequestLog.timestamp >= today_start).scalar() or 0
    
    avg_latency = db.query(func.avg(RequestLog.latency_ms)).scalar() or 0.0

    # Success rate
    success_requests = db.query(func.count(RequestLog.id)).filter(RequestLog.status == 'success').scalar() or 0
    success_rate = (success_requests / total_requests * 100) if total_requests > 0 else 100.0

    if gateway_status == 'online' and success_rate < 90.0:
        gateway_status = 'degraded'

    # Requests last 24h
    requests_24h = []
    for i in range(23, -1, -1):
        hour_start = now - timedelta(hours=i+1)
        hour_end = now - timedelta(hours=i)
        count = db.query(func.count(RequestLog.id)).filter(
            RequestLog.timestamp >= hour_start,
            RequestLog.timestamp < hour_end
        ).scalar() or 0
        requests_24h.append({
            "hour": hour_end.strftime("%H:00"),
            "count": count
        })

    return {
        "gateway_status": gateway_status,
        "nvidia_connected": nvidia_connected,
        "default_model": default_model,
        "requests_today": requests_today,
        "total_requests": total_requests,
        "tokens_today": int(tokens_today),
        "avg_latency_ms": round(float(avg_latency), 2),
        "online_users": online_users,
        "requests_24h": requests_24h,
        "success_rate": round(float(success_rate), 2)
    }
