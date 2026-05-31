# reviewflow-

A prototype code review automation tool built with LangGraph. It uses a multi-agent state machine to parse Git diffs and generate targeted feedback while minimizing line-number hallucinations.

*Note: I am currently a CS freshman. This is an experimental project I put together to move beyond basic single-prompt API tutorials and learn how structured state machines can solve real-world development constraints.*

## The Problem

Most basic AI code review setups just dump a raw git diff into a single prompt. In production, this approach usually runs into two core issues:
- **Line-number hallucination**: The model frequently comments on lines or files that don't actually exist in the modified patch.
- **No verification loop**: The system lacks a separate layer to double-check if the generated feedback actually aligns with the diff context before exporting it.

This project attempts to isolate the review process into a 3-step graph to make the final output reliable.

## Architecture

Instead of a single linear LLM call, the workflow is split into three LangGraph nodes:
1. **Diff Parser**: Validates the incoming patch structure and enforces strict data schemas using Zod.
2. **Reviewer Agent**: Analyzes the code changes for potential logic errors, edge cases, or security impacts.
3. **Verifier Agent**: Intercepts the reviewer's draft feedback and cross-references it with the actual diff line numbers to filter out hallucinated references.

---

## Quick Example

### Sample Input Diff
```diff
@@ -10,4 +10,4 @@ function processData(data) {
-  const result = data.map(x => x * 2);
+  const result = data.filter(x => x !== null).map(x => x * 2);
   return result;
 }
