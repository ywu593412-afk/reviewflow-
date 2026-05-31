\# ReviewFlow

An enterprise-grade, autonomous multi-agent code review framework built with TypeScript (ESM) and LangGraph. ReviewFlow seamlessly orchestrates a swarm of specialized AI agents to concurrently audit pull requests, perform structural risk assessment, and automatically inject line-level markdown annotations directly back into GitHub Pull Requests.

\## Features

&#x20;- Graph-Driven Orchestration: Leverages LangGraph to build a reliable Directed Acyclic Graph (DAG) state topology instead of standard linear, unreliable prompts.

&#x20;- Concurrent Specialized Auditing:

&#x20;Style \& Format Auditor: Analyzes line-by-line linting infractions and structural syntax layout.

&#x20;Security Risk Scanner: Scans deep into code diffs to isolate hardcoded secrets, SQL injections, and buffer vulnerabilities.

&#x20;Logic \& Performance Reviewer: Flags algorithmic complexity regressions, unhandled async failures, and boundary edge cases.

&#x20;- Structured Output Integrity: Implements robust strict schema validation using Zod to guarantee that the LLM payload conforms precisely to the GitHub Review API types.

&#x20;- Asynchronous CI/CD Native: Seamless automation via GitHub Actions triggered instantly on pull\_request event states.

\## Architecture Design

ReviewFlow bypasses traditional naive prompt single-pass audits. By piping unified pull request diffs into an immutable state vector, downstream agent graphs process domains in parallel. A conflict-resolving aggregator node maps scattered token chunks back to physical line numbers before calling the native Octokit gateway.

\## Getting Started

\### Installation

npm install

\### Build Production ESM

npm run build

\### Code Verification

npm run lint

\## License

Distributed under the Apache License 2.0. See LICENSE for more information.

