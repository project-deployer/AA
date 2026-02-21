"""Plan router: get full plan with weather placeholder."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models import FarmerProfile, Field
from ..schemas import PlanResponse, CropPlan, WeatherPlaceholder

router = APIRouter(prefix="/api/plan", tags=["plan"])


@router.get("/{field_id}", response_model=PlanResponse)
def get_plan(
    field_id: int,
    crop_name: Optional[str] = None,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = db.query(Field).filter(Field.id == field_id, Field.farmer_id == farmer.id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Crop/Field not found")
    selected_crop = (crop_name or field.crop_name).strip() or field.crop_name
    should_regenerate = (
        not field.plan_json
        or selected_crop.lower() != field.crop_name.lower()
    )

    if should_regenerate:
        from ..crop_rules import generate_plan
        plan = generate_plan(
            land_area_acres=field.land_area_acres,
            soil_type=field.soil_type,
            crop_name=selected_crop,
            water_availability=field.water_availability,
            investment_level=field.investment_level,
        )
        if selected_crop.lower() == field.crop_name.lower():
            field.plan_json = plan
            db.commit()
    else:
        plan = field.plan_json

    now = datetime.now()
    plan = CropPlan(**plan)
    progress = min(1.0, 0.15)
    return PlanResponse(
        crop_name=selected_crop,
        weather=WeatherPlaceholder(),
        current_date=now.strftime("%d %b %Y"),
        current_time=now.strftime("%I:%M %p"),
        duration_progress=progress,
        plan=plan,
    )
