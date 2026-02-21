"""Plan router: get full plan with weather placeholder."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models import FarmerProfile, Field
from ..schemas import PlanResponse, CropPlan, WeatherPlaceholder
from ..ai_crop_planner import generate_ai_crop_plan, ensure_plan_images

router = APIRouter(prefix="/api/plan", tags=["plan"])


@router.get("/{field_id}", response_model=PlanResponse)
async def get_plan(
    field_id: int,
    crop_name: Optional[str] = None,
    month: Optional[int] = None,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = db.query(Field).filter(Field.id == field_id, Field.farmer_id == farmer.id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Crop/Field not found")
    selected_crop = (crop_name or field.crop_name).strip() or field.crop_name
    plan_month = month if month and month > 0 else 1
    should_regenerate = (
        not field.plan_json
        or not isinstance(field.plan_json, dict)
        or not field.plan_json.get("monthly_plans")
        or selected_crop.lower() != field.crop_name.lower()
    )

    if should_regenerate:
        try:
            plan = await generate_ai_crop_plan(
                land_area_acres=field.land_area_acres,
                soil_type=field.soil_type,
                crop_name=selected_crop,
                water_availability=field.water_availability,
                investment_level=field.investment_level,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        if selected_crop.lower() == field.crop_name.lower():
            field.plan_json = plan
            db.commit()
    else:
        plan = field.plan_json

    plan, images_changed = ensure_plan_images(plan, selected_crop)
    if images_changed and selected_crop.lower() == field.crop_name.lower():
        field.plan_json = plan
        db.commit()

    monthly_plans = plan.get("monthly_plans") or []
    if monthly_plans:
        selected_month = next(
            (m for m in monthly_plans if int(m.get("month_number", 0)) == plan_month),
            monthly_plans[0],
        )
        plan["day_plan"] = selected_month.get("day_plan", [])

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
