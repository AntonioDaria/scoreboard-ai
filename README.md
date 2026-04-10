# PredictXI — AI-Powered Football Match Prediction App

A full-stack app that uses Claude AI to generate football match predictions, confidence scores, detailed reasoning, and suggested bets. Built with React + Tailwind CSS on the frontend and FastAPI + PostgreSQL on the backend.

---

## Features

- **AI Predictions** — Claude Sonnet analyses recent form, league standings, head-to-head history, and injury data to predict scores and suggest bets
- **Injury & Suspension Data** — scraped live from Transfermarkt before each prediction
- **Announced Lineups** — fetched from ESPN's API and displayed as a pitch formation once announced (~45 min before kickoff)
- **Result Tracking** — predictions are automatically evaluated once a match finishes; correct/incorrect status is updated in the background
- **Compound Bet Evaluation** — supports Home Win, Away Win, Draw, BTTS, Over/Under X.5 Goals, Clean Sheet, and combinations (e.g. "Home Win & Both Teams to Score")
- **Betting Slips** — group predictions into a slip, set a total stake, and see potential returns
- **Prediction History** — view all your predictions with actual scores and win/loss stats
- **Daily Limit** — 5 predictions per user per day

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn-ui |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL 15 |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Football Data | football-data.org (v4) |
| Lineups | ESPN public API |
| Injury Data | Transfermarkt (scraped via httpx) |
| Auth | JWT (python-jose + bcrypt) |
| Tests | pytest |
| Containers | Docker, Docker Compose |

---

## Project Structure

```
scoreboard-ai/
├── src/                        # React frontend (Vite)
│   ├── pages/                  # Index, MatchPrediction, History, BettingSlip, Login
│   ├── components/             # Layout, PredictionCard, PitchFormation, FormBadge, etc.
│   ├── context/                # AuthContext (JWT decode, logout event)
│   └── lib/                    # api.ts, types.ts
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── Dockerfile
│   ├── .env                    # Local env vars (gitignored)
│   ├── .env.example
│   ├── alembic/                # Database migrations
│   └── app/
│       ├── controllers/        # Route handlers (thin layer)
│       ├── services/           # Business logic
│       ├── adapters/           # External API calls
│       │   ├── football_data_adapter.py   # football-data.org v4
│       │   ├── claude_adapter.py          # Anthropic Claude + Transfermarkt injuries
│       │   ├── transfermarkt_adapter.py   # Transfermarkt lineup scraper (fallback)
│       │   └── espn_adapter.py            # ESPN lineup API
│       ├── models/             # SQLAlchemy models
│       ├── schemas/            # Pydantic request/response schemas
│       ├── db/                 # Database connection setup
│       └── tests/
│           ├── conftest.py
│           └── unit/
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
FOOTBALL_DATA_KEY=your_football_data_key_here     # https://www.football-data.org (free tier)
ANTHROPIC_API_KEY=your_claude_key_here            # https://console.anthropic.com
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/football_predictions
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/football_predictions_test
SECRET_KEY=your_jwt_secret_here                   # Run: openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080                 # 7 days
```

> `DATABASE_URL` and `TEST_DATABASE_URL` are pre-configured to match the Docker Compose Postgres service. Only change these if running Postgres manually with different credentials.

> ESPN and Transfermarkt are scraped without API keys — no extra setup needed.

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

Install dependencies with Poetry:

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
| GET | `/fixtures?competition_code=PL&status=SCHEDULED&limit=10` | Upcoming fixtures for a competition |
| GET | `/fixture/{match_id}` | Single match details |
| GET | `/h2h/{match_id}?limit=5` | Head-to-head history for a fixture |
| GET | `/standings/{competition_code}` | League standings |
| GET | `/team/{team_id}/form?limit=5` | Recent team form (last N finished matches) |
| GET | `/lineups?home_team=Arsenal FC&away_team=Chelsea FC&match_date=20260308&competition_code=PL` | Announced starting lineups from ESPN |

### Predictions (JWT required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predictions` | Generate and save an AI prediction |
| GET | `/predictions` | Get all predictions for the current user |
| GET | `/predictions/remaining` | Remaining predictions for today |
| GET | `/predictions/{id}` | Get a single prediction |

### Betting Slips (JWT required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/slips` | Create a new betting slip |
| GET | `/slips` | Get all slips for the current user |
| GET | `/slips/{slip_id}` | Get a slip with its items |
| POST | `/slips/{slip_id}/items` | Add a prediction to a slip |

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Returns `{"status": "ok"}` |

---

## Supported Competitions

| Code | Competition |
|---|---|
| `PL` | Premier League |
| `PD` | La Liga |
| `SA` | Serie A |
| `BL1` | Bundesliga |
| `FL1` | Ligue 1 |

---

## Dependency Management (Poetry)

```bash
# Install all dependencies (including dev)
poetry install

# Add a new runtime dependency
poetry add <package>

# Add a dev-only dependency
poetry add --group dev <package>

# Update all dependencies
poetry update
```

> Always commit both `pyproject.toml` and `poetry.lock` together.

---

## Database Migrations

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

```bash
docker-compose up -d db
cd backend
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/football_predictions_test \
poetry run pytest app/tests/ -v
```

---

## Architecture

