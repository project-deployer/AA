"""Pydantic schemas for request/response."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class AuthVerifyRequest(BaseModel):
    id_token: str
    phone: Optional[str] = None
    email: Optional[str] = None
    display_name: Optional[str] = None


class AuthVerifyResponse(BaseModel):
    success: bool = True
    farmer_id: int
    message: str = "Authenticated"


class FieldCreate(BaseModel):
    name: str = "My Field"
    land_area_acres: float = Field(..., gt=0, le=1000)
    soil_type: str = Field(..., min_length=1, max_length=50)
    crop_name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: str = Field("Hyderabad", min_length=2, max_length=255)
    season: str = Field("kharif", pattern="^(kharif|rabi|zaid)$")
    water_availability: str = Field(..., pattern="^(low|medium|high)$")
    investment_level: str = Field(..., pattern="^(low|medium|high)$")


class FieldUpdate(BaseModel):
    name: Optional[str] = None
    land_area_acres: Optional[float] = Field(None, gt=0, le=1000)
    soil_type: Optional[str] = None
    crop_name: Optional[str] = None
    water_availability: Optional[str] = None
    investment_level: Optional[str] = None


class DayPlanItem(BaseModel):
    day: int
    date: str
    title: str
    description: str
    icon: str
    image_url: Optional[str] = None


class MonthlyPlanItem(BaseModel):
    month_number: int
    month_label: str
    focus: str
    day_plan: List[DayPlanItem]


class CropPlan(BaseModel):
    crop_name: str
    duration_days: int
    estimated_cost: float
    expected_yield: str
    estimated_profit: float
    fertilizer_recommendations: List[str]
    irrigation_guidance: str
    monthly_plans: List[MonthlyPlanItem] = []
    day_plan: List[DayPlanItem]


class FieldResponse(BaseModel):
    id: int
    name: str
    land_area_acres: float
    soil_type: str
    crop_name: str
    water_availability: str
    investment_level: str
    created_at: datetime
    plan: Optional[CropPlan] = None

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    field_id: int


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse


class WeatherPlaceholder(BaseModel):
    temp: str = "28°C"
    condition: str = "Sunny"
    icon: str = "sun"


class PlanResponse(BaseModel):
    crop_name: str
    weather: WeatherPlaceholder
    current_date: str
    current_time: str
    duration_progress: float
    plan: CropPlan


class WeatherResponse(BaseModel):
    location: str
    temperature_c: float
    rainfall_mm: float
    condition: str
    source: str


class CropRecommendationItem(BaseModel):
    crop_name: str
    suitability_score: int
    risk_score: str
    expected_yield_estimation: str
    estimated_investment_cost: int
    estimated_profit_min: int
    estimated_profit_max: int


class RecommendRequest(BaseModel):
    soil_type: str = Field(..., min_length=1, max_length=50)
    area_acres: float = Field(..., gt=0, le=1000)
    location: str = Field(..., min_length=2, max_length=255)
    season: str = Field(..., pattern="^(kharif|rabi|zaid)$")
    water_availability: str = Field(..., pattern="^(low|medium|high)$")
    investment_level: str = Field(..., pattern="^(low|medium|high)$")
    field_id: Optional[int] = None


class RecommendResponse(BaseModel):
    recommendation_id: int
    weather: WeatherResponse
    recommendations: List[CropRecommendationItem]


class RecommendationHistoryItem(BaseModel):
    id: int
    field_id: Optional[int]
    soil_type: str
    area_acres: float
    location: str
    season: str
    water_availability: str
    investment_level: str
    weather: Optional[WeatherResponse]
    recommendations: List[CropRecommendationItem]
    created_at: datetime

    class Config:
        from_attributes = True
