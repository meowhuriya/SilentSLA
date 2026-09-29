# AI Harness Rules (AGENTS.md)

**CRITICAL:** Read this file before executing any task. This is your operating system.

## 1. Project Rules
1. **Never guess timestamps or math:** Use deterministic TypeScript functions to calculate downtime. DO NOT let the LLM calculate percentages or minutes.
2. **Never hallucinate incidents:** If evidence is missing, state it is missing. Do not invent logs to make a claim succeed.
3. **Strict separation of concerns:** Keep database access in a repository layer, webhook logic in controllers, and AI logic in isolated service classes.
4. **Use TypeScript for everything:** No raw JavaScript files. Use Zod for any data crossing an API or LLM boundary.

## 2. Definition of Done
A feature is only complete when:
- [ ] The code runs without TypeScript errors.
- [ ] Unit tests pass (especially for math/time logic).
- [ ] It does not break the autonomous flow (no infinite loops).
- [ ] `PROJECT_CONTEXT.md` has been updated to reflect the new state.

## 3. The Autonomous Engineering Loop
When given a task, follow this exact loop:
1. **Context:** Read `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, and relevant code.
2. **Plan:** Propose a solution silently in your thought process.
3. **Act:** Write the code or use the required tools.
4. **Verify:** Run the TypeScript compiler (`npx tsc --noEmit`) and tests.
5. **Fix:** If verification fails, read the error, fix the code, and re-verify. Do not ask the user if it works; let the computer verify it.
6. **Update:** Update `PROJECT_CONTEXT.md` before ending your turn.
