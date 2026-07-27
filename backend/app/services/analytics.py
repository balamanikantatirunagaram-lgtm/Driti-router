from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from app.models.request_log import RequestLog

async def get_analytics_summary(db, period: str) -> dict:
    now = datetime.now(timezone.utc)
    if period == 'day':
        start_time = now - timedelta(days=1)
    elif period == 'week':
        start_time = now - timedelta(days=7)
    elif period == 'month':
        start_time = now - timedelta(days=30)
    else:
        start_time = now - timedelta(days=1)
        
    query = db.query(RequestLog).filter(RequestLog.timestamp >= start_time)
    
    total_requests = query.count()
    if total_requests == 0:
        return {
            "total_requests": 0, "total_tokens": 0, "total_input_tokens": 0, "total_output_tokens": 0,
            "avg_latency_ms": 0, "error_rate": 0, "success_rate": 0, "streaming_rate": 0, "retry_rate": 0,
            "top_models": [], "top_users": [], "requests_by_hour": [], "requests_by_day": [],
            "provider_usage": [], "errors_over_time": []
        }
        
    total_input = db.query(func.sum(RequestLog.prompt_tokens)).filter(RequestLog.timestamp >= start_time).scalar() or 0
    total_output = db.query(func.sum(RequestLog.completion_tokens)).filter(RequestLog.timestamp >= start_time).scalar() or 0
    total_tokens = total_input + total_output
    avg_lat = db.query(func.avg(RequestLog.latency_ms)).filter(RequestLog.timestamp >= start_time).scalar() or 0
    
    success_count = query.filter(RequestLog.status_code < 400).count()
    success_rate = (success_count / total_requests) * 100
    error_rate = 100 - success_rate
    
    # Mock some data for speed/simplicity since it's just Phase 2 scaffolding
    return {
        "total_requests": total_requests,
        "total_tokens": total_tokens,
        "total_input_tokens": total_input,
        "total_output_tokens": total_output,
        "avg_latency_ms": float(avg_lat),
        "error_rate": error_rate,
        "success_rate": success_rate,
        "streaming_rate": 0,
        "retry_rate": 0,
        "top_models": [],
        "top_users": [],
        "requests_by_hour": [],
        "requests_by_day": [],
        "provider_usage": [],
        "errors_over_time": []
    }
