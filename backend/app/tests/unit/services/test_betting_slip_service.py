import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from app.services.betting_slip_service import create_slip, add_prediction_to_slip, get_slip


def test_create_slip():
    db = MagicMock()
    create_slip(1, "My Slip", db)
    db.add.assert_called_once()
    db.commit.assert_called_once()


def test_add_prediction_slip_not_found():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as exc:
        add_prediction_to_slip(999, 1, 10.0, db)
    assert exc.value.status_code == 404


def test_get_slip_not_found():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as exc:
        get_slip(999, db)
    assert exc.value.status_code == 404
