Run `git diff main...HEAD` and review the full diff for the following categories. Label each finding as either **BLOCKER** or **SUGGESTION**.

**Architecture violations**
- Business logic in controllers (controllers must only parse request → call service → return response)
- HTTP fetch calls outside `src/lib/api.ts`

**TypeScript issues**
- Use of `any` type
- Unused imports or variables (these are errors in strict mode)

**Security issues**
- Exposed secrets or API keys
- Missing auth guards on protected endpoints

**Missing error handling**
- Silent adapter failures (exceptions swallowed without logging or re-raising)
- API calls with no error branch

**Test coverage gaps**
- New services or adapters with no corresponding unit test
- New API endpoints with no integration test

**Convention violations**
- `print()` used instead of `logger.*`
- Inline styles instead of Tailwind classes
- Missing `import logging` / `logger = logging.getLogger(__name__)` in new backend modules
- New SQLAlchemy models without an Alembic migration
- Pydantic schemas that expose `hashed_password`

List all blockers first, then suggestions.
