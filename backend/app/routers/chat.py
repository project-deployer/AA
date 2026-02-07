"""Chat router: send message, get AI response, history."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models import FarmerProfile, Field, ChatMessage
from ..schemas import ChatMessageCreate, ChatMessageResponse, ChatResponse
from ..chatbot_rules import get_response

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def send_message(
    body: ChatMessageCreate,
    farmer: FarmerProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = db.query(Field).filter(Field.id == body.field_id, Field.farmer_id == farmer.id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Crop/Field not found")
    user_msg = ChatMessage(field_id=field.id, role="user", content=body.content)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)
    ai_content = get_response(body.content, field.crop_name)
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
