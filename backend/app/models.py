"""ORM models for AgriAI."""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base


class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(128), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    display_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    fields = relationship("Field", back_populates="farmer", cascade="all, delete-orphan")


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmer_profiles.id"), nullable=False)
    name = Column(String(255), default="My Field")
    land_area_acres = Column(Float, nullable=False)
    soil_type = Column(String(50), nullable=False)
    crop_name = Column(String(100), nullable=False)
    water_availability = Column(String(20), nullable=False)  # low, medium, high
    investment_level = Column(String(20), nullable=False)   # low, medium, high
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    plan_json = Column(JSON, nullable=True)  # Generated plan stored here

    farmer = relationship("FarmerProfile", back_populates="fields")
    chat_messages = relationship("ChatMessage", back_populates="field", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    field = relationship("Field", back_populates="chat_messages")


class WeatherLog(Base):
    __tablename__ = "weather_logs"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmer_profiles.id"), nullable=False)
    location = Column(String(255), nullable=False)
    temperature_c = Column(Float, nullable=False)
    rainfall_mm = Column(Float, nullable=False)
    condition = Column(String(100), nullable=False)
    source = Column(String(50), nullable=False, default="fallback")
    raw_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CropRecommendation(Base):
    __tablename__ = "crop_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmer_profiles.id"), nullable=False)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)
    soil_type = Column(String(50), nullable=False)
    area_acres = Column(Float, nullable=False)
    location = Column(String(255), nullable=False)
    season = Column(String(20), nullable=False)
    water_availability = Column(String(20), nullable=False)
    investment_level = Column(String(20), nullable=False)
    top_recommendations = Column(JSON, nullable=False)
    weather_snapshot = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SoilCropMatrix(Base):
    __tablename__ = "soil_crop_matrix"

    id = Column(Integer, primary_key=True, index=True)
    soil_type = Column(String(50), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False)
    base_score = Column(Integer, nullable=False)
    water_need = Column(String(20), nullable=False, default="medium")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
