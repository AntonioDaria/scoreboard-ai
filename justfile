# ── variables ────────────────────────────────────────────────────────────────
BE := "backend"
PG_USER := "antoniodaria"
DB := "football_predictions"
DB_TEST := "football_predictions_test"

# ── default: list all recipes ─────────────────────────────────────────────────
default:
    @just --list

# ── postgres ──────────────────────────────────────────────────────────────────

# Start Postgres via Homebrew
db-start:
    brew services start postgresql@14
    @echo "Waiting for Postgres to be ready..."
    @until pg_isready -q; do sleep 1; done
    @echo "Postgres is up."

# Stop Postgres
db-stop:
    brew services stop postgresql@14

# Create both application databases (safe to re-run)
db-create:
    createdb -U {{PG_USER}} {{DB}} 2>/dev/null || echo "{{DB}} already exists"
    createdb -U {{PG_USER}} {{DB_TEST}} 2>/dev/null || echo "{{DB_TEST}} already exists"

# ── backend ───────────────────────────────────────────────────────────────────

# Install backend Python dependencies
be-install:
    cd {{BE}} && poetry install --with dev

# Apply all pending database migrations
be-migrate:
    cd {{BE}} && poetry run alembic upgrade head

# Start the backend API server (hot-reload)
be-start:
    cd {{BE}} && poetry run uvicorn main:app --reload --port 8000

# ── frontend ──────────────────────────────────────────────────────────────────

# Install frontend Node dependencies
fe-install:
    npm install

# Start the frontend dev server
fe-start:
    npm run dev

# ── combined flows ────────────────────────────────────────────────────────────

# One-time setup: start Postgres, create DBs, install all deps, run migrations
setup: db-start db-create be-install fe-install be-migrate
    @echo ""
    @echo "Setup complete. Run 'just be-start' and 'just fe-start' in separate terminals."

# Run the full test suite (requires Postgres to be running)
test:
    cd {{BE}} && poetry run pytest app/tests/unit/ app/tests/integration/ -v

# Run unit tests only (no Postgres needed)
test-unit:
    cd {{BE}} && poetry run pytest app/tests/unit/ -v
