import bcrypt
from app.models.user import User


def seed_users(db):
    hashed = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode()
    user = User(email="test@example.com", hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
