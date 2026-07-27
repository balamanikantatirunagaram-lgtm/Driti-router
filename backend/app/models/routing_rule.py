from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from app.db.base import Base

class RoutingRule(Base):
    __tablename__ = "routing_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_enabled = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    condition_type = Column(String, nullable=False)
    condition_value = Column(String, nullable=True)  # JSON
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=True)
    model_override = Column(String, nullable=True)
    fallback_provider_id = Column(Integer, ForeignKey("providers.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
