"""Rule-based chatbot with recommendation-aware responses for v2.0."""
import re
from typing import Optional, List, Dict, Any


KEYWORDS_RESPONSES = [
    (r"hello|hi|namaste", "Hello! Welcome to AgriAI. Ask any question about your crop."),
    (r"irrigation|watering|water", "Your plan includes irrigation guidance. Irrigate 2-4 times per week based on water availability. Keep soil moist, avoid overwatering."),
    (r"fertilizer|manure|fertilisers", "Fertilizer recommendations for your soil and crop are in the right panel. Apply basal dressing at sowing and top dressing later."),
    (r"pest|disease", "For pests or diseases, consult your local agriculture extension centre. Prefer organic pesticides."),
    (r"cost|investment", "Estimated cost is in your plan. Actual cost depends on weather and market."),
    (r"yield|production", "Yield depends on soil, weather, and care. Regular irrigation and fertilizer improve yield."),
    (r"day|today|what to do", "Check the day-to-day plan in the right panel for today's tasks with dates."),
    (r"weather|rain", "Adjust irrigation and fertilizer timing based on weather. Reduce irrigation after rain."),
    (r"thanks|thank you", "You're welcome! Feel free to ask more questions."),
]


def _best_profit_crop(recommendations: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not recommendations:
        return None
    return max(recommendations, key=lambda item: item.get("estimated_profit_max", 0))


def _least_water_crop(recommendations: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not recommendations:
        return None
    low_risk = [r for r in recommendations if r.get("risk_score") == "Low"]
    if low_risk:
        return max(low_risk, key=lambda item: item.get("suitability_score", 0))
    return min(recommendations, key=lambda item: item.get("estimated_investment_cost", 0))


def get_response(user_message: str, crop_name: str = "", recommendations: Optional[List[Dict[str, Any]]] = None) -> str:
    """Return rule-based response for user message."""
    text = (user_message or "").strip().lower()
    if not text:
        return "Please type your question."

    for pattern, response in KEYWORDS_RESPONSES:
        if re.search(pattern, text, re.IGNORECASE):
            return response

    recommendations = recommendations or []
    if "best crop" in text or "which crop is best" in text:
        if recommendations:
            top = recommendations[0]
            return (
                f"Best crop for your current inputs is {top['crop_name']} with suitability score "
                f"{top['suitability_score']}/100 and risk {top['risk_score']}."
            )
        return "For your field, I recommend checking crop score from the right panel recommendations."

    if "high profit" in text or "which crop gives high profit" in text:
        best = _best_profit_crop(recommendations)
        if best:
            return (
                f"Highest profit option is {best['crop_name']} with estimated profit range ₹{best['estimated_profit_min']:,}"
                f" to ₹{best['estimated_profit_max']:,}."
            )
        return "High-profit crop depends on your weather and soil; run recommendation for exact numbers."

    if "less water" in text or "needs less water" in text:
        least = _least_water_crop(recommendations)
        if least:
            return (
                f"For lower water requirement, prefer {least['crop_name']} with suitability "
                f"{least['suitability_score']}/100."
            )
        return "Millet, pulses, and chickpea usually need less water than paddy/sugarcane."

    if any(w in text for w in ["?", "how", "what", "when", "why"]):
        return (
            f"Thanks for your question. "
            f"AgriAI provides basic guidance for your '{crop_name}' crop. "
            "Check the right panel for your plan and day-to-day tasks. Contact your agriculture extension centre for detailed advice."
        )

    return (
        f"I can help with your '{crop_name}' crop. "
        "Ask about irrigation, fertilizers, pest control, or daily tasks. "
        "Or check your plan in the right panel."
    )
