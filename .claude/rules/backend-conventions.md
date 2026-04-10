---
description: Backend Python conventions for the FastAPI/SQLAlchemy codebase
globs: backend/**/*.py
---

- **Controllers are thin.** Route handlers only: parse request, call one service method, return response. No business logic, no DB queries, no HTTP calls.
- **Services own all business logic.** Orchestration, validation, rate limiting, and DB access all live in services. Never in controllers or adapters.
- **Adapters are the only place for outbound HTTP calls.** No `httpx`, `requests`, or `urllib` calls outside `backend/app/adapters/`. This keeps mocking straightforward in tests.
- **Always use the logging module. Never use `print()`.** Every module must have `import logging` and `logger = logging.getLogger(__name__)` at the top.
- **New SQLAlchemy models require an Alembic migration.** Generate with `poetry run alembic revision --autogenerate -m "description"`. Never write raw SQL migrations.
- **Pydantic response schemas must never include `hashed_password`** or any other credential field, even if the model has it.
- **Adapter failures must be handled gracefully.** Wrap outbound calls in try/except, log with `logger.exception()`, and return a safe fallback or raise a typed exception — never let an adapter crash silently.

## Docstrings

- Every Python module must have a module-level docstring at the very top of the file (before any code, after the `import` block is not correct — it goes before imports as the very first statement) describing what the module does in one line.
- Every function and async function must have a docstring explaining its purpose and responsibility in plain English — not a line-by-line description of what the code does, but why the function exists and what it is responsible for.
- Docstrings use triple double quotes: `"""Like this."""`
- Keep them concise — one line is fine for simple functions. Only add more lines if the function has non-obvious behaviour, important caveats, or edge cases a caller needs to know about.
- A missing docstring on any public function is a convention violation, treated the same as a missing logger.
