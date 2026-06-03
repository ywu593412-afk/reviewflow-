# DiffLens (v1.3.0)

A deterministic validation layer for AI-assisted code reviewers to eliminate coordinate hallucinations and prevent silent comment failures.

## The Problem

When using Large Language Models (LLMs) for automated code reviews, models frequently generate brilliant security and logic feedback but fail to anchor those comments to the correct line numbers in the Git Diff. Because standard hosting platforms (like GitHub) strictly validate comment coordinates, any out-of-bounds line numbers result in a hard failure (`422 Unprocessable Entity`), causing up to **64% of valuable AI review comments to be silently dropped**.

## The Solution

DiffLens injects a deterministic guardrail between the LLM pipeline and the GitHub API. Instead of blindly trusting the model's line references, DiffLens parses raw unified diffs first, constructs a precise map of valid reviewable locations, and enforces this as a hard constraint. If a generated comment targets an invalid coordinate, it is gracefully filtered or corrected before reaching the API.

## Features

- **Deterministic Guardrails**: Guarantees a 0% drop rate from coordinate hallucinations.
- **LangGraph Orchestration**: Built using a custom Multi-Agent architecture orchestrated via LangGraph JS.
- **Robust Diff Parsing**: Fully compatible with standard Git unified diff protocols, including edge cases like single-line hunks.

## Installation

Clone the repository and install the dependencies:

```bash
git clone [https://github.com/ywu593412-afk/difflens.git](https://github.com/ywu593412-afk/difflens.git)
cd difflens
npm install
