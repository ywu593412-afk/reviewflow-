# 🚀 ReviewFlow

An enterprise-grade, autonomous multi-agent code review framework built with TypeScript (ESM) and LangGraph. ReviewFlow seamlessly orchestrates a swarm of specialized AI agents to concurrently audit pull requests, perform structural risk assessment, and automatically inject line-level markdown annotations directly back into GitHub Pull Requests.

---

## ✨ Features

* **🧠 Graph-Driven Orchestration**: Leverages LangGraph to build a reliable Directed Acyclic Graph (DAG) state topology instead of standard linear, unreliable prompts.
* **⚡ Concurrent Specialized Auditing**:
  * *Style & Format Auditor*: Analyzes line-by-line linting infractions and structural syntax layout.
  * *Security Risk Scanner*: Scans deep into code diffs to isolate hardcoded secrets, SQL injections, and buffer vulnerabilities.
  * *Logic & Performance Reviewer*: Flags algorithmic complexity regressions, unhandled async failures, and boundary edge cases.
* **🛡️ Structured Output Integrity**: Implements robust strict schema validation using Zod to guarantee that the LLM payload conforms precisely to the GitHub Pull Request types.
* **🤖 Asynchronous CI/CD Native**: Seamless automation with robust concurrency control to prevent GitHub API rate-limiting.
