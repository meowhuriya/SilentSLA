# Tech Stack

This stack was chosen to prioritize type safety, deterministic financial calculations, and seamless AI integration.

## Backend
- **Runtime:** Node.js (TypeScript)
- **Framework:** Express.js (for webhook ingestion and API endpoints)
- *Why:* Fast to iterate for a hackathon, excellent ecosystem for JSON processing and API building. TypeScript prevents data-type errors which are critical for financial calculations.

## Database
- **ORM:** Prisma
- **Database:** SQLite (for local hackathon dev) / PostgreSQL (production)
- *Why:* Prisma provides strict typing for our SLA and Incident models. Relational data is required because we need to query incidents by service and time window aggressively.

## AI & Logic
- **AI Model:** Google Gemini API (via `@google/genai` SDK)
- **Validation:** Zod (for structured AI outputs and API payload validation)
- *Why:* We need structured JSON generation for the claim packages, and Zod ensures the LLM's output matches our expected schema exactly.

## Testing
- **Framework:** Jest or Vitest
- *Why:* We *must* unit test the Policy Evaluator math. The agent is required to write tests for time/downtime calculations.
