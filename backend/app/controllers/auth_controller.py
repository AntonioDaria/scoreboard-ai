from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth_schemas import UserRegister, UserLogin, UserResponse, TokenResponse
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
def register(body: UserRegister, db: Session = Depends(get_db)):
    user = auth_service.register_user(body.email, body.password, db)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    token = auth_service.authenticate_user(body.email, body.password, db)
    return TokenResponse(access_token=token)
