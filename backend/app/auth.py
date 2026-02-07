"""Firebase Authentication verification."""
import os
from typing import Optional
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyCookie
from firebase_admin import credentials, auth, initialize_app
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import FarmerProfile

security = HTTPBearer(auto_error=False)
cookie_auth = APIKeyCookie(name="session_token", auto_error=False)

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    try:
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or getattr(settings, "google_application_credentials", None)
        if cred_path and os.path.exists(str(cred_path)):
            cred = credentials.Certificate(cred_path)
            initialize_app(cred)
        elif settings.firebase_project_id:
            initialize_app(options={"projectId": settings.firebase_project_id})
        else:
            initialize_app()
        _firebase_initialized = True
    except Exception:
        _firebase_initialized = True


def verify_firebase_token(token: str) -> dict:
    """Verify Firebase ID token and return decoded claims."""
    if settings.env == "development" and token.startswith("dev_"):
        return {"uid": token, "phone_number": None, "email": None, "name": "Dev User"}
    
    _init_firebase()
    try:
        # For development without proper Firebase credentials, allow a bypass
        if settings.env == "development":
            # In dev mode, accept tokens that look valid (contain dots for JWT format)
            if token.count(".") == 2:
                import base64
                import json
                try:
                    # Decode the JWT payload without verification for dev
                    parts = token.split(".")
                    payload = parts[1]
                    # Add padding if needed
                    padding = 4 - (len(payload) % 4)
                    if padding != 4:
                        payload += "=" * padding
                    decoded = json.loads(base64.urlsafe_b64decode(payload))
                    return {
                        "uid": decoded.get("uid") or decoded.get("sub"),
                        "phone_number": decoded.get("phone_number"),
                        "email": decoded.get("email"),
                        "name": decoded.get("name"),
                    }
                except Exception as e:
                    print(f"Dev token decode error: {e}")
        
        # Try to verify with Firebase Admin SDK
        try:
            decoded = auth.verify_id_token(token)
            return decoded
        except Exception as fb_error:
            print(f"Firebase verification error: {fb_error}")
            if settings.env == "development":
                # In dev, allow any non-empty token that looks like JWT
                if token.count(".") == 2:
                    print("Dev mode: allowing token despite Firebase verification failure")
                    parts = token.split(".")
                    try:
                        import base64, json
                        payload = parts[1]
                        padding = 4 - (len(payload) % 4)
                        if padding != 4:
                            payload += "=" * padding
                        decoded = json.loads(base64.urlsafe_b64decode(payload))
                        return {
                            "uid": decoded.get("uid") or decoded.get("sub"),
                            "phone_number": decoded.get("phone_number"),
                            "email": decoded.get("email"),
                            "name": decoded.get("name"),
                        }
                    except:
                        pass
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(fb_error)}",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )


def get_or_create_farmer(db: Session, firebase_uid: str, phone: Optional[str] = None, email: Optional[str] = None, display_name: Optional[str] = None) -> FarmerProfile:
    """Get existing farmer or create new one."""
    farmer = db.query(FarmerProfile).filter(FarmerProfile.firebase_uid == firebase_uid).first()
    if farmer:
        if phone and not farmer.phone:
            farmer.phone = phone
        if email and not farmer.email:
            farmer.email = email
        if display_name:
            farmer.display_name = display_name
        db.commit()
        db.refresh(farmer)
        return farmer
    farmer = FarmerProfile(
        firebase_uid=firebase_uid,
        phone=phone,
        email=email,
        display_name=display_name,
    )
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    return farmer


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> FarmerProfile:
    """Dependency to get current authenticated user."""
    token = None
    if credentials:
        token = credentials.credentials
    if not token and hasattr(request, "cookies") and request.cookies:
        token = request.cookies.get("session_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    claims = verify_firebase_token(token)
    firebase_uid = claims.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid token claims")

    farmer = get_or_create_farmer(
        db,
        firebase_uid=firebase_uid,
        phone=claims.get("phone_number"),
        email=claims.get("email"),
        display_name=claims.get("name"),
    )
    return farmer
