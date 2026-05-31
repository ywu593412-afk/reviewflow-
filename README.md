# DiffLens

A lightweight TypeScript tool built with LangGraph for reviewing Git diffs, with additional verification steps designed to isolate and filter out-of-bounds line hallucinations.

*Note: This project started as an experiment to move beyond single-prompt review scripts and see if a structured pipeline can stop broken coordinate references before displaying the final output.*

*Status: Core engine fully functional and verified via automated CI pipeline.*

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
