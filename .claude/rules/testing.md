---
description: Testing conventions for backend pytest and frontend Vitest suites
globs: ["backend/app/tests/**/*.py", "src/**/*.test.ts", "src/**/*.test.tsx"]
---

- **Unit tests mock all external dependencies.** No real DB, no real HTTP calls, no real Claude API. Use pytest fixtures or `vi.mock()` for every external boundary.
- **Integration tests require real Postgres via Docker.** Spin up with `docker-compose up -d db` and reset the test DB before running: `docker-compose exec db psql -U postgres -c 'DROP DATABASE IF EXISTS football_predictions_test; CREATE DATABASE football_predictions_test;'`
- **Tests must be isolated with no side effects between them.** Each test sets up and tears down its own state. Never rely on test execution order.
- **Always test unhappy paths.** Every test for a success case needs a corresponding test for the failure case (adapter throws, DB is unavailable, invalid input, rate limit hit).
- **Priority coverage files** — these must have thorough unit tests before anything else:
  - Backend: `prediction_service.py`, `claude_adapter.py`, `auth_service.py`
  - Frontend: `AuthContext.tsx`
