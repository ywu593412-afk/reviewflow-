# reviewflow-

A small, practical experiment exploring how to use LangGraph to automate code reviews without losing context or hallucinating line numbers.

## Why this exists

Most AI code review scripts just throw a raw git diff into a single prompt. This usually leads to two core issues:
1. **Line-number hallucination**: The LLM comments on lines that don't actually exist in the patch.
2. **Context blindness**: It lacks a structured loop to double-check its own logic before outputting feedback.

I built this project to see if a multi-agent graph architecture could make automated reviews reliable enough for real workflows by breaking the process into verifiable steps.

## How it works

Instead of a single linear LLM call, this project uses **LangGraph** to manage a state machine with structured nodes:
* **Diff Parser**: Validates the incoming git patch and enforces data schemas using Zod.
* **Reviewer Agent**: Analyzes code logic, performance, and security impacts.
* **Verifier Agent**: Intercepts the reviewer's comments and cross-references them with the actual diff line numbers to eliminate hallucinated references.

---

## Quick Example (Input ➔ Output)

### Incoming Diff
```diff
@@ -10,4 +10,4 @@ function processData(data) {
-  const result = data.map(x => x * 2);
+  const result = data.filter(x => x !== null).map(x => x * 2);
   return result;
 }
