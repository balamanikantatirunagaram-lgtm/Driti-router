from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.base import Base

class AgentProfile(Base):
    __tablename__ = "agent_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    capabilities = Column(String, nullable=False)  # JSON list
    is_enabled = Column(Boolean, default=True)
    config = Column(String, nullable=True)  # JSON
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
