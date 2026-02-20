"""Crops router: CRUD for fields, generate plan."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models import FarmerProfile, Field, CropRecommendation
from ..schemas import FieldCreate, FieldUpdate, FieldResponse, CropPlan, CropRecommendationItem
from ..crop_rules import generate_plan
from ..recommendation_engine import fetch_weather, generate_recommendations, score_single_crop

router = APIRouter(prefix="/api/crops", tags=["crops"])


@router.get("", response_model=list[FieldResponse])
def list_crops(
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fields = db.query(Field).filter(Field.farmer_id == farmer.id).order_by(Field.created_at.desc()).all()
    return [_field_to_response(f) for f in fields]


@router.post("", response_model=FieldResponse)
def create_crop(
    body: FieldCreate,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    selected_crop = (body.crop_name or "").strip()
    if not selected_crop:
        weather = fetch_weather(body.location)
        recommendations = generate_recommendations(
            soil_type=body.soil_type,
            area_acres=body.land_area_acres,
            location=body.location,
            season=body.season,
            water_availability=body.water_availability,
            investment_level=body.investment_level,
            weather=weather,
        )
        if not recommendations:
            raise HTTPException(status_code=400, detail="No crop recommendation available")
        selected_crop = recommendations[0]["crop_name"]
    else:
        recommendations = []
        weather = None

    plan = generate_plan(
        land_area_acres=body.land_area_acres,
        soil_type=body.soil_type,
        crop_name=selected_crop,
        water_availability=body.water_availability,
        investment_level=body.investment_level,
    )
    field = Field(
        farmer_id=farmer.id,
        name=body.name,
        land_area_acres=body.land_area_acres,
        soil_type=body.soil_type,
        crop_name=selected_crop,
        water_availability=body.water_availability,
        investment_level=body.investment_level,
        plan_json=plan,
    )
    db.add(field)
    db.commit()
    db.refresh(field)

    if recommendations and weather:
        db.add(
            CropRecommendation(
                farmer_id=farmer.id,
                field_id=field.id,
                soil_type=body.soil_type,
                area_acres=body.land_area_acres,
                location=body.location,
                season=body.season,
                water_availability=body.water_availability,
                investment_level=body.investment_level,
                top_recommendations=recommendations,
                weather_snapshot={
                    "location": weather.location,
                    "temperature_c": weather.temperature_c,
                    "rainfall_mm": weather.rainfall_mm,
                    "condition": weather.condition,
                    "source": weather.source,
                },
            )
        )
        db.commit()

    return _field_to_response(field)


@router.put("/{field_id}", response_model=FieldResponse)
def update_crop(
    field_id: int,
    body: FieldUpdate,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = db.query(Field).filter(Field.id == field_id, Field.farmer_id == farmer.id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Crop not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(field, k, v)
    if any(k in body.model_dump(exclude_unset=True) for k in ["land_area_acres", "soil_type", "crop_name", "water_availability", "investment_level"]):
        plan = generate_plan(
            land_area_acres=field.land_area_acres,
            soil_type=field.soil_type,
            crop_name=field.crop_name,
            water_availability=field.water_availability,
            investment_level=field.investment_level,
        )
        field.plan_json = plan
    db.commit()
    db.refresh(field)
    return _field_to_response(field)


@router.delete("/{field_id}")
def delete_crop(
    field_id: int,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = db.query(Field).filter(Field.id == field_id, Field.farmer_id == farmer.id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Crop not found")
    db.delete(field)
    db.commit()
    return {"success": True}


@router.get("/{field_id}/plan", response_model=CropPlan)
def get_plan(
    field_id: int,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = db.query(Field).filter(Field.id == field_id, Field.farmer_id == farmer.id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Crop not found")
    if not field.plan_json:
        plan = generate_plan(
            land_area_acres=field.land_area_acres,
            soil_type=field.soil_type,
            crop_name=field.crop_name,
            water_availability=field.water_availability,
            investment_level=field.investment_level,
        )
        field.plan_json = plan
        db.commit()
    return CropPlan(**field.plan_json)


@router.get("/{field_id}/score", response_model=CropRecommendationItem)
def get_crop_score(
    field_id: int,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = db.query(Field).filter(Field.id == field_id, Field.farmer_id == farmer.id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Crop not found")

    rec = (
        db.query(CropRecommendation)
        .filter(CropRecommendation.farmer_id == farmer.id, CropRecommendation.field_id == field.id)
        .order_by(CropRecommendation.created_at.desc())
        .first()
    )
    location = rec.location if rec else "Hyderabad"
    season = rec.season if rec else "kharif"

    weather = fetch_weather(location)
    score = score_single_crop(
        crop_name=field.crop_name,
        soil_type=field.soil_type,
        area_acres=field.land_area_acres,
        location=location,
        season=season,
        water_availability=field.water_availability,
        investment_level=field.investment_level,
        weather=weather,
    )
    return CropRecommendationItem(**score)


def _field_to_response(f: Field) -> FieldResponse:
    return FieldResponse(
        id=f.id,
        name=f.name,
        land_area_acres=f.land_area_acres,
        soil_type=f.soil_type,
        crop_name=f.crop_name,
        water_availability=f.water_availability,
        investment_level=f.investment_level,
        created_at=f.created_at,
        plan=CropPlan(**f.plan_json) if f.plan_json else None,
    )
