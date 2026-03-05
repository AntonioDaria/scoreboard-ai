import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.services.auth_service import register_user, authenticate_user


def _make_db(user=None):
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = user
    return db


def test_register_user_success():
    db = _make_db(user=None)
    with patch("app.services.auth_service.pwd_context.hash", return_value="hashed_pw"):
        register_user("new@example.com", "password123", db)
    db.add.assert_called_once()
    db.commit.assert_called_once()


def test_register_user_duplicate_raises():
    existing = MagicMock()
    db = _make_db(user=existing)
    with pytest.raises(HTTPException) as exc:
        register_user("dup@example.com", "password", db)
    assert exc.value.status_code == 400


def test_authenticate_user_invalid_raises():
    db = _make_db(user=None)
    with pytest.raises(HTTPException) as exc:
        authenticate_user("no@example.com", "wrong", db)
    assert exc.value.status_code == 401
