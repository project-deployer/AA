"""Recommendation and weather APIs for AgriAI v2.0."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CropRecommendation, FarmerProfile, WeatherLog
from ..recommendation_engine import fetch_weather, generate_recommendations
from ..schemas import (
    RecommendationHistoryItem,
    RecommendRequest,
    RecommendResponse,
    WeatherResponse,
)

router = APIRouter(prefix="/api", tags=["recommendation"])


@router.post("/recommend", response_model=RecommendResponse)
def recommend_crop(
    body: RecommendRequest,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    weather = fetch_weather(body.location)
    recommendations = generate_recommendations(
        soil_type=body.soil_type,
        area_acres=body.area_acres,
        location=body.location,
        season=body.season,
        water_availability=body.water_availability,
        investment_level=body.investment_level,
        weather=weather,
    )

    db.add(
        WeatherLog(
            farmer_id=farmer.id,
            location=weather.location,
            temperature_c=weather.temperature_c,
            rainfall_mm=weather.rainfall_mm,
            condition=weather.condition,
            source=weather.source,
            raw_json={
                "temperature_c": weather.temperature_c,
                "rainfall_mm": weather.rainfall_mm,
                "condition": weather.condition,
            },
        )
    )

    rec = CropRecommendation(
        farmer_id=farmer.id,
        field_id=body.field_id,
        soil_type=body.soil_type,
        area_acres=body.area_acres,
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
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return RecommendResponse(
        recommendation_id=rec.id,
        weather=WeatherResponse(
            location=weather.location,
            temperature_c=weather.temperature_c,
            rainfall_mm=weather.rainfall_mm,
            condition=weather.condition,
            source=weather.source,
        ),
        recommendations=recommendations,
    )


@router.get("/recommend/history", response_model=list[RecommendationHistoryItem])
def recommend_history(
    field_id: int | None = Query(default=None),
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(CropRecommendation).filter(CropRecommendation.farmer_id == farmer.id)
    if field_id:
        query = query.filter(CropRecommendation.field_id == field_id)
    rows = query.order_by(CropRecommendation.created_at.desc()).limit(20).all()

    result = []
    for row in rows:
        weather = row.weather_snapshot or None
        result.append(
            RecommendationHistoryItem(
                id=row.id,
                field_id=row.field_id,
                soil_type=row.soil_type,
                area_acres=row.area_acres,
                location=row.location,
                season=row.season,
                water_availability=row.water_availability,
                investment_level=row.investment_level,
                weather=weather,
                recommendations=row.top_recommendations or [],
                created_at=row.created_at,
            )
        )
    return result


@router.get("/weather/{location}", response_model=WeatherResponse)
def weather_by_location(
    location: str,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    weather = fetch_weather(location)
    db.add(
        WeatherLog(
            farmer_id=farmer.id,
            location=weather.location,
            temperature_c=weather.temperature_c,
            rainfall_mm=weather.rainfall_mm,
            condition=weather.condition,
            source=weather.source,
            raw_json={
                "temperature_c": weather.temperature_c,
                "rainfall_mm": weather.rainfall_mm,
                "condition": weather.condition,
            },
        )
    )
    db.commit()
    return WeatherResponse(
        location=weather.location,
        temperature_c=weather.temperature_c,
        rainfall_mm=weather.rainfall_mm,
        condition=weather.condition,
        source=weather.source,
    )