```
Request → Controller (route handler)
              ↓
          Service (business logic)
              ↓
     football_data_adapter   ←→   football-data.org v4
     claude_adapter          ←→   Anthropic Claude API
     claude_adapter          ←→   Transfermarkt (injury scraping)
     espn_adapter            ←→   ESPN public API (lineups)
              ↓
          Model / DB (SQLAlchemy + PostgreSQL)
```

- **Controllers** are thin — they only parse requests and delegate to services.
- **Services** own all business logic and orchestrate calls between adapters and models.
- **Adapters** are the only files that make outbound HTTP calls, making them easy to mock in tests.
- **Result checking** runs in a background thread on `GET /predictions` so it never blocks the response.

---

## Claude Code Configuration

This project uses [Claude Code](https://claude.ai/code) as the AI coding assistant. The setup is split across two layers: a project-level `.claude/` folder committed to this repo, and a global `~/.claude/` folder that lives on each developer's local machine. The project-level config is shared and version-controlled; the global config is personal and never committed to git.

### Global `~/.claude/CLAUDE.md`

This file lives on the developer's machine and applies across every project they work on with Claude Code. It is the right place for personal coding standards that should always be in effect. For this project, every developer's global file should contain the Python logging standards so Claude never needs to be reminded of them:

- Always declare `import logging` and `logger = logging.getLogger(__name__)` at the top of every Python module.
- Never use `print()` for debugging — use the logger instead.
- Use `logger.info()` with an `extra={}` dict for structured context (e.g. `extra={"user_id": user_id}`).
- Use `logger.exception()` inside `except` blocks — it captures the stack trace automatically.
- Use `logger.warning()` for recoverable issues such as missing data, rate limits, or retryable failures.
- Use `logger.error()` for failures that need attention but where there is no exception to capture.

### Project-level `CLAUDE.md`

`CLAUDE.md` lives in the project root, is committed to git, and is the first thing Claude Code reads at the start of every session. It contains everything that is specific to this codebase: the commands needed to run, test, and migrate the app; an architecture overview explaining how controllers, services, and adapters relate; the key backend and frontend conventions Claude must follow; the current logging migration status; and a list of codebase-specific gotchas (things like the ESPN lineup window, the daily prediction limit, and which API this project actually uses for football data).

### The `.claude/` folder

**`settings.json`** is applied automatically on every session, before any conversation begins. It defines what Claude is and is not allowed to run. The allow list covers `npm run *`, `poetry run *`, `docker-compose *`, and read-only git commands. The deny list blocks `rm -rf`, `curl`, `wget`, `git push`, and reading any `.env` file — so Claude cannot accidentally leak secrets or push to a remote.

**`rules/`** contains three files that load automatically based on which file Claude is currently editing. `backend-conventions.md` applies to any `.py` file and enforces the controller-service-adapter layering, the logging and docstring standards, and the rule that adapters are the only place for outbound HTTP calls. `frontend-conventions.md` applies to any `.ts` or `.tsx` file and enforces the `api.ts`-only fetch rule, the `types.ts`-only type definition rule, and the Tailwind-only styling rule. `testing.md` applies to any test file and enforces isolation, dependency mocking, and the requirement to test unhappy paths. None of these need to be invoked manually.

**`commands/`** contains two slash commands that the developer invokes manually. `/review` injects the current `git diff` and asks Claude to audit the changes for architecture violations, TypeScript issues, security gaps, missing error handling, test coverage gaps, and convention violations — labelling findings as BLOCKER or SUGGESTION. `/fix-issue <number>` fetches a GitHub issue by number, traces the reported bug through the codebase layer by layer, fixes the root cause, and writes a unit test to cover it.

**`agents/`** contains three specialist subagents, each running in its own isolated context window so they do not pollute the main conversation. `code-reviewer` is read-only and produces a structured report that distinguishes blockers from suggestions. `refactor-agent` makes safe, incremental structural changes one at a time without altering behaviour. `security-auditor` performs a deep, exhaustive security audit of the entire codebase, checking auth guards, data exposure, injection surface, and infrastructure configuration. Invoke any of them explicitly by saying "Use the code-reviewer agent to..." — Claude may also invoke them automatically when it judges the task warrants specialist handling.

**`skills/security-review/`** is a lighter security workflow that runs directly in the main session rather than in a separate context window. It is triggered automatically when security-related topics come up in conversation, or manually with `/security-review`. It covers auth guard completeness, data exposure in API responses, external input validation, database query safety, and infrastructure configuration.

### Quick reference

| File | What it does | Triggered by |
|---|---|---|
| `settings.json` | Controls what Claude can and cannot execute | Always on — automatic |
| `rules/*.md` | Enforces conventions for the file type being edited | File type match — automatic |
| `commands/*.md` | Developer-invoked workflows (`/review`, `/fix-issue`) | Slash command — manual |
| `agents/*.md` | Specialist subagents in isolated context windows | Explicit invocation — sometimes automatic |
| `skills/SKILL.md` | Lightweight in-session workflow for security review | Keyword detection — automatic or manual |

---

## What to Fill In

| Item | Action |
|---|---|
| `FOOTBALL_DATA_KEY` | Sign up (free) at https://www.football-data.org and paste your key in `backend/.env` |
| `ANTHROPIC_API_KEY` | Get your key from https://console.anthropic.com and paste it in `backend/.env` |
| `SECRET_KEY` | Generate with `openssl rand -hex 32` and paste in `backend/.env` |
