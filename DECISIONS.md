# Decision Log

| Date | Decision | Reasoning | Status |
|---|---|---|---|
| Day 1 | **No Chat UI for Core Workflow** | The project brief explicitly states this is "Not an AI Chatbot for DevOps". Value comes from autonomous background state transitions, not conversational Q&A. | Accepted |
| Day 1 | **Deterministic Math for SLA Evaluation** | LLMs are notoriously bad at precise arithmetic and time calculations. All downtime aggregation and threshold checks will be done in pure TypeScript. | Accepted |
| Day 1 | **LLM solely for Extraction & Synthesis** | The AI will only be used to read unstructured SLA policies and to write the final textual claim package. It will not make the breach decision. | Accepted |
| Day 1 | **Relational Database over Vector DB** | SLA tracking requires exact time-window queries and aggregations (`SUM(duration) WHERE time > X`), which relational databases excel at. Hindsight memory is structured, not semantic. | Accepted |
