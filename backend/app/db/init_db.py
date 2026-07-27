from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User
from app.models.model_config import ModelConfig
from app.models.settings import AppSettings
from app.models.provider import Provider
from app.models.agent_profile import AgentProfile
from app.models.mcp_server import MCPServer
from app.models.routing_rule import RoutingRule
from app.models.audit_log import AuditLog
from app.models.gateway_token import GatewayToken
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

INITIAL_MODELS = [
    {"model_id": "nvidia/nemotron-3-super-120b-a12b", "display_name": "Nemotron 3 Super 120B", "is_default": False},
    {"model_id": "nvidia/nemotron-3-ultra-550b-a55b", "display_name": "Nemotron 3 Ultra 550B", "is_default": False},
    {"model_id": "openai/gpt-oss-120b", "display_name": "GPT OSS 120B", "is_default": False},
    {"model_id": "z-ai/glm-5.2", "display_name": "GLM 5.2", "is_default": False},
]

def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    try:
        with engine.connect() as conn:
            res = conn.execute(text("PRAGMA table_info(app_settings)")).fetchall()
            cols = [r[1] for r in res]
            new_cols = [
                ("routing_mode", "VARCHAR DEFAULT 'auto'"),
                ("streaming_enabled", "BOOLEAN DEFAULT 1"),
                ("max_retries", "INTEGER DEFAULT 3"),
                ("timeout_seconds", "INTEGER DEFAULT 60"),
                ("max_context_tokens", "INTEGER DEFAULT 128000"),
                ("debug_mode", "BOOLEAN DEFAULT 0"),
                ("rate_limit_rpm", "INTEGER DEFAULT 60"),
                ("cache_enabled", "BOOLEAN DEFAULT 0"),
                ("health_check_interval", "INTEGER DEFAULT 30")
            ]
            for col_name, col_def in new_cols:
                if col_name not in cols:
                    conn.execute(text(f"ALTER TABLE app_settings ADD COLUMN {col_name} {col_def}"))
            conn.commit()
    except Exception as e:
        logger.warning(f"Migration check failed or not needed: {e}")
    db = SessionLocal()
    try:
        # Create admin user
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin"),
                is_admin=True,
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(admin)
            db.commit()
            logger.info("Created default admin user with username 'admin' and password 'admin'")
        
        # Keep ONLY the 4 requested models, remove all remaining models
        allowed_ids = [m["model_id"] for m in INITIAL_MODELS]
        db.query(ModelConfig).filter(~ModelConfig.model_id.in_(allowed_ids)).delete(synchronize_session=False)
        # Ensure no model is marked as default
        db.query(ModelConfig).update({"is_default": False})
        db.commit()

        # Create initial models
        for m_data in INITIAL_MODELS:
            model = db.query(ModelConfig).filter(ModelConfig.model_id == m_data["model_id"]).first()
            if not model:
                model = ModelConfig(
                    model_id=m_data["model_id"],
                    display_name=m_data["display_name"],
                    is_enabled=True,
                    is_default=False,
                    temperature=1.0,
                    max_tokens=4096,
                    updated_at=datetime.now(timezone.utc)
                )
                db.add(model)
            else:
                model.is_default = False
        db.commit()
        
        # Create AppSettings row and ensure routing_mode is auto
        settings_row = db.query(AppSettings).filter(AppSettings.id == 1).first()
        if not settings_row:
            settings_row = AppSettings(
                id=1,
                gateway_name="Driti Gateway",
                routing_mode="auto",
                streaming_enabled=True,
                max_retries=3,
                timeout_seconds=60,
                max_context_tokens=128000,
                debug_mode=False,
                rate_limit_rpm=60,
                cache_enabled=False,
                health_check_interval=30,
                updated_at=datetime.now(timezone.utc)
            )
            db.add(settings_row)
        else:
            settings_row.routing_mode = "auto"
        db.commit()
            
        # Seed NVIDIA provider
        nvidia_provider = db.query(Provider).filter(Provider.name == "nvidia").first()
        if not nvidia_provider:
            nvidia_provider = Provider(
                name="nvidia",
                display_name="NVIDIA NIM",
                base_url="https://integrate.api.nvidia.com/v1",
                is_enabled=True,
                is_default=True,
                priority=1,
                health_status="online",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(nvidia_provider)
            db.commit()

        # Seed Agent Profiles
        initial_profiles = [
            {
                "name": "claude-code",
                "display_name": "Claude Code",
                "capabilities": '["filesystem", "terminal", "git", "mcp", "tool_calling", "streaming"]'
            },
            {
                "name": "agy",
                "display_name": "AGY",
                "capabilities": '["filesystem", "terminal", "git", "mcp", "tool_calling", "streaming"]'
            },
            {
                "name": "generic",
                "display_name": "Generic Agent",
                "capabilities": '["streaming", "tool_calling"]'
            }
        ]
        
        for p_data in initial_profiles:
            profile = db.query(AgentProfile).filter(AgentProfile.name == p_data["name"]).first()
            if not profile:
                profile = AgentProfile(
                    name=p_data["name"],
                    display_name=p_data["display_name"],
                    capabilities=p_data["capabilities"],
                    is_enabled=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                db.add(profile)
        db.commit()

    except Exception as e:
        db.rollback()
        logger.error(f"Error initializing database: {e}")
    finally:
        db.close()
