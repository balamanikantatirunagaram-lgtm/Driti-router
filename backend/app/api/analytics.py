from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.analytics import get_analytics_summary

router = APIRouter()

@router.get("/summary")
async def get_summary(period: str = Query("day", pattern="^(day|week|month|year|overall|all)$"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return await get_analytics_summary(db, period)
