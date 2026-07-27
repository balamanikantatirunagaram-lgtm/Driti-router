from sqlalchemy import Column, DateTime, Integer, String, Boolean
from app.db.base import Base

class AppSettings(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    nvidia_api_key_encrypted = Column(String, nullable=True)
    gateway_name = Column(String, default="Driti Gateway")
    
    # Phase 2 settings
    routing_mode = Column(String, default='manual', nullable=True)
    streaming_enabled = Column(Boolean, default=True, nullable=True)
    max_retries = Column(Integer, default=3, nullable=True)
    timeout_seconds = Column(Integer, default=60, nullable=True)
    max_context_tokens = Column(Integer, default=128000, nullable=True)
    debug_mode = Column(Boolean, default=False, nullable=True)
    rate_limit_rpm = Column(Integer, default=60, nullable=True)
    cache_enabled = Column(Boolean, default=False, nullable=True)
    health_check_interval = Column(Integer, default=30, nullable=True)
    
    updated_at = Column(DateTime(timezone=True), nullable=False)
