# Scoreboard AI — Football Match Score Prediction App

A full-stack app that uses Claude AI to generate football match predictions, confidence scores, reasoning, and suggested bets. Built with React + Tailwind CSS on the frontend and FastAPI + PostgreSQL on the backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn-ui |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL 15 |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Football Data | API-Football (v3) |
| Auth | JWT (python-jose + bcrypt) |
| Tests | pytest, pytest-asyncio |
| Containers | Docker, Docker Compose |

---

## Project Structure

```
scoreboard-ai/
├── src/                        # React frontend (Vite)
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env                    # Local env vars (gitignored)
│   ├── .env.example
│   ├── alembic/                # Database migrations
│   └── app/
│       ├── controllers/        # Route handlers (thin layer)
│       ├── services/           # Business logic
│       ├── adapters/           # External API calls (API-Football, Claude)
│       ├── models/             # SQLAlchemy models
│       ├── schemas/            # Pydantic request/response schemas
│       ├── db/                 # Database connection setup
│       └── tests/
│           ├── conftest.py
│           ├── seeders/
│           ├── unit/
│           └── integration/
├── docker/
│   └── init-db.sql             # Creates test database on first run
├── docker-compose.yml
└── Dockerfile.frontend
```

---

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) (v18+) — for running the frontend locally without Docker
- [Python 3.11](https://www.python.org/) — for running the backend locally without Docker
- [Poetry](https://python-poetry.org/docs/#installation) (v2+) — Python dependency manager

---

## Environment Setup

Copy the example env file and fill in your API keys:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
API_FOOTBALL_KEY=your_api_football_key_here       # https://www.api-football.com
ANTHROPIC_API_KEY=your_claude_key_here            # https://console.anthropic.com
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/football_predictions
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/football_predictions_test
SECRET_KEY=your_jwt_secret_here                   # Run: openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

> `DATABASE_URL` and `TEST_DATABASE_URL` are pre-configured to match the Docker Compose Postgres service. Only change these if running Postgres manually with different credentials.

---

## Running with Docker (recommended)

### 1. Start all services

```bash
docker-compose up --build
```

This starts:
- **Frontend** at http://localhost:5173
- **Backend API** at http://localhost:8000
- **PostgreSQL** at localhost:5432

### 2. Apply database migrations

In a second terminal, once the containers are running:

```bash
docker-compose exec backend alembic upgrade head
```

### 3. Access the API docs

Open http://localhost:8000/docs for the interactive Swagger UI.

### Stopping

```bash
docker-compose down
```

To also remove the database volume:

```bash
docker-compose down -v
```

---

## Running Locally (without Docker)

### Frontend

```bash
npm install
npm run dev
```

Frontend available at http://localhost:5173.

### Backend

Install dependencies with Poetry (creates and manages the virtualenv automatically):

```bash
cd backend
poetry install
```

Make sure a local PostgreSQL instance is running, then apply migrations:

```bash
poetry run alembic upgrade head
```

Start the API server:

```bash
poetry run uvicorn main:app --reload --port 8000
```

Backend available at http://localhost:8000.

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register with email + password |
| POST | `/auth/login` | Login, returns JWT access token |

### Football Data

| Method | Endpoint | Description |
|---|---|---|
| GET | `/fixtures?league_id=&season=` | Get fixtures for a league/season |
| GET | `/standings?league_id=&season=` | Get league standings |
| GET | `/team/{team_id}/form` | Get recent team form |
| GET | `/fixture/{fixture_id}/injuries` | Get injuries for a fixture |
| GET | `/fixture/{fixture_id}/lineup` | Get lineups for a fixture |
| GET | `/h2h?team1={id}&team2={id}` | Head-to-head history |
| GET | `/fixture/{fixture_id}/odds` | Real-time odds |

### Predictions (JWT required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predictions` | Generate and save a prediction |
| GET | `/predictions` | Get all predictions for current user |
| GET | `/predictions/{id}` | Get a single prediction |

### Betting Slips (JWT required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/slips` | Create a new betting slip |
| POST | `/slips/{slip_id}/items` | Add a prediction to a slip |
| GET | `/slips/{slip_id}` | Get slip with real-time odds refresh |
| GET | `/slips/{slip_id}/export` | Export slip as shareable JSON |

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Returns `{"status": "ok"}` |

---

## Dependency Management (Poetry)

Dependencies are declared in `backend/pyproject.toml` and pinned in `backend/poetry.lock`.

```bash
# Install all dependencies (including dev)
poetry install

# Add a new runtime dependency
poetry add <package>

# Add a dev-only dependency
poetry add --group dev <package>

# Remove a dependency
poetry remove <package>

# Update all dependencies to latest allowed versions
poetry update

# Show installed packages
poetry show
```

> Always commit both `pyproject.toml` and `poetry.lock` together so everyone gets the same resolved versions.

---

## Database Migrations

Create a new migration after changing models:

```bash
cd backend
alembic revision --autogenerate -m "description of change"
alembic upgrade head
```

Roll back one migration:

```bash
alembic downgrade -1
```

---

## Running Tests

### Unit tests (no database needed)

```bash
cd backend
poetry run pytest app/tests/unit/ -v
```

### All tests including integration (requires Postgres)

Start the database first:

```bash
docker-compose up -d db
```

Then run:

```bash
cd backend
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/football_predictions_test \
poetry run pytest app/tests/ -v
```

### Test structure

```
tests/
├── conftest.py               # DB fixture: spin up, seed, rollback per test
├── seeders/
│   ├── seed_users.py
│   ├── seed_fixtures.py
│   ├── seed_predictions.py
│   └── seed_slips.py
├── unit/
│   ├── adapters/             # Mock HTTP calls to API-Football and Claude
│   ├── services/             # Mock all external dependencies
│   └── controllers/         # TestClient with mocked services
└── integration/
    ├── test_auth_flow.py     # Register → login → token
    ├── test_prediction_flow.py
    └── test_betting_slip_flow.py
```

---

## Architecture

```
Request → Controller (route handler)
              ↓
          Service (business logic)
              ↓
     Adapter (external APIs)   ←→   API-Football
     Adapter (Claude AI)       ←→   Anthropic Claude
              ↓
          Model / DB (SQLAlchemy + PostgreSQL)
```

- **Controllers** are thin — they only parse requests and delegate to services.
- **Services** own all business logic and orchestrate calls between adapters and models.
- **Adapters** are the only files that make outbound HTTP calls, making them easy to mock in tests.

---

## What to Fill In Manually

| Item | Action |
|---|---|
| `API_FOOTBALL_KEY` | Sign up at https://www.api-football.com and paste your key in `backend/.env` |
| `ANTHROPIC_API_KEY` | Get your key from https://console.anthropic.com and paste it in `backend/.env` |
| `SECRET_KEY` | Generate with `openssl rand -hex 32` and paste in `backend/.env` |
