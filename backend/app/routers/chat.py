"""Chat router: send message, get AI response, history."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models import FarmerProfile, Field, ChatMessage, CropRecommendation
from ..schemas import ChatMessageCreate, ChatMessageResponse, ChatResponse
from ..ai_chatbot import get_ai_response

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    body: ChatMessageCreate,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = db.query(Field).filter(Field.id == body.field_id, Field.farmer_id == farmer.id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Crop/Field not found")
    
    # Save user message
    user_msg = ChatMessage(field_id=field.id, role="user", content=body.content)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)
    
    # Get latest recommendation for context
    latest_recommendation = (
        db.query(CropRecommendation)
        .filter(CropRecommendation.farmer_id == farmer.id, CropRecommendation.field_id == field.id)
        .order_by(CropRecommendation.created_at.desc())
        .first()
    )
    
    # Get recent chat history for context
    recent_msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.field_id == field.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(6)
        .all()
    )
    chat_history = [
        {"role": msg.role, "content": msg.content}
        for msg in reversed(recent_msgs[1:])  # Exclude current message
    ]
    
    # Get AI response with context
    ai_content = await get_ai_response(
        body.content,
        field.crop_name,
        recommendations=(latest_recommendation.top_recommendations if latest_recommendation else None),
        chat_history=chat_history,
    )
    
    # Save AI response
    ai_msg = ChatMessage(field_id=field.id, role="assistant", content=ai_content)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    
    return ChatResponse(
        user_message=ChatMessageResponse.model_validate(user_msg),
        assistant_message=ChatMessageResponse.model_validate(ai_msg),
    )


@router.get("/{field_id}/history", response_model=list[ChatMessageResponse])
def get_history(
    field_id: int,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = db.query(Field).filter(Field.id == field_id, Field.farmer_id == farmer.id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Crop/Field not found")
    msgs = db.query(ChatMessage).filter(ChatMessage.field_id == field_id).order_by(ChatMessage.created_at).all()
    return [ChatMessageResponse.model_validate(m) for m in msgs]
