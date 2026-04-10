# PredictXI — AI Football Prediction App

## Project Overview
Full-stack football match prediction app. React/TypeScript frontend, FastAPI/Python backend, PostgreSQL DB, Claude AI for predictions.

## Commands

### Frontend (Bun)
```
bun run dev          # Start dev server (port 5173)
bun run build        # Production build
bun run lint         # ESLint check
bun run test         # Vitest unit tests
```

### Backend (Poetry)
```
cd backend
poetry run uvicorn main:app --reload --port 8000   # Start dev server
poetry run pytest app/tests/unit/ -v               # Unit tests (no DB needed)
poetry run pytest app/tests/ -v                    # All tests (requires Postgres)
poetry run alembic upgrade head                    # Apply migrations
poetry run alembic revision --autogenerate -m "desc"  # New migration
```

### Docker (recommended for full stack)
```
docker-compose up --build                          # Start everything
docker-compose exec backend alembic upgrade head   # Run migrations
docker-compose down                                # Stop
docker-compose down -v                             # Stop + wipe DB
```

## Architecture

### Frontend (src/)
- `src/pages/` — route-level components (Index, MatchPrediction, History, BettingSlip, Login)
- `src/components/` — reusable UI (PredictionCard, PitchFormation, FormBadge, etc.)
- `src/context/` — AuthContext (JWT decode + logout)
- `src/lib/` — api.ts (all fetch calls), types.ts (shared TypeScript types)

### Backend (backend/app/)
- `controllers/` — thin route handlers only, no business logic
- `services/` — all business logic lives here
- `adapters/` — all outbound HTTP calls (football-data.org, Claude API, ESPN, Transfermarkt)
- `models/` — SQLAlchemy ORM models
- `schemas/` — Pydantic request/response schemas
- `db/` — database connection setup

## Key Conventions

### Backend
- Controllers are thin: parse request → call service → return response. No logic in controllers.
- Services own all business logic and orchestrate adapter calls.
- Adapters are the ONLY files that make outbound HTTP calls — keeps mocking easy in tests.
- All responses use consistent shape: `{ data, error }` pattern in schemas.
- Never expose stack traces or internal error details to API clients.
- Use the Python `logging` module — never use `print()` for debugging.
- Result checking runs in a background thread on `GET /predictions` — never block the response.

### Frontend
- All API calls go through `src/lib/api.ts` — never fetch directly from components.
- Types shared across frontend live in `src/lib/types.ts`.
- Use shadcn-ui components before writing custom UI — check if a component exists first.
- Tailwind only for styling — no inline styles, no custom CSS unless absolutely necessary.

### TypeScript
- Strict mode is on. No unused imports or variables — these are errors.
- Always type API responses explicitly using types from `src/lib/types.ts`.
- Prefer `interface` for object shapes, `type` for unions/aliases.

### Testing
- Unit tests mock all external dependencies (adapters, DB).
- Integration tests require real Postgres — spin up with `docker-compose up -d db` first.
- Always run `npm run db:test:reset` equivalent before integration tests.
- Backend tests live in `backend/app/tests/`, frontend tests co-located with components.

## Logging

The backend currently has no logging implemented — this is a known gap. When touching any backend file, add proper logging using the standard Python logging pattern. Treat a missing logger in any backend module as a bug to fix, not something optional.

Priority files to address first:
- **Adapters:** `claude_adapter.py`, `football_data_adapter.py`, `espn_adapter.py`, `transfermarkt_adapter.py`
- **Services:** `prediction_service.py`, `football_service.py`, `auth_service.py`
- **Controllers:** `auth_controller.py`, `football_controller.py`, `prediction_controller.py`, `betting_slip_controller.py`

## Watch Out For
- `backend/.env` is gitignored — never commit API keys. Use `.env.example` as the template.
- The app uses `football-data.org v4` (NOT api-football.com) — check adapter before adding new endpoints.
- Transfermarkt scraping is fragile — injury data may fail silently; always handle gracefully.
- ESPN lineup data only appears ~45 min before kickoff — UI must handle the "not yet available" state.
- Daily prediction limit is 5 per user — enforce in service layer, not controller.
- JWT expiry is 7 days (10080 minutes) — don't change without updating the frontend token refresh logic.
- Always commit both `pyproject.toml` AND `poetry.lock` together.
- Database migrations live in `backend/alembic/` — always generate with `--autogenerate`, never write raw SQL migrations.
