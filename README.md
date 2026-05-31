# DiffLens

A lightweight TypeScript tool built with LangGraph to verify Git diff coordinate integrity and filter LLM line hallucinations.

*Note: This project started as an experiment to move beyond single-prompt review scripts and see if a structured pipeline could stop coordinate index failures before showing the final output.*

---

## Architecture

```mermaid
graph TD
    A[Git Diff Input] --> B[Parser Node: Extract Line Range]
    B --> C[LLM Generation Node: Review Comments]
    C --> D[Verifier Node: Coordinate Check]
    D -- Line Out of Bounds --> E[Conditional Router: Error Feedback]
    E --> C
    D -- Valid Coordinates --> F[Final Approved Report]
