# DiffLens

![Status](https://img.shields.io/badge/status-active-success)
![Type](https://img.shields.io/badge/type-rule__based__validation-blue)
![Domain](https://img.shields.io/badge/domain-LLM__dev__tools-orange)

---

## Deterministic Validation Layer for LLM-Generated Code Reviews

DiffLens enforces structural correctness between LLM-generated feedback and actual git diff topologies before comments hit GitHub Pull Requests.

---

## Design Principle

> **LLMs propose review logic, deterministic systems authorize structural validity. DiffLens treats LLM outputs as untrusted suggestions.**

---

## Why It Exists (The Structural Mismatch)

LLM-based code review systems frequently produce unstable line references (referencing deleted lines, out-of-hunk coordinates, or shifted line numbers). 

This is **not** a prompt engineering issue. It is a structural limitation: LLMs operate on token sequences, while diff correctness depends on stateful, line-indexed reasoning over structured edit regions defined by hunk headers (`@@ -l,s +l,s @@`).

---

## System Flow

```text
Git Diff ──> Structured Diff Parser (AST) ──> [Immutable Reference Map]
                                                           │
LLM Reviewer ──> [Untrusted Suggestion Payload] ───────┼─> (Deterministic Validation Engine)
                                                           │
GitHub API <── [Filtered / Realigned PR Output] <──────┘
