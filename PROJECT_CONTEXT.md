# Project Context

## Current Status
- **Phase:** Feature Complete (Ready for Demo)
- **State:** End-to-end testing verified the autonomous breach detection and claim generation. UI Dashboard is fully implemented.
- **Completed:** 
  - Defined architecture, scope, tech stack, and agent rules.
  - Built `/api/incidents` and `/api/policies` ingestion endpoints.
  - Built deterministic Policy Evaluator to calculate cumulative downtime.
  - Built AI Claim Generator using `@google/genai` to draft claim packages.
  - **NEW:** Built `POST /api/extract-policy` to dynamically create SLAs from raw PDF/contract text using Gemini.
  - **NEW:** Built a modern Tailwind CSS frontend dashboard (`public/index.html`) with SLA monitoring, live outage injection, and claim inbox.
  - **NEW:** Built a mock vendor endpoint to simulate automatic claim submission and approvals.

## Next Immediate Steps
1. Run `npm run dev` to start the server.
2. Open `http://localhost:3000` to demo the UI, extract an SLA contract, and inject micro-outages!

## Active Blockers
- None at this time. Project is ready for code initialization.
