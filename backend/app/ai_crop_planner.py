"""AI-generated crop planning service with month-wise and day-wise schedule."""
import json
import math
import calendar
from datetime import date, timedelta
from typing import Any, Dict, List
from urllib.parse import quote_plus

import httpx

from .config import settings

HF_PLAN_MODEL_CANDIDATES = [
    "mistralai/Mistral-7B-Instruct-v0.3",
    "meta-llama/Llama-3.1-8B-Instruct",
    "Qwen/Qwen2.5-7B-Instruct",
]
HF_CHAT_COMPLETIONS_URL = "https://router.huggingface.co/v1/chat/completions"
_ALLOWED_ICONS = {"sprout", "water", "shield-check", "sun", "tractor", "leaf"}

_ICON_KEYWORDS = {
    "sprout": "seedling,planting,farm",
    "water": "irrigation,water,field",
    "shield-check": "pest-control,crop,field",
    "sun": "sunlight,crop,field",
    "tractor": "tractor,field,farming",
    "leaf": "crop,plant,agriculture",
}


def _month_anchor(start: date, month_index: int) -> date:
    month = start.month - 1 + month_index
    year = start.year + month // 12
    month = month % 12 + 1
    return date(year, month, 1)


def _task_image_url(icon: str, crop_name: str) -> str:
    keywords = _ICON_KEYWORDS.get(icon, "crop,plant,agriculture")
    crop_term = crop_name.strip().lower().replace(" ", "-")
    query = quote_plus(f"{keywords},{crop_term}")
    return f"https://source.unsplash.com/featured/320x180?{query}"


def ensure_plan_images(plan: Dict[str, Any], crop_name: str) -> tuple[Dict[str, Any], bool]:
    """Ensure every day item has an image_url; returns updated plan and a changed flag."""
    if not isinstance(plan, dict):
        return plan, False

    changed = False
    monthly_plans = plan.get("monthly_plans") or []
    for month in monthly_plans:
        day_plan = month.get("day_plan") or []
        for item in day_plan:
            if not item.get("image_url"):
                icon = str(item.get("icon") or "leaf")
                item["image_url"] = _task_image_url(icon, crop_name)
                changed = True

    day_plan = plan.get("day_plan") or []
    for item in day_plan:
        if not item.get("image_url"):
            icon = str(item.get("icon") or "leaf")
            item["image_url"] = _task_image_url(icon, crop_name)
            changed = True

    plan["monthly_plans"] = monthly_plans
    plan["day_plan"] = day_plan
    return plan, changed


def _extract_json_object(raw_text: str) -> Dict[str, Any]:
    text = (raw_text or "").strip()
    if not text:
        raise ValueError("Empty AI response")

    if "```" in text:
        text = text.replace("```json", "```")
        blocks = [b.strip() for b in text.split("```") if b.strip()]
        for block in blocks:
            if block.startswith("{") and block.endswith("}"):
                text = block
                break

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


def _normalize_day_plan_items(items: List[Dict[str, Any]], max_days: int) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for idx, item in enumerate(items[:max_days], start=1):
        icon = str(item.get("icon", "leaf")).strip().lower()
        if icon not in _ALLOWED_ICONS:
            icon = "leaf"

        normalized.append(
            {
                "day": int(item.get("day", idx)),
                "date": str(item.get("date") or f"Day {idx}"),
                "title": str(item.get("title") or f"Task for Day {idx}"),
                "description": str(item.get("description") or "Inspect crop stage, apply required inputs, and document field observations for this day."),
                "icon": icon,
                "image_url": str(item.get("image_url") or ""),
            }
        )
    return normalized


