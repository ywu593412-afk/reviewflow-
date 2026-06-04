# DiffLens (v1.3.0)

A deterministic validation layer for AI-assisted code reviewers to eliminate coordinate hallucinations and prevent silent comment failures.

---

## The Problem

When using Large Language Models (LLMs) for automated code reviews, models frequently generate brilliant security and logic feedback but fail to anchor those comments to the correct line numbers in the Git Diff. Because standard hosting platforms (like GitHub) strictly validate comment coordinates, any out-of-bounds line numbers result in a hard failure (`422 Unprocessable Entity`), causing up to **64% of valuable AI review comments to be silently dropped**.

## The Solution

DiffLens injects a deterministic guardrail between the LLM pipeline and the GitHub API. Instead of blindly trusting the model's line references, DiffLens parses raw unified diffs first, constructs a precise map of valid reviewable locations, and enforces this as a hard constraint. If a generated comment targets an invalid coordinate, it is gracefully filtered or corrected before reaching the API.

### Architecture

```
[ LLM Agent (High Entropy) ] 
             │
             ▼ (Hallucinated Output: comment.line = 123)
[ VerifierNode (DiffLens Validation Layer) ] ───► [ Intercepts & Blocks Out-of-Bounds ]
             │
             ▼ (Validated Output: comment.line = 34)
[ GitHub API (Strict Deterministic Gateway) ] ───► [ 100% Reliable Delivery ]
```

> 💡 **Read the full engineering breakdown and story behind DiffLens on [DEV.to](https://dev.to/shy_the_a91bfb236d4eeb5bb/i-thought-my-ai-code-reviewer-was-finished-then-a-single-hallucinated-line-number-broke-everything-2a55）**

---

## Features

- **Deterministic Guardrails**: Guarantees a 0% drop rate from coordinate hallucinations.
- **LangGraph Orchestration**: Built using a custom Multi-Agent architecture orchestrated via LangGraph JS.
- **Robust Diff Parsing**: Fully compatible with standard Git unified diff protocols, including edge cases like single-line hunks.

## Setup & Configuration

DiffLens requires the following environment variables to be configured in your pipeline:

```bash
# GitHub Access Token for posting PR comments
GITHUB_TOKEN=your_github_pat_here

# LLM Provider Configuration
OPENAI_API_KEY=your_openai_key_here
```

## Quick Start

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/ywu593412-afk/difflens.git
cd difflens
npm install
```

### 2. Run the Reviewer
To run the multi-agent review pipeline against the target Pull Request:
```bash
npm run review -- --pr=<PR_NUMBER> --repo=<OWNER/REPO>
```

---

## License
MIT License
```

