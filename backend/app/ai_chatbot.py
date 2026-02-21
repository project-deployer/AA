"""AI-powered chatbot using HuggingFace Mistral-7B-Instruct API."""
import json
from typing import Optional, List, Dict, Any
import httpx
from .chatbot_rules import get_response as get_fallback_response
from .config import settings


HF_MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.1"
HF_CHAT_MODEL_CANDIDATES = [
    "mistralai/Mistral-7B-Instruct-v0.1",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "meta-llama/Llama-3.1-8B-Instruct",
    "Qwen/Qwen2.5-7B-Instruct",
]
HF_CHAT_COMPLETIONS_URL = "https://router.huggingface.co/v1/chat/completions"
HF_LEGACY_URLS = [
    f"https://router.huggingface.co/hf-inference/models/{HF_MODEL_ID}",
    f"https://router.huggingface.co/models/{HF_MODEL_ID}",
]
SYSTEM_PROMPT = """You are AgriAI, an agriculture expert helping Indian farmers with crop advice, fertilizers, soil health, irrigation, pest control, and weather-based recommendations. 

Provide practical, actionable advice in simple language. Consider local Indian farming conditions, soil types, climate zones, and traditional practices. Always prioritize sustainable and cost-effective solutions.

When user messages include attachment markers like [Image attached: ...] or [Video attached: ...]:
- Acknowledge the attachment briefly.
- Do NOT say "I can't view/access videos/images".
- Give immediate useful guidance based on crop context and common field issues.
- Ask up to 2 concise follow-up questions if visual details are needed."""


def _prepare_user_message(user_message: str, crop_name: str = "") -> str:
    """Normalize attachment-only messages into guidance-friendly prompts."""
    raw = (user_message or "").strip()
    if not raw:
        return raw

    has_video = "[video attached:" in raw.lower()
    has_image = "[image attached:" in raw.lower()

    if not (has_video or has_image):
        return raw

    attachment_type = "video" if has_video else "image"
    crop_hint = crop_name or "the current crop"
    return (
        f"User shared a {attachment_type} from the field. "
        f"Provide practical advice for {crop_hint} based on likely issues, "
        "then ask up to 2 short questions to confirm symptoms. "
        f"Original user message: {raw}"
    )


def _build_context(crop_name: str, recommendations: Optional[List[Dict[str, Any]]]) -> str:
    """Build context string from current crop and recommendations."""
    context_parts = []
    
    if crop_name:
        context_parts.append(f"Current crop: {crop_name}")
    
    if recommendations and len(recommendations) > 0:
        context_parts.append("\nRecommended crops with scores:")
        for rec in recommendations[:3]:
            context_parts.append(
                f"- {rec.get('crop_name')}: {rec.get('suitability_score')}/100 score, "
                f"Risk: {rec.get('risk_score')}, "
                f"Profit: ₹{rec.get('estimated_profit_min', 0):,}-₹{rec.get('estimated_profit_max', 0):,}"
            )
    
    return "\n".join(context_parts) if context_parts else ""


