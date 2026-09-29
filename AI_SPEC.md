# AI Specification (AI_SPEC.md)

This document defines exactly where and how Large Language Models (LLMs) are used in the SilentSLA architecture.

## 1. Allowed AI Use Cases

### A. The Claim Generator (Core)
- **Trigger:** A deterministic rule engine detects that `sum(incident.durationMinutes) > policy.allowedDowntime`.
- **Input Context to LLM:**
  - The specific SLA clause text.
  - A JSON array of all incident records (start time, end time, duration, evidence source) in the billing period.
  - The calculated total downtime (math done by TypeScript, NOT the LLM).
- **Required Output:** A professional, structured claim package (Markdown or JSON) that a human in Procurement can immediately send to the vendor. It must cite the specific incidents and map them to the policy.

### B. SLA Policy Extraction (Optional / Phase 2)
- **Trigger:** User uploads a vendor SLA PDF.
- **Input Context to LLM:** Raw text of the PDF.
- **Required Output:** Structured JSON (validated via Zod) extracting the `serviceName`, `vendor`, `availabilityTarget`, and `measurementPeriod` to populate the `SLAPolicy` database table.

## 2. Strictly Forbidden AI Use Cases

- **Calculating Downtime:** The LLM must NEVER subtract `startTime` from `endTime`.
- **Determining Breach State:** The LLM must NEVER evaluate `if (99.8 < 99.9)`.
- **Inventing Evidence:** The LLM must only use the incident array provided to it. Temperature should be set to `0` or `0.1` for these tasks to prevent hallucination.
