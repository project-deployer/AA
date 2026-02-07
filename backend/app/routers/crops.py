"""Crops router: CRUD for fields, generate plan."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models import FarmerProfile, Field
from ..schemas import FieldCreate, FieldUpdate, FieldResponse, CropPlan
from ..crop_rules import generate_plan

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
    plan = generate_plan(
        land_area_acres=body.land_area_acres,
        soil_type=body.soil_type,
        crop_name=body.crop_name,
        water_availability=body.water_availability,
        investment_level=body.investment_level,
    )
    field = Field(
        farmer_id=farmer.id,
        name=body.name,
        land_area_acres=body.land_area_acres,
        soil_type=body.soil_type,
        crop_name=body.crop_name,
        water_availability=body.water_availability,
        investment_level=body.investment_level,
        plan_json=plan,
    )
    db.add(field)
    db.commit()
    db.refresh(field)
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
