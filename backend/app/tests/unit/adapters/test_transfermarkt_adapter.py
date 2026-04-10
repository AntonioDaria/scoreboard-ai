from unittest.mock import patch, MagicMock

from app.adapters.transfermarkt_adapter import _assign_positions, get_lineup


def test_assign_positions_433():
    players = [{"name": f"P{i}", "number": i} for i in range(11)]
    result = _assign_positions("4-3-3", players)
    assert result[0]["position"] == "GK"
    assert all(p["position"] == "DEF" for p in result[1:5])
    assert all(p["position"] == "MID" for p in result[5:8])
    assert all(p["position"] == "FWD" for p in result[8:11])


def test_assign_positions_442():
    players = [{"name": f"P{i}", "number": i} for i in range(11)]
    result = _assign_positions("4-4-2", players)
    assert result[0]["position"] == "GK"
    assert all(p["position"] == "DEF" for p in result[1:5])
    assert all(p["position"] == "MID" for p in result[5:9])
    assert all(p["position"] == "FWD" for p in result[9:11])


def test_assign_positions_invalid_formation_falls_back():
    players = [{"name": f"P{i}", "number": i} for i in range(11)]
    result = _assign_positions("not-valid", players)
    assert result[0]["position"] == "GK"
    assert len(result) == 11


def test_assign_positions_empty_players():
    assert _assign_positions("4-3-3", []) == []


def test_get_lineup_returns_empty_when_team_not_found():
    with patch("app.adapters.transfermarkt_adapter._search_team", return_value=None):
        with patch("app.adapters.transfermarkt_adapter.httpx.Client"):
            result = get_lineup("Unknown FC")
    assert result == {}


def test_get_lineup_returns_empty_on_exception():
    with patch("app.adapters.transfermarkt_adapter.httpx.Client") as MockClient:
        MockClient.return_value.__enter__.side_effect = Exception("network failure")
        result = get_lineup("Arsenal FC")
    assert result == {}


def test_get_lineup_returns_valid_structure_on_success():
    # Anchor tags need at least one attribute after href to satisfy [^>]+ in the regex
    html = """
        4-4-2
        <div class="rn_nummer">1</div>
        <div class="rn_nummer">5</div>
        <a href="/raya/profil/spieler/123" class="hauptlink">Raya</a>
        <a href="/white/profil/spieler/456" class="hauptlink">Ben White</a>
    """
    with patch("app.adapters.transfermarkt_adapter._search_team", return_value=("arsenal-fc", "11")):
        with patch("app.adapters.transfermarkt_adapter.httpx.Client") as MockClient:
            mock_c = MockClient.return_value.__enter__.return_value
            mock_page = MagicMock()
            mock_page.text = html
            mock_c.get.return_value = mock_page

            result = get_lineup("Arsenal FC")

    assert "formation" in result
    assert "players" in result
    assert len(result["players"]) == 2
    assert result["players"][0]["position"] == "GK"
    assert result["players"][0]["number"] == 1
