from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from app.db.base import Base

class RequestLog(Base):
    __tablename__ = "request_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    model = Column(String, nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    status = Column(String, nullable=False)  # 'success' | 'error'
    is_streaming = Column(Boolean, default=False)
    error_message = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
