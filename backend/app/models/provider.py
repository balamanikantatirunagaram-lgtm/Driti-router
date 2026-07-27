from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from app.db.base import Base

class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    base_url = Column(String, nullable=False)
    api_key_encrypted = Column(String, nullable=True)
    is_enabled = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    priority = Column(Integer, default=0)
    health_status = Column(String, default='unknown')
    last_health_check = Column(DateTime(timezone=True), nullable=True)
    latency_ms = Column(Integer, default=0)
    total_requests = Column(Integer, default=0)
    error_rate = Column(Float, default=0.0)
    config = Column(String, nullable=True)  # JSON
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
