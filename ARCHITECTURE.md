# System Architecture

## Big Picture
SilentSLA operates as an event-driven background service rather than a conversational UI. It bridges operational telemetry with financial logic.

## Core Components
1. **Ingestion API (Monitor)**
   - Receives incident payloads (simulated webhooks from Datadog/PagerDuty).
   - Normalizes timestamps and service identifiers.
2. **Hindsight Memory (Database)**
   - Stores `SLAPolicy` definitions.
   - Stores `Incident` records linked to specific services.
   - Tracks cumulative downtime per measurement window.
3. **Policy Evaluator Engine**
   - Triggered upon every new incident resolution.
   - Calculates total eligible downtime in the current billing period.
   - Compares total against the `SLAPolicy` threshold.
4. **Claim Workflow Agent (AI)**
   - Triggered *only* when the Policy Evaluator signals a breach.
   - Gathers all incidents in the breach window.
   - Uses the LLM to synthesize a professional, evidence-backed claim package.

## Data Flow
`Webhook Event` -> `Ingestion API` -> `Database (Memory)` -> `Evaluator Engine` -> `Threshold Breached?` -> (If Yes) -> `AI Claim Generator` -> `Output JSON/Markdown Claim`
