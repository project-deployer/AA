"""Rule-based crop planning engine. Generates plans from field inputs."""
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Crop database: duration (days), base cost per acre, yield range, fertilizer types
CROP_DB = {
    "paddy": {"duration": 120, "base_cost": 25000, "yield_low": "25", "yield_high": "35", "unit": "quintals"},
    "wheat": {"duration": 120, "base_cost": 18000, "yield_low": "35", "yield_high": "50", "unit": "quintals"},
    "cotton": {"duration": 180, "base_cost": 40000, "yield_low": "8", "yield_high": "12", "unit": "quintals"},
    "sugarcane": {"duration": 365, "base_cost": 60000, "yield_low": "400", "yield_high": "500", "unit": "quintals"},
    "maize": {"duration": 100, "base_cost": 22000, "yield_low": "40", "yield_high": "55", "unit": "quintals"},
    "chickpea": {"duration": 100, "base_cost": 12000, "yield_low": "8", "yield_high": "12", "unit": "quintals"},
    "mustard": {"duration": 120, "base_cost": 15000, "yield_low": "12", "yield_high": "18", "unit": "quintals"},
    "groundnut": {"duration": 110, "base_cost": 20000, "yield_low": "15", "yield_high": "22", "unit": "quintals"},
    "soybean": {"duration": 90, "base_cost": 18000, "yield_low": "20", "yield_high": "30", "unit": "quintals"},
    "rice": {"duration": 120, "base_cost": 25000, "yield_low": "25", "yield_high": "35", "unit": "quintals"},
    "bajra": {"duration": 80, "base_cost": 10000, "yield_low": "12", "yield_high": "18", "unit": "quintals"},
    "jowar": {"duration": 100, "base_cost": 12000, "yield_low": "15", "yield_high": "25", "unit": "quintals"},
}


SOIL_FERTILIZER = {
    "black": ["NPK 20:20:20", "Urea", "Compost", "Potash"],
    "red": ["NPK 19:19:19", "Rock Phosphate", "Compost", "Gypsum"],
    "alluvial": ["NPK 20:20:20", "Urea", "DAP", "Compost"],
    "laterite": ["Lime", "NPK 12:32:16", "Organic manure", "Micronutrients"],
    "clay": ["Gypsum", "Compost", "NPK 20:20:20", "Vermicompost"],
    "sandy": ["Organic manure", "NPK 17:17:17", "Mulching", "Compost"],
    "loam": ["NPK 20:20:20", "Compost", "Urea", "DAP"],
}


def _normalize_crop(crop_name: str) -> str:
    return crop_name.strip().lower().replace(" ", "")


def _get_crop_data(crop_name: str) -> Dict:
    key = _normalize_crop(crop_name)
    for k, v in CROP_DB.items():
        if k in key or key in k:
            return v
    return CROP_DB["paddy"]


def _irrigation_guidance(water: str, crop: str) -> str:
    low = "Low water: Irrigate 2 times per week. Use drip irrigation. Rely on rainfall when possible."
    medium = "Medium water: Irrigate 3-4 times per week. Use mulching to retain soil moisture."
    high = "High water: Regular irrigation. Adjust water based on crop growth stage."
    mapping = {"low": low, "medium": medium, "high": high}
    return mapping.get(water, medium)


def _cost_multiplier(investment: str) -> float:
    return {"low": 0.8, "medium": 1.0, "high": 1.25}[investment]


def _profit_multiplier(investment: str) -> float:
    return {"low": 0.9, "medium": 1.0, "high": 1.15}[investment]


def generate_plan(
    land_area_acres: float,
    soil_type: str,
    crop_name: str,
    water_availability: str,
    investment_level: str,
) -> Dict[str, Any]:
    """Generate a full crop plan based on input parameters."""
    crop_data = _get_crop_data(crop_name)
    duration = crop_data["duration"]
    base_cost = crop_data["base_cost"] * land_area_acres
    cost_mult = _cost_multiplier(investment_level)
    profit_mult = _profit_multiplier(investment_level)
    total_cost = round(base_cost * cost_mult)
    yield_low = crop_data["yield_low"]
    yield_high = crop_data["yield_high"]
    unit = crop_data["unit"]
    expected_yield = f"{yield_low}-{yield_high} {unit} per acre"
    avg_yield_val = (float(yield_low) + float(yield_high)) / 2 * land_area_acres
    price_per_q = 2000 if "paddy" in _normalize_crop(crop_name) or "rice" in _normalize_crop(crop_name) else 2500
    revenue = avg_yield_val * price_per_q
    profit = round((revenue - total_cost) * profit_mult)

    fertilizers = SOIL_FERTILIZER.get(soil_type.lower(), SOIL_FERTILIZER["alluvial"])
    irrigation = _irrigation_guidance(water_availability, crop_name)

    start_date = datetime.now().date()
    day_plan = []
    phases = [
        (1, 7, "Seed preparation", "Select seeds, treat them, and prepare for sowing."),
        (8, 14, "Land preparation", "Plough, add manure, and level the field."),
        (15, 30, "Sowing", "Sow at the right time. Maintain proper seed depth and spacing."),
        (31, 60, "Weeding", "Remove weeds and apply first irrigation."),
        (61, 90, "Irrigation and fertilizer", "Regular irrigation and top dressing."),
        (91, duration, "Crop care", "Pest and disease control. Monitor until harvest."),
    ]
    day_idx = 0
    for d in range(1, min(duration + 1, 31)):
        dt = start_date + timedelta(days=d - 1)
        phase_title = "Crop care"
        phase_desc = "Regular monitoring and necessary care."
        for start, end, title, desc in phases:
            if start <= d <= end:
                phase_title = title
                phase_desc = desc
                break
        day_plan.append({
            "day": d,
            "date": dt.strftime("%d/%m/%Y"),
            "title": phase_title,
            "description": phase_desc,
            "icon": "sprout" if d <= 14 else "water" if d <= 60 else "shield-check",
        })
        day_idx += 1
        if day_idx >= 14:
            break

    return {
        "crop_name": crop_name,
        "duration_days": duration,
        "estimated_cost": total_cost,
        "expected_yield": expected_yield,
        "estimated_profit": profit,
        "fertilizer_recommendations": fertilizers,
        "irrigation_guidance": irrigation,
        "day_plan": day_plan,
    }