def _default_day_item(crop_name: str, month_anchor: date, day: int, month_number: int) -> Dict[str, Any]:
    date_value = month_anchor.replace(day=day)
    activity_type = day % 6
    if activity_type == 1:
        title = "Soil moisture and root-zone check"
        description = "Check topsoil and root-zone moisture. If moisture is low, schedule irrigation in early morning. Avoid overwatering to protect root health."
        icon = "water"
    elif activity_type == 2:
        title = "Nutrient and fertilizer application"
        description = "Apply stage-appropriate nutrients in split dose. Observe leaf color and growth response. Record quantity applied for cost and yield tracking."
        icon = "sprout"
    elif activity_type == 3:
        title = "Pest and disease scouting"
        description = "Walk across the field and inspect leaves, stems, and lower canopy. Remove infected plant parts and apply recommended control measures if needed."
        icon = "shield-check"
    elif activity_type == 4:
        title = "Weeding and field sanitation"
        description = "Remove weeds near crop rows and bunds. Keep channels clean for better water flow. Maintain field hygiene to reduce pest pressure."
        icon = "tractor"
    elif activity_type == 5:
        title = "Sunlight and canopy management"
        description = "Assess canopy density and sunlight penetration. Prune or adjust spacing where needed to improve airflow and reduce disease risk."
        icon = "sun"
    else:
        title = "Growth recording and planning"
        description = "Record plant height, flowering/fruiting status, and weather impact. Use observations to plan next day irrigation, nutrition, and protection tasks."
        icon = "leaf"

    title = f"{crop_name}: {title}"
    return {
        "day": day,
        "date": date_value.strftime("%d/%m/%Y"),
        "title": title,
        "description": f"Month {month_number} • {description}",
        "icon": icon,
        "image_url": _task_image_url(icon, crop_name),
    }


def _default_monthly_plans(crop_name: str, duration_days: int, start_date: date) -> List[Dict[str, Any]]:
    duration_months = max(1, math.ceil(duration_days / 30))
    plans: List[Dict[str, Any]] = []

    for month in range(1, duration_months + 1):
        month_start = _month_anchor(start_date, month - 1)
        max_days = calendar.monthrange(month_start.year, month_start.month)[1]
        day_plan: List[Dict[str, Any]] = []

        for day in range(1, max_days + 1):
            day_plan.append(_default_day_item(crop_name, month_start, day, month))

        plans.append(
            {
                "month_number": month,
                "month_label": month_start.strftime("%B %Y"),
                "focus": "Detailed crop growth, nutrition, irrigation, and crop protection schedule",
                "day_plan": day_plan,
            }
        )

    return plans


def _normalize_plan(ai_plan: Dict[str, Any], crop_name: str, duration_days: int) -> Dict[str, Any]:
    start_date = date.today().replace(day=1)

    raw_duration = ai_plan.get("duration_days", duration_days)
    normalized_duration = max(30, int(raw_duration))

    duration_months = max(1, math.ceil(normalized_duration / 30))
    raw_monthly = ai_plan.get("monthly_plans") or []

    monthly_plans: List[Dict[str, Any]] = []
    for idx in range(duration_months):
        month_number = idx + 1
        raw_month = raw_monthly[idx] if idx < len(raw_monthly) and isinstance(raw_monthly[idx], dict) else {}
        month_start = _month_anchor(start_date, idx)
        max_days = calendar.monthrange(month_start.year, month_start.month)[1]

        raw_day_plan = raw_month.get("day_plan") if isinstance(raw_month.get("day_plan"), list) else []
        normalized_day_plan = _normalize_day_plan_items(raw_day_plan, max_days=max_days)

        ai_by_day = {int(item.get("day", 0)): item for item in normalized_day_plan if int(item.get("day", 0)) > 0}
        filled_day_plan: List[Dict[str, Any]] = []
        for day in range(1, max_days + 1):
            source = ai_by_day.get(day)
            if source:
                icon = source.get("icon", "leaf")
                day_title = source.get("title") or _default_day_item(crop_name, month_start, day, month_number)["title"]
                day_description = source.get("description") or _default_day_item(crop_name, month_start, day, month_number)["description"]
                image_url = source.get("image_url") or _task_image_url(icon, crop_name)
                filled_day_plan.append(
                    {
                        "day": day,
                        "date": month_start.replace(day=day).strftime("%d/%m/%Y"),
                        "title": str(day_title),
                        "description": str(day_description),
                        "icon": str(icon),
                        "image_url": str(image_url),
                    }
                )
            else:
                filled_day_plan.append(_default_day_item(crop_name, month_start, day, month_number))

        monthly_plans.append(
            {
                "month_number": month_number,
                "month_label": str(raw_month.get("month_label") or month_start.strftime("%B %Y")),
                "focus": str(raw_month.get("focus") or "Detailed crop growth, nutrition, irrigation, and crop protection schedule"),
                "day_plan": filled_day_plan,
            }
        )

    if not monthly_plans:
        monthly_plans = _default_monthly_plans(crop_name, normalized_duration, start_date)

    first_month_day_plan = monthly_plans[0]["day_plan"] if monthly_plans else []

    return {
        "crop_name": str(ai_plan.get("crop_name") or crop_name),
        "duration_days": normalized_duration,
        "estimated_cost": float(ai_plan.get("estimated_cost") or 0),
        "expected_yield": str(ai_plan.get("expected_yield") or "AI estimate unavailable"),
        "estimated_profit": float(ai_plan.get("estimated_profit") or 0),
        "fertilizer_recommendations": [str(x) for x in (ai_plan.get("fertilizer_recommendations") or [])][:8],
        "irrigation_guidance": str(ai_plan.get("irrigation_guidance") or "Follow stage-wise irrigation based on local weather and soil moisture; prefer morning irrigation and avoid waterlogging."),
        "monthly_plans": monthly_plans,
        "day_plan": first_month_day_plan,
    }


