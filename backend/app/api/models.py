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
        # User requested no default models, assign dynamically according to usage and task
        db.query(ModelConfig).update({ModelConfig.is_default: False})
        update_data.is_default = False
        model.is_enabled = True

    update_dict = update_data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(model, k, v)
    
    if model.is_default:
        model.is_default = False
                
    model.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(model)
    return model

@router.post("/refresh")
async def refresh_models(db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    try:
        allowed_ids = ["nvidia/nemotron-3-super-120b-a12b", "nvidia/nemotron-3-ultra-550b-a55b", "openai/gpt-oss-120b", "z-ai/glm-5.2"]
        db.query(ModelConfig).filter(~ModelConfig.model_id.in_(allowed_ids)).delete(synchronize_session=False)
        db.query(ModelConfig).update({ModelConfig.is_default: False})
        db.commit()
        return {"status": "success", "models_count": len(allowed_ids)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
