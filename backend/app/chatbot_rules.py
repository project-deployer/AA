"""Rule-based chatbot for MVP. Farmer-friendly responses."""
import re
from typing import Optional


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


def get_response(user_message: str, crop_name: str = "") -> str:
    """Return rule-based response for user message."""
    text = (user_message or "").strip().lower()
    if not text:
        return "Please type your question."

    for pattern, response in KEYWORDS_RESPONSES:
        if re.search(pattern, text, re.IGNORECASE):
            return response

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