async def generate_ai_crop_plan(
    land_area_acres: float,
    soil_type: str,
    crop_name: str,
    water_availability: str,
    investment_level: str,
) -> Dict[str, Any]:
    """Generate a crop plan from AI as structured JSON with monthly/day-wise tasks."""
    hf_token = (settings.hf_token or "").strip()
    if not hf_token:
        raise ValueError("HF_TOKEN is missing. Configure it in backend .env to generate AI plans.")

    system_prompt = (
        "You are an expert agronomist for Indian farming conditions. "
        "Generate realistic crop plans in clear, practical language. "
        "Always return valid JSON only."
    )

    user_prompt = f"""
Generate a complete crop plan for this farm profile.

Farm profile:
- Crop: {crop_name}
- Land area (acres): {land_area_acres}
- Soil type: {soil_type}
- Water availability: {water_availability}
- Investment level: {investment_level}

Output JSON schema exactly:
{{
  "crop_name": "string",
  "duration_days": number,
  "estimated_cost": number,
  "expected_yield": "string",
  "estimated_profit": number,
  "fertilizer_recommendations": ["string"],
  "irrigation_guidance": "string",
  "monthly_plans": [
    {{
      "month_number": number,
      "month_label": "Month 1",
      "focus": "string",
      "day_plan": [
        {{
          "day": number,
          "date": "DD/MM/YYYY",
          "title": "string",
          "description": "clear action for that day",
          "icon": "sprout|water|shield-check|sun|tractor|leaf"
        }}
      ]
    }}
  ]
}}

Rules:
- Plan should cover full crop duration month-wise.
- Each month must include daily tasks for every date in that month.
- Write each daily description as clear and detailed practical actions (2-3 short sentences).
- Include specific operations: irrigation, nutrition, pest monitoring, weeding, and growth checks where relevant.
- Do not include markdown, explanation, or extra keys outside JSON.
""".strip()

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    errors: List[str] = []
    async with httpx.AsyncClient(timeout=40.0) as client:
        for model_id in HF_PLAN_MODEL_CANDIDATES:
            response = await client.post(
                HF_CHAT_COMPLETIONS_URL,
                headers={
                    "Authorization": f"Bearer {hf_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model_id,
                    "messages": messages,
                    "max_tokens": 3500,
                    "temperature": 0.3,
                    "top_p": 0.9,
                    "response_format": {"type": "json_object"},
                },
            )

            if response.status_code != 200:
                errors.append(f"{model_id}: {response.status_code} {response.text[:150]}")
                continue

            payload = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            content = (
                ((payload.get("choices") or [{}])[0].get("message") or {}).get("content", "")
                if isinstance(payload, dict)
                else ""
            )
            if not content:
                errors.append(f"{model_id}: empty content")
                continue

            try:
                parsed = _extract_json_object(content)
                return _normalize_plan(parsed, crop_name=crop_name, duration_days=120)
            except Exception as exc:
                errors.append(f"{model_id}: invalid JSON ({exc})")

    raise RuntimeError("AI crop plan generation failed: " + " | ".join(errors[:3]))
