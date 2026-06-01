# DiffLens

![Status](https://img.shields.io/badge/status-active-success)
![Type](https://img.shields.io/badge/type-deterministic__validation-blue)
![Domain](https://img.shields.io/badge/domain-LLM__dev__tools-orange)

---

## Deterministic validation layer for LLM-generated code reviews

DiffLens enforces structural correctness between LLM-generated feedback and actual git diff topologies before comments hit GitHub Pull Requests.

---

## Why it exists

LLM-based code review systems frequently produce unstable line references, including:
- Deleted line references
- Out-of-hunk coordinates
- Misaligned or drifted line numbers

This is caused by a **structural mismatch**: LLMs operate on token sequences, while diff correctness depends on stateful, line-indexed reasoning over structured edit regions defined by hunk headers (`@@ -l,s +l,s @@`).

---

## System flow

```text
Git Diff
   │
   ▼
Structured Diff Parser (AST)
   │
   ▼
LLM Review Generator (untrusted)
   │
   ▼
Deterministic Validation Layer
   │
   ▼
Filtered PR Output
