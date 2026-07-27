from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.dependencies import get_db, get_current_admin
from app.models.model_config import ModelConfig
from app.services.nvidia import fetch_nvidia_models, get_nvidia_api_key
from datetime import datetime, timezone

router = APIRouter()

class ModelConfigResponse(BaseModel):
    id: int
    model_id: str
    display_name: str
    is_enabled: bool
    is_default: bool
    temperature: float
    max_tokens: int
    context_length: Optional[int] = None
    description: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}

class ModelConfigUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    is_default: Optional[bool] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

@router.get("", response_model=List[ModelConfigResponse])
def get_models(db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    return db.query(ModelConfig).all()

@router.patch("/{id}", response_model=ModelConfigResponse)
def update_model(id: int, update_data: ModelConfigUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    model = db.query(ModelConfig).filter(ModelConfig.id == id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    if update_data.is_default is True:
        db.query(ModelConfig).update({ModelConfig.is_default: False})
        model.is_enabled = True

    update_dict = update_data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(model, k, v)
    
    if model.is_enabled is False and model.is_default:
        model.is_default = False
        fallback_model = db.query(ModelConfig).filter(ModelConfig.id != id, ModelConfig.is_enabled == True).first()
        if fallback_model:
            fallback_model.is_default = True
        else:
            failsafe = db.query(ModelConfig).filter(ModelConfig.model_id == "nvidia/nemotron-3-super-120b-a12b").first()
            if failsafe and failsafe.id != id:
                failsafe.is_enabled = True
                failsafe.is_default = True
                
    model.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(model)
    return model

@router.post("/refresh")
async def refresh_models(db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    try:
        api_key = get_nvidia_api_key()
        nvidia_models = await fetch_nvidia_models(api_key)
        
        # Simple merge
        for nm in nvidia_models:
            model_id = nm.get("id")
            existing = db.query(ModelConfig).filter(ModelConfig.model_id == model_id).first()
            if not existing:
                new_model = ModelConfig(
                    model_id=model_id,
                    display_name=model_id,
                    is_enabled=False,
                    is_default=False,
                    updated_at=datetime.now(timezone.utc)
                )
                db.add(new_model)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
