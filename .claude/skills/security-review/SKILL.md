---
name: security-review
description: Security audit for this FastAPI/React codebase. Use when reviewing code before deployment, checking a PR for vulnerabilities, or when the user mentions security, auth, or sensitive data.
allowed-tools: Read, Grep, Glob
---

# Security Review Skill

Perform a thorough security audit of this codebase. Work through each category below and report findings with severity: CRITICAL, HIGH, MEDIUM, or LOW.

## 1. Authentication & Route Guards
- Check every FastAPI route in backend/app/controllers/ — any route that should require authentication must have `get_current_user` as a dependency
- Flag any prediction, betting slip, or user-specific endpoint missing JWT protection
- Check JWT config in auth_service.py — SECRET_KEY must come from env var, never hardcoded

## 2. Sensitive Data Exposure
- Check all Pydantic schemas in backend/app/schemas/ — hashed_password must never appear in any response schema
- Check that no internal error details or stack traces are returned to API clients
- Check that logging statements never log passwords, tokens, or API keys

## 3. Environment Variables & Secrets
- Check that ANTHROPIC_API_KEY, FOOTBALL_DATA_KEY, SECRET_KEY, and DATABASE_URL are always read from environment variables
- Flag any hardcoded credentials, API keys, or secrets anywhere in backend/
- Verify .env is in .gitignore and .env.example contains no real values

## 4. External Input Validation
- Check all FastAPI route handlers use Pydantic schemas for request validation — no raw request.body parsing
- Check Transfermarkt and ESPN adapter responses are validated before use — never trust external data blindly
- Flag any place where scraped HTML content is used without sanitisation

## 5. Database Safety
- Check all database queries go through SQLAlchemy ORM — flag any raw SQL strings
- Check that user_id scoping is enforced in services — users must only access their own predictions and betting slips
- Verify no DB connection details are logged or exposed in error responses

## 6. Dependencies & Configuration
- Check CORS configuration in main.py — origins should not be wildcard (*) in production
- Check ACCESS_TOKEN_EXPIRE_MINUTES is set to a reasonable value (current: 10080 = 7 days — flag if this seems excessive for the use case)

## Reporting Format
For each finding state:
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- File and line number
- What the issue is
- Exact fix required

Separate CRITICAL and HIGH findings at the top. End with a summary count per severity level.
