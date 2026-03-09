import pytest
from unittest.mock import patch, MagicMock
from app.services.result_checker_service import check_pending_predictions, _evaluate_bet


# --- _evaluate_bet unit tests ---

@pytest.mark.parametrize("bet,home,away,expected", [
    ("Home Win", 2, 1, True),
    ("Home Win", 1, 2, False),
    ("Home Win", 1, 1, False),
    ("Away Win", 0, 1, True),
    ("Away Win", 2, 1, False),
    ("Draw", 1, 1, True),
    ("Draw", 2, 1, False),
    ("Both Teams to Score", 1, 1, True),
    ("Both Teams to Score", 1, 0, False),
    ("Both Teams to Score", 0, 0, False),
    ("Over 2.5 Goals", 2, 1, True),
    ("Over 2.5 Goals", 1, 1, False),
    ("Over 2.5 Goals", 3, 0, True),
    ("Unknown Bet", 2, 1, False),
])
def test_evaluate_bet(bet, home, away, expected):
    assert _evaluate_bet(bet, home, away) == expected


# --- check_pending_predictions ---

def _make_prediction(fixture_id=1, suggested_bet="Home Win"):
    p = MagicMock()
    p.fixture_id = fixture_id
    p.suggested_bet = suggested_bet
    p.result = "pending"
    return p


def _finished_match(home_score, away_score):
    return {
        "status": "FINISHED",
        "score": {"fullTime": {"home": home_score, "away": away_score}},
    }


def test_check_pending_marks_correct():
    db = MagicMock()
    pred = _make_prediction(suggested_bet="Home Win")
    db.query.return_value.filter.return_value.all.return_value = [pred]

    with patch("app.services.result_checker_service.get_match", return_value=_finished_match(2, 1)):
        updated = check_pending_predictions(db)

    assert updated == 1
    assert pred.result == "correct"
    assert pred.actual_home_score == 2
    assert pred.actual_away_score == 1
    db.commit.assert_called_once()


def test_check_pending_marks_incorrect():
    db = MagicMock()
    pred = _make_prediction(suggested_bet="Home Win")
    db.query.return_value.filter.return_value.all.return_value = [pred]

    with patch("app.services.result_checker_service.get_match", return_value=_finished_match(0, 2)):
        updated = check_pending_predictions(db)

    assert updated == 1
    assert pred.result == "incorrect"


def test_check_pending_skips_unfinished_match():
    db = MagicMock()
    pred = _make_prediction()
    db.query.return_value.filter.return_value.all.return_value = [pred]

    with patch("app.services.result_checker_service.get_match", return_value={"status": "SCHEDULED"}):
        updated = check_pending_predictions(db)

    assert updated == 0
    assert pred.result == "pending"
    db.commit.assert_not_called()


def test_check_pending_skips_on_api_error():
    db = MagicMock()
    pred = _make_prediction()
    db.query.return_value.filter.return_value.all.return_value = [pred]

    with patch("app.services.result_checker_service.get_match", side_effect=Exception("API error")):
        updated = check_pending_predictions(db)

    assert updated == 0
    assert pred.result == "pending"


def test_check_pending_skips_missing_score():
    db = MagicMock()
    pred = _make_prediction()
    db.query.return_value.filter.return_value.all.return_value = [pred]

    with patch("app.services.result_checker_service.get_match", return_value={
        "status": "FINISHED",
        "score": {"fullTime": {"home": None, "away": None}},
    }):
        updated = check_pending_predictions(db)

    assert updated == 0


def test_check_pending_handles_match_wrapper():
    """football-data.org wraps single match under a 'match' key."""
    db = MagicMock()
    pred = _make_prediction(suggested_bet="Draw")
    db.query.return_value.filter.return_value.all.return_value = [pred]

    wrapped = {"match": _finished_match(1, 1)}
    with patch("app.services.result_checker_service.get_match", return_value=wrapped):
        updated = check_pending_predictions(db)

    assert updated == 1
    assert pred.result == "correct"


def test_check_pending_no_pending_predictions():
    db = MagicMock()
    db.query.return_value.filter.return_value.all.return_value = []

    updated = check_pending_predictions(db)

    assert updated == 0
    db.commit.assert_not_called()
