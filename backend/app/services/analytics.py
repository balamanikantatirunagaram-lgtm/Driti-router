from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from app.models.request_log import RequestLog
from app.models.user import User

async def get_analytics_summary(db, period: str) -> dict:
    now = datetime.now(timezone.utc)
    start_time = None
    
    if period == 'day':
        start_time = now - timedelta(days=1)
    elif period == 'week':
        start_time = now - timedelta(days=7)
    elif period == 'month':
        start_time = now - timedelta(days=30)
    elif period == 'year':
        start_time = now - timedelta(days=365)
    elif period in ('overall', 'all'):
        start_time = None
    else:
        start_time = now - timedelta(days=1)
        
    query = db.query(RequestLog)
    if start_time:
        query = query.filter(RequestLog.timestamp >= start_time)
        
    total_requests = query.count()
    
    if total_requests == 0:
        # Build empty buckets for clean chart rendering
        buckets = _build_time_buckets(now, period, [])
        return {
            "total_requests": 0,
            "total_tokens": 0,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "avg_latency_ms": 0.0,
            "error_rate": 0.0,
            "success_rate": 100.0,
            "streaming_rate": 0.0,
            "retry_rate": 0.0,
            "top_models": [],
            "top_users": [],
            "requests_by_period": [{"period": b["period"], "count": 0} for b in buckets],
            "provider_usage": [],
            "errors_over_time": [{"period": b["period"], "count": 0} for b in buckets]
        }
        
    total_input = db.query(func.sum(RequestLog.prompt_tokens)).filter(
        RequestLog.timestamp >= start_time if start_time else True
    ).scalar() or 0
    
    total_output = db.query(func.sum(RequestLog.completion_tokens)).filter(
        RequestLog.timestamp >= start_time if start_time else True
    ).scalar() or 0
    
    total_tokens = total_input + total_output
    
    avg_lat = db.query(func.avg(RequestLog.latency_ms)).filter(
        RequestLog.timestamp >= start_time if start_time else True
    ).scalar() or 0.0
    
    success_count = query.filter(RequestLog.status == 'success').count()
    error_count = query.filter(RequestLog.status == 'error').count()
    streaming_count = query.filter(RequestLog.is_streaming == True).count()
    
    success_rate = (success_count / total_requests) * 100.0
    error_rate = (error_count / total_requests) * 100.0
    streaming_rate = (streaming_count / total_requests) * 100.0
    
    # 1. Top Models
    top_models_query = db.query(
        RequestLog.model,
        func.count(RequestLog.id).label("count"),
        func.sum(RequestLog.total_tokens).label("tokens")
    )
    if start_time:
        top_models_query = top_models_query.filter(RequestLog.timestamp >= start_time)
    top_models_raw = top_models_query.group_by(RequestLog.model).order_by(func.count(RequestLog.id).desc()).limit(10).all()
    top_models = [
        {"model": str(r.model or "unknown"), "count": int(r.count or 0), "tokens": int(r.tokens or 0)}
        for r in top_models_raw
    ]
    
    # 2. Top Users
    top_users_query = db.query(
        User.username,
        func.count(RequestLog.id).label("count"),
        func.sum(RequestLog.total_tokens).label("tokens")
    ).join(User, RequestLog.user_id == User.id)
    if start_time:
        top_users_query = top_users_query.filter(RequestLog.timestamp >= start_time)
    top_users_raw = top_users_query.group_by(User.username).order_by(func.count(RequestLog.id).desc()).limit(10).all()
    top_users = [
        {"username": str(r.username or "unknown"), "count": int(r.count or 0), "tokens": int(r.tokens or 0)}
        for r in top_users_raw
    ]
    
    # 3. Provider Breakdown
    provider_map = {}
    logs_for_provider = db.query(RequestLog.model, RequestLog.total_tokens)
    if start_time:
        logs_for_provider = logs_for_provider.filter(RequestLog.timestamp >= start_time)
    for log in logs_for_provider.all():
        m = (log.model or "").lower()
        if "claude" in m: prov = "Anthropic"
        elif any(k in m for k in ["gpt", "o1", "codex", "openai"]): prov = "OpenAI"
        elif any(k in m for k in ["gemini", "agy", "google", "antigravity"]): prov = "Google"
        elif any(k in m for k in ["nemotron", "nvidia"]): prov = "NVIDIA"
        elif any(k in m for k in ["llama", "meta"]): prov = "Meta"
        elif "mistral" in m: prov = "Mistral"
        elif "qwen" in m: prov = "Qwen"
        else: prov = "Other"
        
        if prov not in provider_map:
            provider_map[prov] = {"provider": prov, "count": 0, "tokens": 0}
        provider_map[prov]["count"] += 1
        provider_map[prov]["tokens"] += int(log.total_tokens or 0)
    provider_usage = sorted(provider_map.values(), key=lambda x: x["count"], reverse=True)
    
    # 4. Time Series Buckets (Requests & Errors over time)
    all_logs_query = db.query(RequestLog.timestamp, RequestLog.status).order_by(RequestLog.timestamp.asc())
    if start_time:
        all_logs_query = all_logs_query.filter(RequestLog.timestamp >= start_time)
    all_logs = all_logs_query.all()
    
    buckets = _build_time_buckets(now, period, all_logs)
    
    return {
        "total_requests": total_requests,
        "total_tokens": int(total_tokens),
        "total_input_tokens": int(total_input),
        "total_output_tokens": int(total_output),
        "avg_latency_ms": round(float(avg_lat), 2),
        "error_rate": round(error_rate, 2),
        "success_rate": round(success_rate, 2),
        "streaming_rate": round(streaming_rate, 2),
        "retry_rate": 0.0,
        "top_models": top_models,
        "top_users": top_users,
        "requests_by_period": [{"period": b["period"], "count": b["count"]} for b in buckets],
        "provider_usage": provider_usage,
        "errors_over_time": [{"period": b["period"], "count": b["errors"]} for b in buckets]
    }

