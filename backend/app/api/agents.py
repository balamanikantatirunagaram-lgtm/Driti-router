from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.agent_profile import AgentProfile

router = APIRouter()

@router.get("/profiles")
def list_profiles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AgentProfile).all()

@router.post("/profiles")
def create_profile(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return {"status": "created"}

@router.get("/profiles/{profile_id}")
def get_profile(profile_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(AgentProfile).filter(AgentProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Not found")
    return profile

@router.patch("/profiles/{profile_id}")
def update_profile(profile_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return {"status": "updated"}

@router.delete("/profiles/{profile_id}")
def delete_profile(profile_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    profile = db.query(AgentProfile).filter(AgentProfile.id == profile_id).first()
    if profile:
        db.delete(profile)
        db.commit()
    return {"status": "deleted"}
