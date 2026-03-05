MOCK_FIXTURES = [
    {
        "fixture_id": 1001,
        "home_team": "Arsenal",
        "away_team": "Chelsea",
        "league_id": 39,
        "season": 2024,
    },
    {
        "fixture_id": 1002,
        "home_team": "Liverpool",
        "away_team": "Manchester City",
        "league_id": 39,
        "season": 2024,
    },
]


def seed_fixtures(db):
    # Fixtures live in the external API; this seeder provides mock data for tests.
    return MOCK_FIXTURES
