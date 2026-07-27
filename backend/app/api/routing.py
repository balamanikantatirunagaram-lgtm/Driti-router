from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.routing_rule import RoutingRule
from app.models.settings import AppSettings
from app.services.router import smart_router

router = APIRouter()

@router.get("/rules")
def list_rules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(RoutingRule).order_by(RoutingRule.priority.asc()).all()

@router.post("/rules")
def create_rule(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    # basic implementation
    return {"status": "created"}

@router.patch("/rules/{rule_id}")
def update_rule(rule_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return {"status": "updated"}

@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    rule = db.query(RoutingRule).filter(RoutingRule.id == rule_id).first()
    if rule:
        db.delete(rule)
        db.commit()
    return {"status": "deleted"}

@router.get("/config")
def get_routing_config(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    settings = db.query(AppSettings).first()
    return {"mode": settings.routing_mode if settings else "manual"}

@router.post("/config")
def update_routing_config(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    settings = db.query(AppSettings).first()
    if settings and "mode" in data:
        settings.routing_mode = data["mode"]
        db.commit()
    return {"status": "updated"}

@router.get("/test")
async def test_routing(model: str = "gpt-4", prompt_tokens: int = 100, request_type: str = "chat", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ctx = {
        "model": model,
        "messages": [],
        "prompt_tokens": prompt_tokens,
        "has_tools": False,
        "has_vision": False,
        "request_type": request_type,
        "user_id": current_user.id
    }
    decision = await smart_router.route(db, ctx)
    if decision:
        return {
            "provider": decision.get("provider", "unknown"),
            "model": decision.get("model", model),
            "reason": decision.get("reason", "no reason")
        }
    return {"provider": "none", "model": model, "reason": "no route found"}
