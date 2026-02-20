"""AI-style crop recommendation and weather scoring utilities."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx

from .config import settings


@dataclass
class WeatherSummary:
    location: str
    temperature_c: float
    rainfall_mm: float
    condition: str
    source: str = "fallback"


SOIL_CROP_MATRIX: Dict[str, Dict[str, int]] = {
    "black": {"Cotton": 92, "Soybean": 88, "Maize": 78, "Paddy": 74},
    "red": {"Groundnut": 90, "Millet": 84, "Cotton": 80, "Pulses": 82},
    "alluvial": {"Paddy": 91, "Wheat": 90, "Sugarcane": 85, "Maize": 83},
    "clay": {"Paddy": 90, "Sugarcane": 82, "Wheat": 76, "Soybean": 70},
    "sandy": {"Groundnut": 88, "Millet": 86, "Pulses": 79, "Cotton": 76},
    "loam": {"Wheat": 88, "Maize": 86, "Paddy": 84, "Vegetables": 82},
}

SEASON_BONUS: Dict[str, Dict[str, int]] = {
    "kharif": {"Paddy": 8, "Cotton": 7, "Soybean": 6, "Maize": 5},
    "rabi": {"Wheat": 8, "Mustard": 7, "Chickpea": 6, "Barley": 5},
    "zaid": {"Maize": 6, "Vegetables": 7, "Groundnut": 5, "Pulses": 4},
}

WATER_SENSITIVITY: Dict[str, str] = {
    "Paddy": "high",
    "Sugarcane": "high",
    "Cotton": "medium",
    "Wheat": "medium",
    "Soybean": "medium",
    "Maize": "medium",
    "Mustard": "low",
    "Chickpea": "low",
    "Groundnut": "low",
    "Millet": "low",
    "Pulses": "low",
    "Vegetables": "medium",
}

BASE_FINANCIALS: Dict[str, Dict[str, int]] = {
    "Paddy": {"cost": 26000, "profit_low": 12000, "profit_high": 28000, "yield": 28},
    "Wheat": {"cost": 20000, "profit_low": 11000, "profit_high": 25000, "yield": 32},
    "Cotton": {"cost": 42000, "profit_low": 18000, "profit_high": 52000, "yield": 10},
    "Sugarcane": {"cost": 62000, "profit_low": 22000, "profit_high": 70000, "yield": 430},
    "Soybean": {"cost": 21000, "profit_low": 10000, "profit_high": 26000, "yield": 24},
    "Maize": {"cost": 24000, "profit_low": 12000, "profit_high": 30000, "yield": 40},
    "Groundnut": {"cost": 22000, "profit_low": 13000, "profit_high": 32000, "yield": 18},
    "Millet": {"cost": 13000, "profit_low": 7000, "profit_high": 17000, "yield": 15},
    "Pulses": {"cost": 15000, "profit_low": 8000, "profit_high": 19000, "yield": 11},
    "Mustard": {"cost": 17000, "profit_low": 9000, "profit_high": 22000, "yield": 14},
    "Chickpea": {"cost": 16000, "profit_low": 8000, "profit_high": 20000, "yield": 10},
    "Vegetables": {"cost": 30000, "profit_low": 15000, "profit_high": 45000, "yield": 75},
}


def _normalize_soil(soil_type: str) -> str:
    if not soil_type:
        return "alluvial"
    normalized = soil_type.strip().lower()
    if normalized in SOIL_CROP_MATRIX:
        return normalized
    if "black" in normalized:
        return "black"
    if "red" in normalized:
        return "red"
    if "clay" in normalized:
        return "clay"
    if "sand" in normalized:
        return "sandy"
    if "loam" in normalized:
        return "loam"
    return "alluvial"


def _season_key(season: str) -> str:
    value = (season or "").strip().lower()
    return value if value in SEASON_BONUS else "kharif"


def fetch_weather(location: str) -> WeatherSummary:
    api_key = settings.weather_api_key
    if not api_key:
        return WeatherSummary(location=location, temperature_c=28.0, rainfall_mm=2.0, condition="Partly Cloudy")

    try:
        geo_url = "https://api.openweathermap.org/geo/1.0/direct"
        geo = httpx.get(geo_url, params={"q": location, "limit": 1, "appid": api_key}, timeout=8.0)
        geo.raise_for_status()
        geodata = geo.json() or []
        if not geodata:
            raise ValueError("Location not found")
        lat = geodata[0]["lat"]
        lon = geodata[0]["lon"]

        weather_url = "https://api.openweathermap.org/data/2.5/weather"
        weather = httpx.get(weather_url, params={"lat": lat, "lon": lon, "units": "metric", "appid": api_key}, timeout=8.0)
        weather.raise_for_status()
        weather_json = weather.json()

        forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
        forecast = httpx.get(forecast_url, params={"lat": lat, "lon": lon, "units": "metric", "appid": api_key}, timeout=8.0)
        rainfall_mm = 0.0
        if forecast.is_success:
            forecast_json = forecast.json()
            items = (forecast_json or {}).get("list", [])[:8]
            rainfall_mm = round(sum((item.get("rain") or {}).get("3h", 0.0) for item in items), 2)

        return WeatherSummary(
            location=location,
            temperature_c=float((weather_json.get("main") or {}).get("temp", 28.0)),
            rainfall_mm=rainfall_mm,
            condition=((weather_json.get("weather") or [{}])[0]).get("main", "Clear"),
            source="openweather",
        )
    except Exception:
        return WeatherSummary(location=location, temperature_c=28.0, rainfall_mm=2.0, condition="Partly Cloudy")


def _weather_adjustment(crop_name: str, weather: WeatherSummary) -> int:
    score = 0
    water_need = WATER_SENSITIVITY.get(crop_name, "medium")
    if water_need == "high" and weather.rainfall_mm >= 6:
        score += 6
    elif water_need == "high" and weather.rainfall_mm <= 1:
        score -= 7
    elif water_need == "low" and weather.rainfall_mm <= 4:
        score += 5
    elif water_need == "low" and weather.rainfall_mm >= 10:
        score -= 5

    if 22 <= weather.temperature_c <= 32:
        score += 4
    elif weather.temperature_c > 38 or weather.temperature_c < 14:
        score -= 6
    return score


def _water_adjustment(crop_name: str, water_availability: str) -> int:
    need = WATER_SENSITIVITY.get(crop_name, "medium")
    if need == water_availability:
        return 6
    if need == "high" and water_availability == "low":
        return -8
    if need == "low" and water_availability == "high":
        return -1
    return 2


def _investment_adjustment(crop_name: str, investment_level: str) -> int:
    high_cost = {"Sugarcane", "Cotton", "Vegetables"}
    low_cost = {"Millet", "Pulses", "Chickpea", "Mustard"}
    if investment_level == "low" and crop_name in high_cost:
        return -8
    if investment_level == "high" and crop_name in high_cost:
        return 5
    if investment_level == "low" and crop_name in low_cost:
        return 5
    return 1


def _risk_label(score: int) -> str:
    if score >= 80:
        return "Low"
    if score >= 60:
        return "Medium"
    return "High"


def _financials(crop_name: str, area_acres: float, investment_level: str, suitability_score: int) -> Dict[str, Any]:
    base = BASE_FINANCIALS.get(crop_name, BASE_FINANCIALS["Paddy"])
    investment_factor = {"low": 0.9, "medium": 1.0, "high": 1.2}.get(investment_level, 1.0)
    score_factor = max(0.7, min(1.25, suitability_score / 85.0))
    estimated_cost = round(base["cost"] * area_acres * investment_factor)
    profit_low = round(base["profit_low"] * area_acres * score_factor)
    profit_high = round(base["profit_high"] * area_acres * score_factor)
    expected_yield = round(base["yield"] * area_acres * score_factor, 1)
    return {
        "estimated_investment_cost": estimated_cost,
        "estimated_profit_min": min(profit_low, profit_high),
        "estimated_profit_max": max(profit_low, profit_high),
        "expected_yield_estimation": f"{expected_yield} quintals",
    }


def generate_recommendations(
    soil_type: str,
    area_acres: float,
    location: str,
    season: str,
    water_availability: str,
    investment_level: str,
    weather: Optional[WeatherSummary] = None,
) -> List[Dict[str, Any]]:
    weather = weather or fetch_weather(location)
    soil_key = _normalize_soil(soil_type)
    season_key = _season_key(season)
    candidates = SOIL_CROP_MATRIX.get(soil_key, SOIL_CROP_MATRIX["alluvial"])

    scored: List[Dict[str, Any]] = []
    for crop_name, base_score in candidates.items():
        season_delta = SEASON_BONUS.get(season_key, {}).get(crop_name, 0)
        weather_delta = _weather_adjustment(crop_name, weather)
        water_delta = _water_adjustment(crop_name, water_availability)
        investment_delta = _investment_adjustment(crop_name, investment_level)
        suitability = max(40, min(99, base_score + season_delta + weather_delta + water_delta + investment_delta))
        financial = _financials(crop_name, area_acres, investment_level, suitability)
        scored.append(
            {
                "crop_name": crop_name,
                "suitability_score": suitability,
                "risk_score": _risk_label(suitability),
                **financial,
            }
        )

    scored.sort(key=lambda item: item["suitability_score"], reverse=True)
    return scored[:3]


def score_single_crop(
    crop_name: str,
    soil_type: str,
    area_acres: float,
    location: str,
    season: str,
    water_availability: str,
    investment_level: str,
    weather: Optional[WeatherSummary] = None,
) -> Dict[str, Any]:
    weather = weather or fetch_weather(location)
    full = generate_recommendations(
        soil_type=soil_type,
        area_acres=area_acres,
        location=location,
        season=season,
        water_availability=water_availability,
        investment_level=investment_level,
        weather=weather,
    )
    for item in full:
        if item["crop_name"].lower() == crop_name.lower():
            return item

    fallback = _financials(crop_name, area_acres, investment_level, 60)
    return {
        "crop_name": crop_name,
        "suitability_score": 60,
        "risk_score": "Medium",
        **fallback,
    }