async def get_ai_response(
    user_message: str,
    crop_name: str = "",
    recommendations: Optional[List[Dict[str, Any]]] = None,
    chat_history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """
    Get AI response from HuggingFace API with fallback to rule-based system.
    
    Args:
        user_message: User's question
        crop_name: Current crop name
        recommendations: List of crop recommendations with scores
        chat_history: Previous chat messages [{"role": "user/assistant", "content": "..."}]
    
    Returns:
        AI-generated response or fallback response
    """
    hf_token = (settings.hf_token or "").strip()
    prepared_user_message = _prepare_user_message(user_message, crop_name)
    
    # Fallback to predefined responses if no token
    if not hf_token:
        print("⚠️  AI Chatbot: No HF_TOKEN found - using fallback responses")
        return get_fallback_response(prepared_user_message, crop_name, recommendations)
    
    print(f"✅ AI Chatbot: HF_TOKEN found ({len(hf_token)} chars)")
    
    try:
        # Build conversation with context
        context = _build_context(crop_name, recommendations)
        
        # Format messages for Mistral (instruct format)
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        if context:
            messages.append({"role": "system", "content": f"Context: {context}"})
        
        # Add chat history (last 6 messages for context)
        if chat_history:
            for msg in chat_history[-6:]:
                messages.append(msg)
        
        # Add current user message
        messages.append({"role": "user", "content": prepared_user_message})
        
        print("🤖 AI Chatbot: Calling HuggingFace API...")

        # Call HuggingFace router (OpenAI-compatible chat completions)
        ai_text = ""
        error_messages: list[str] = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            for model_id in HF_CHAT_MODEL_CANDIDATES:
                print(f"🌐 AI Chatbot: Trying chat endpoint model: {model_id}")
                response = await client.post(
                    HF_CHAT_COMPLETIONS_URL,
                    headers={
                        "Authorization": f"Bearer {hf_token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model_id,
                        "messages": messages,
                        "max_tokens": 300,
                        "temperature": 0.7,
                        "top_p": 0.95,
                    },
                )

                print(f"📡 AI Chatbot: API response status: {response.status_code}")

                if response.status_code == 200:
                    result = response.json()
                    ai_text = (
                        ((result.get("choices") or [{}])[0].get("message") or {}).get("content", "")
                        if isinstance(result, dict)
                        else ""
                    ).strip()
                    if ai_text:
                        break
                    error_messages.append(f"{HF_CHAT_COMPLETIONS_URL} [{model_id}] -> empty content")
                    continue

                error_preview = response.text[:200]
                print(f"❌ HF API error response: {error_preview}")
                error_messages.append(f"{HF_CHAT_COMPLETIONS_URL} [{model_id}] -> {response.status_code}: {error_preview}")

            # Legacy fallback (in case account/provider doesn't support chat-completions route)
            if not ai_text:
                prompt = _format_mistral_prompt(messages)
                for api_url in HF_LEGACY_URLS:
                    print(f"🌐 AI Chatbot: Trying legacy endpoint: {api_url}")
                    response = await client.post(
                        api_url,
                        headers={"Authorization": f"Bearer {hf_token}"},
                        json={
                            "inputs": prompt,
                            "parameters": {
                                "max_new_tokens": 300,
                                "temperature": 0.7,
                                "top_p": 0.95,
                                "return_full_text": False,
                            },
                            "options": {
                                "wait_for_model": True,
                            },
                        },
                    )
                    print(f"📡 AI Chatbot: API response status: {response.status_code}")

                    if response.status_code == 200:
                        result = response.json()
                        if isinstance(result, list) and len(result) > 0:
                            ai_text = result[0].get("generated_text", "").strip()
                        elif isinstance(result, dict):
                            ai_text = result.get("generated_text", "").strip()
                        if ai_text:
                            break
                        error_messages.append(f"{api_url} -> empty content")
                        continue

                    error_preview = response.text[:200]
                    print(f"❌ HF API error response: {error_preview}")
                    error_messages.append(f"{api_url} -> {response.status_code}: {error_preview}")

            if not ai_text:
                raise Exception("HF API error: " + " | ".join(error_messages))
            
            # Clean up response
            ai_text = _clean_response(ai_text)
            
            if not ai_text:
                raise Exception("Empty AI response")
            
            print(f"✨ AI Chatbot: Generated response ({len(ai_text)} chars)")
            return ai_text
    
    except Exception as e:
        print(f"❌ AI chatbot error: {e}")
        # Fallback to predefined responses
        return get_fallback_response(prepared_user_message, crop_name, recommendations)


def _format_mistral_prompt(messages: List[Dict[str, str]]) -> str:
    """Format messages for Mistral Instruct model."""
    prompt_parts = []
    
    for msg in messages:
        role = msg["role"]
        content = msg["content"]
        
        if role == "system":
            prompt_parts.append(f"<s>[INST] {content} [/INST]")
        elif role == "user":
            prompt_parts.append(f"[INST] {content} [/INST]")
        elif role == "assistant":
            prompt_parts.append(f" {content}</s>")
    
    return " ".join(prompt_parts)


def _clean_response(text: str) -> str:
    """Clean AI response text."""
    # Remove special tokens
    text = text.replace("<s>", "").replace("</s>", "").replace("[INST]", "").replace("[/INST]", "")
    
    # Remove extra whitespace
    text = " ".join(text.split())
    
    # Truncate at reasonable length
    if len(text) > 500:
        # Try to end at sentence boundary
        for i in range(500, min(len(text), 600)):
            if text[i] in ".!?":
                text = text[:i+1]
                break
        else:
            text = text[:500] + "..."
    
    return text.strip()