def _build_time_buckets(now: datetime, period: str, logs: list) -> list:
    buckets = []
    bucket_map = {}
    
    if period == 'day':
        for i in range(23, -1, -1):
            dt = now - timedelta(hours=i)
            label = dt.strftime("%H:00")
            bucket_map[label] = len(buckets)
            buckets.append({"period": label, "count": 0, "errors": 0})
        for log in logs:
            if log.timestamp:
                label = log.timestamp.strftime("%H:00")
                if label in bucket_map:
                    idx = bucket_map[label]
                    buckets[idx]["count"] += 1
                    if log.status == 'error':
                        buckets[idx]["errors"] += 1
                        
    elif period == 'week':
        for i in range(6, -1, -1):
            dt = now - timedelta(days=i)
            label = dt.strftime("%b %d")
            bucket_map[label] = len(buckets)
            buckets.append({"period": label, "count": 0, "errors": 0})
        for log in logs:
            if log.timestamp:
                label = log.timestamp.strftime("%b %d")
                if label in bucket_map:
                    idx = bucket_map[label]
                    buckets[idx]["count"] += 1
                    if log.status == 'error':
                        buckets[idx]["errors"] += 1
                        
    elif period == 'month':
        for i in range(29, -1, -1):
            dt = now - timedelta(days=i)
            label = dt.strftime("%b %d")
            bucket_map[label] = len(buckets)
            buckets.append({"period": label, "count": 0, "errors": 0})
        for log in logs:
            if log.timestamp:
                label = log.timestamp.strftime("%b %d")
                if label in bucket_map:
                    idx = bucket_map[label]
                    buckets[idx]["count"] += 1
                    if log.status == 'error':
                        buckets[idx]["errors"] += 1
                        
    elif period == 'year':
        for i in range(11, -1, -1):
            # approximate 30 days per month for label generation
            dt = now - timedelta(days=i * 30)
            label = dt.strftime("%b %Y")
            if label not in bucket_map:
                bucket_map[label] = len(buckets)
                buckets.append({"period": label, "count": 0, "errors": 0})
        for log in logs:
            if log.timestamp:
                label = log.timestamp.strftime("%b %Y")
                if label in bucket_map:
                    idx = bucket_map[label]
                    buckets[idx]["count"] += 1
                    if log.status == 'error':
                        buckets[idx]["errors"] += 1
                        
    else: # overall / all
        if not logs:
            for i in range(5, -1, -1):
                dt = now - timedelta(days=i * 30)
                label = dt.strftime("%b %Y")
                bucket_map[label] = len(buckets)
                buckets.append({"period": label, "count": 0, "errors": 0})
        else:
            for log in logs:
                if log.timestamp:
                    label = log.timestamp.strftime("%b %Y")
                    if label not in bucket_map:
                        bucket_map[label] = len(buckets)
                        buckets.append({"period": label, "count": 0, "errors": 0})
                    idx = bucket_map[label]
                    buckets[idx]["count"] += 1
                    if log.status == 'error':
                        buckets[idx]["errors"] += 1
                        
    return buckets
