# difflens-ai

A code review framework driven by LangGraph and Gemini, featuring a deterministic validation layer that prevents invalid line references from reaching your reports.

## 📌 Why It Exists

Traditional automated LLM reviews **cannot be reliably used in automated PR gate workflows.** Because generative models lack stateful awareness of structural diff layouts, they introduce severe operational hazards:

* **Line-Number Hallucinations**: Generative models routinely invent non-existent file coordinates or anchor feedback to unmodified context lines.
* **Ghost Comments**: Flawed coordinates trigger silent pipeline failures or break production PR gate integrations when trying to write back inline comments.
* **Context Bleed**: Without rigid boundary constraints, the tool defaults to wasting tokens on untouched regions and diluting the signal of real issues.

**difflens-ai** resolves this by enforcing a non-LLM algorithmic verification gate directly between the model's inference and your workflow output.

## 🔄 The Data Pipeline

The framework guides structural payloads through explicit boundary transitions, optimized for clean rendering across all screen sizes:

```text
[Raw Git Stream]
       │
       ▼
[Parsed Hunks] ────────► Matrix: { file, hunk, line-range }
       │                 (added_lines := '+' rows from normalized unified diff)
       ▼
[LLM Inference] ───────► Payload: { file, line, message }
       │
       ▼
[Verifier Gate] ───────► Condition: line ∈ hunk.added_lines
       │
       ▼
[Rendered Report] ─────► Safe, prioritized UI delivery
