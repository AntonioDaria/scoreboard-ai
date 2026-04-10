Run `gh issue view $ARGUMENTS` to read the full issue, then fix it using the steps below.

**1. Understand the issue**
Read the issue title, body, and any linked comments. Identify whether it is backend, frontend, or full-stack.

**2. Trace the bug**
- Backend: follow the call chain — controller → service → adapter — and read each layer until you find the root cause.
- Frontend: follow the call chain — page → component → `src/lib/api.ts` — and read each layer until you find the root cause.

**3. Fix the root cause**
Make the minimal change that fixes the issue. Do not refactor surrounding code unless it is directly causing the bug.

**4. Write a unit test**
Write a unit test that would have caught this bug. Place it in `backend/app/tests/unit/` or alongside the relevant frontend file. Mock all external dependencies.

**5. Check for similar bugs**
Search the codebase for the same pattern that caused this bug. If found elsewhere, fix those too and note them in your response.

**6. Summarise**
List: files changed, root cause in one sentence, test added, and any similar instances found.
