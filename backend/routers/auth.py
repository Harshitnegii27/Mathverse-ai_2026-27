import random
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional

import models, schemas
from database import get_db
from auth_utils import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[models.User]:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    email = payload.get("sub")
    if not email:
        return None
    user = db.query(models.User).filter(models.User.email == email).first()
    return user

@router.post("/register", response_model=schemas.TokenResponse)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check if email is already registered
    existing = db.query(models.User).filter(models.User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    student_code = None
    linked_student_id = None
    
    if payload.role == "student":
        student_code = f"SPIDER-{random.randint(1000, 9999)}"
    elif payload.role in ["parent", "teacher"]:
        # Parent or Teacher must provide their student's email or student code
        lookup_key = (payload.student_email or payload.student_code or "").strip().lower()
        if not lookup_key:
            raise HTTPException(
                status_code=400, 
                detail="Student email is required for Parent and Teacher registration."
            )
            
        target_student = db.query(models.User).filter(
            models.User.role == "student",
            (models.User.email == lookup_key) | 
            (models.User.student_code == lookup_key.upper()) |
            (models.User.userId == int(lookup_key) if lookup_key.isdigit() else False)
        ).first()
        
        if not target_student:
            raise HTTPException(
                status_code=400, 
                detail=f"No registered student found with email or code '{lookup_key}'. Please make sure the student signs up first."
            )
        linked_student_id = target_student.userId

    user = models.User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        password_hash=hash_password(payload.password),
        role=payload.role.lower().strip(),
        points=0,
        level=1,
        student_code=student_code,
        linked_student_id=linked_student_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({
        "sub": user.email,
        "user_id": user.userId,
        "role": user.role,
        "name": user.name
    })
    
    return schemas.TokenResponse(access_token=token, user=user)

@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.lower().strip()).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    token = create_access_token({
        "sub": user.email,
        "user_id": user.userId,
        "role": user.role,
        "name": user.name
    })
    
    return schemas.TokenResponse(access_token=token, user=user)

@router.get("/me", response_model=schemas.User)
def get_me(user: Optional[models.User] = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    return user

@router.post("/demo/{role}", response_model=schemas.TokenResponse)
def demo_login(role: str, db: Session = Depends(get_db)):
    """Instant 1-click demo login for student, parent, or teacher."""
    role_normalized = role.lower().strip()
    user = db.query(models.User).filter(models.User.role == role_normalized).first()
    if not user:
        # Fallback to any user
        user = db.query(models.User).first()
        if not user:
            raise HTTPException(status_code=404, detail="No accounts seeded. Run seed script first.")
            
    token = create_access_token({
        "sub": user.email or f"{role_normalized}@mathverse.edu",
        "user_id": user.userId,
        "role": user.role,
        "name": user.name
    })
    return schemas.TokenResponse(access_token=token, user=user)

