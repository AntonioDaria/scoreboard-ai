"""Service layer for user authentication: registration, login, JWT issuance, and token validation."""
import logging
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def register_user(email: str, password: str, db: Session) -> User:
    """Create a new user account with a bcrypt-hashed password, rejecting duplicate emails."""
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    hashed = pwd_context.hash(password)
    user = User(email=email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("User registered", extra={"user_id": user.id, "email": user.email})
    return user


def authenticate_user(email: str, password: str, db: Session) -> str:
    """Verify credentials and return a signed JWT access token, raising 401 on failure."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not pwd_context.verify(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    logger.info("User authenticated", extra={"user_id": user.id, "email": user.email})
    return _create_access_token({"sub": str(user.id), "email": user.email})


def get_current_user(token: str, db: Session) -> User:
    """Decode a JWT and return the corresponding User, raising 401 for any invalid or expired token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.warning("JWT token missing sub claim")
            raise credentials_exception
    except JWTError:
        logger.warning("JWT decode failed — invalid or expired token")
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        logger.warning("JWT token references non-existent user", extra={"user_id": user_id})
        raise credentials_exception
    return user


def _create_access_token(data: dict) -> str:
    """Sign a JWT containing the given payload with a configurable expiry."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
