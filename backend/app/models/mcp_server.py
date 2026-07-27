from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.base import Base

class MCPServer(Base):
    __tablename__ = "mcp_servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    transport = Column(String, nullable=False)  # 'stdio', 'http', 'sse'
    command = Column(String, nullable=True)
    args = Column(String, nullable=True)  # JSON array
    url = Column(String, nullable=True)
    env_vars = Column(String, nullable=True)  # JSON dict
    is_enabled = Column(Boolean, default=True)
    is_connected = Column(Boolean, default=False)
    capabilities = Column(String, nullable=True)  # JSON dict
    version = Column(String, nullable=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
