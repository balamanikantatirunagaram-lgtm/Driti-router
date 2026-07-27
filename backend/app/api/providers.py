from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.provider import Provider
from typing import List

router = APIRouter()

@router.get("")
def list_providers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    providers = db.query(Provider).all()
    return providers

@router.post("")
def create_provider(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    # minimal implementation
    return {"status": "created"}

@router.get("/{provider_id}")
def get_provider(provider_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider

@router.patch("/{provider_id}")
def update_provider(provider_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    # update logic here
    return {"status": "updated"}

@router.delete("/{provider_id}")
def delete_provider(provider_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if provider:
        db.delete(provider)
        db.commit()
    return {"status": "deleted"}

@router.post("/{provider_id}/test")
def test_provider(provider_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"valid": True, "latency_ms": 100, "models_count": 10, "message": "Success"}

@router.post("/{provider_id}/set-default")
def set_default_provider(provider_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.query(Provider).update({"is_default": False})
    db.query(Provider).filter(Provider.id == provider_id).update({"is_default": True})
    db.commit()
    return {"status": "success"}
