from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from app.db.base import Base

class GatewayToken(Base):
    __tablename__ = "gateway_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    token_hash = Column(String, nullable=False, unique=True)
    token_prefix = Column(String, nullable=False)
    scopes = Column(String, nullable=False)  # JSON list
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
