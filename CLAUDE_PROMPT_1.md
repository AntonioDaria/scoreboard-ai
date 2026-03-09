I have a football match score prediction app. The frontend has already been built with React and Tailwind CSS. I now need you to scaffold the entire backend and project structure from scratch following professional standards.

/frontend         ← existing React app (leave as is)
/backend
  /app
    /controllers  ← route handlers, thin layer, no business logic
    /services     ← all business logic lives here
    /adapters     ← all external API calls (API-Football, Claude API)
    /models       ← SQLAlchemy database models
    /schemas      ← Pydantic request/response schemas
    /db           ← database connection, migrations setup
    /tests
      /unit
        /controllers
        /services
        /adapters
      /integration  ← tests that spin up real Postgres via Docker
      /seeders      ← seed functions to populate test data
  main.py
  requirements.txt
  .env
  .env.example
  Dockerfile
/docker-compose.yml  ← root level, spins up frontend + backend + postgres
.gitignore

1. Create a .gitignore in the project root covering:

.env
node_modules
__pycache__
*.pyc
dist
.DS_Store
.pytest_cache
*.egg-info


2. Create .env and .env.example inside /backend with these variables:
API_FOOTBALL_KEY=your_api_football_key_here
ANTHROPIC_API_KEY=your_claude_key_here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/football_predictions
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/football_predictions_test
SECRET_KEY=your_jwt_secret_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

3. Set up FastAPI app in backend/main.py:

Include CORS middleware allowing the frontend origin
Register all routers from controllers
Include a /health endpoint that returns {"status": "ok"}


4. Set up the database using SQLAlchemy + Alembic:

Connection setup in backend/app/db/database.py
Create the following PostgreSQL models in backend/app/models/:

User

id, email, hashed_password, created_at

Prediction

id, user_id (FK), fixture_id, home_team, away_team, predicted_home_score, predicted_away_score, confidence, reasoning, suggested_bet, created_at

BettingSlip

id, user_id (FK), name, created_at, exported_at

BettingSlipItem

id, slip_id (FK), prediction_id (FK), odds (real-time, stored at time of adding), potential_winnings, stake


5. Authentication — controllers/services/schemas:
Controller: backend/app/controllers/auth_controller.py

POST /auth/register — register with email + password
POST /auth/login — login, return JWT access token

Service: backend/app/services/auth_service.py

register_user(email, password) — hash password with bcrypt, save user
authenticate_user(email, password) — verify credentials, return JWT
get_current_user(token) — decode JWT and return user

Schemas: backend/app/schemas/auth_schemas.py

UserRegister, UserLogin, TokenResponse


6. Fixtures & Football Data — adapters/controllers/services:
Adapter: backend/app/adapters/api_football_adapter.py

All calls to https://v3.football.api-sports.io using the API_FOOTBALL_KEY
Functions:

get_fixtures(league_id, season)
get_standings(league_id, season)
get_team_form(team_id, last=5)
get_injuries(team_id, fixture_id)
get_lineup(fixture_id)
get_head_to_head(team1_id, team2_id)
get_odds(fixture_id) ← for real-time odds on betting slip



Service: backend/app/services/football_service.py

Calls the adapter and shapes the data for the frontend

Controller: backend/app/controllers/football_controller.py

GET /fixtures?league_id=&season=
GET /standings?league_id=&season=
GET /team/{team_id}/form
GET /fixture/{fixture_id}/injuries
GET /fixture/{fixture_id}/lineup
GET /h2h?team1={id}&team2={id}
GET /fixture/{fixture_id}/odds


7. Prediction Engine — adapter/service/controller:
Adapter: backend/app/adapters/claude_adapter.py

Calls Anthropic Claude API using ANTHROPIC_API_KEY
Function generate_prediction(match_context: dict) that sends a structured prompt to Claude with all match data and returns: predicted scoreline, confidence %, reasoning summary, suggested bet type

Service: backend/app/services/prediction_service.py

create_prediction(user_id, fixture_id):

Fetches all match data via football_service
Calls claude_adapter to generate prediction
Saves prediction to Postgres
Returns full prediction object



Controller: backend/app/controllers/prediction_controller.py

POST /predictions — generate and save a prediction (requires JWT)
GET /predictions — get all predictions for logged in user (requires JWT)
GET /predictions/{id} — get single prediction


8. Betting Slip — service/controller:
Service: backend/app/services/betting_slip_service.py

create_slip(user_id, name)
add_prediction_to_slip(slip_id, prediction_id, stake):

Fetches real-time odds via api_football_adapter
Calculates potential winnings (stake × odds)
Saves BettingSlipItem


get_slip(slip_id) — returns full slip with all items and total potential winnings
export_slip(slip_id) — returns slip formatted as a shareable JSON or PDF-ready structure

Controller: backend/app/controllers/betting_slip_controller.py

POST /slips — create a new slip (requires JWT)
POST /slips/{slip_id}/items — add prediction to slip
GET /slips/{slip_id} — get full slip with real-time odds refresh
GET /slips/{slip_id}/export — export slip


9. Tests using pytest:
Setup backend/app/tests/conftest.py:

Fixture that spins up a real Postgres test database using TEST_DATABASE_URL
Runs all migrations before the test session
Seeds test data using seeder functions in /seeders
Tears down and clears all data after each test run

Seeders in backend/app/tests/seeders/:

seed_users.py — creates test users
seed_fixtures.py — creates mock fixture data
seed_predictions.py — creates mock predictions
seed_slips.py — creates mock betting slips

Unit tests (mock all external dependencies):

tests/unit/adapters/test_api_football_adapter.py
tests/unit/adapters/test_claude_adapter.py
tests/unit/services/test_auth_service.py
tests/unit/services/test_football_service.py
tests/unit/services/test_prediction_service.py
tests/unit/services/test_betting_slip_service.py
tests/unit/controllers/test_auth_controller.py
tests/unit/controllers/test_prediction_controller.py
tests/unit/controllers/test_betting_slip_controller.py

Integration tests (use real Postgres spun up via Docker):

tests/integration/test_auth_flow.py — register → login → get token
tests/integration/test_prediction_flow.py — create prediction → save → retrieve
tests/integration/test_betting_slip_flow.py — create slip → add items → export


10. Docker setup:
backend/Dockerfile:

Python 3.11 base image
Install dependencies from requirements.txt
Expose port 8000
Run with uvicorn

docker-compose.yml at root level with three services:

frontend — builds from /frontend, exposes port 5173
backend — builds from /backend, exposes port 8000, depends on db
db — postgres:15 image, persistent volume, exposes port 5432, creates both football_predictions and football_predictions_test databases on init


11. requirements.txt should include:
fastapi
uvicorn
sqlalchemy
alembic
psycopg2-binary
python-jose[cryptography]
passlib[bcrypt]
python-dotenv
httpx
anthropic
pytest
pytest-asyncio
httpx

After completing everything, give me:

A summary of all files created
Instructions on how to run the full app via docker-compose up
Instructions on how to run the test suite
Anything I need to manually fill in (API keys etc.)