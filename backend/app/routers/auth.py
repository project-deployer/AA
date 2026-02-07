"""Auth router: verify Firebase token, create/return session."""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import verify_firebase_token, get_or_create_farmer
from ..schemas import AuthVerifyRequest, AuthVerifyResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/verify", response_model=AuthVerifyResponse)
def verify_token(req: AuthVerifyRequest, db: Session = Depends(get_db)):
    claims = verify_firebase_token(req.id_token)
    firebase_uid = claims.get("uid")
    if not firebase_uid:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid token")
    farmer = get_or_create_farmer(
        db,
        firebase_uid=firebase_uid,
        phone=req.phone or claims.get("phone_number"),
        email=req.email or claims.get("email"),
        display_name=req.display_name or claims.get("name"),
    )
    return AuthVerifyResponse(
        success=True,
        farmer_id=farmer.id,
        message="Authenticated",
    )
