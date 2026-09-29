# MVP Scope

## 🟢 Must-Have (In Scope for MVP)
1. **SLA Policy Ingestion:** Ability to register an SLA with defined measurement windows (e.g., monthly) and availability thresholds (e.g., 99.9%).
2. **Telemetry Ingestion:** An endpoint to ingest simplified incident events (start time, end time, service, region).
3. **Hindsight Memory:** A database that accumulates and persists incident facts across a given measurement window.
4. **Deterministic Policy Evaluator:** An engine that aggregates downtime and compares it strictly against the SLA thresholds using math, NOT the LLM.
5. **Autonomous Agent Transition:** The system must detect a breach event and trigger the claim workflow autonomously.
6. **Claim Generator:** Uses AI to draft a structured, vendor-facing claim package citing specific incidents and SLA clauses.

## 🟡 Nice-to-Have (If time permits)
1. **Mock Vendor Submission:** An endpoint that simulates submitting the claim to a vendor and receiving an approval/rejection.
2. **PDF SLA Extraction:** Using Gemini to read a raw vendor PDF contract and extract the rules into the `SLAPolicy` database model.

## 🔴 Out of Scope (Not doing at all)
1. Replacing existing observability tools (we are NOT building a dashboard with charts, we consume their webhooks).
2. Auto-negotiating contracts.
3. Complex exclusions (e.g., customer-caused downtime vs. vendor-caused downtime) beyond a simple boolean flag for the MVP.
