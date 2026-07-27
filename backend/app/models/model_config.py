from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from app.db.base import Base

class ModelConfig(Base):
    __tablename__ = "model_configs"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    is_enabled = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    temperature = Column(Float, default=1.0)
    max_tokens = Column(Integer, default=4096)
    context_length = Column(Integer, nullable=True)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime, nullable=False)
