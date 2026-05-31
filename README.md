# DiffLens

A lightweight TypeScript tool built with LangGraph for reviewing Git diffs, with additional verification steps designed to isolate and filter out-of-bounds line hallucinations.

*Note: This project started as an experiment to move beyond single-prompt review scripts and see if a structured pipeline can stop broken coordinate references before displaying the final output.*

---

## The Problem

Standard AI code review scripts that dump a raw `git diff` into a single prompt often become unreliable in real-world usage due to three distinct engineering bottlenecks:
1. **Line-Number Hallucination**: The model regularly invents code changes or comments on lines that do not exist within the modified patch.
2. **Comment Position Drift**: Review comments can lose positional accuracy when patches contain rapid, iterative modifications.
3. **Structured Output Failures**: Complex or dense diff chunks easily trigger truncated or non-compliant JSON responses from the underlying LLM, breaking strict parser schemas.

## The Approach

Instead of a linear API wrapper, the pipeline is split into three explicit nodes. **LangGraph is mainly used here for typed state transitions and node-level observability rather than autonomous agent behavior.**

1. **Diff Parser Node**: Validates raw incoming git patch strings, isolates individual hunks, and runs them through a Zod schema to ensure no empty or corrupted states are passed forward.
2. **Reviewer Node**: Evaluates sanitized code changes for common runtime issues, including null handling, async error propagation, and boundary-condition regressions.
3. **Verifier Node**: Intercepts the reviewer's markdown draft and cross-references it against the parsed valid line ranges from Node 1. It strictly filters out or clips comments targeting non-existent line coordinates.

> **Engineering Boundary Notice**: The verifier validates coordinate integrity only; it does not evaluate the logical reasoning or accuracy of the review itself.

---

## Representative Pipeline Trace

The following terminal output demonstrates the pipeline mechanism during a local test run, specifically showing how the verifier node handles a positional mismatch:

```text
$ node dist/index.js --file=test.diff

[info] [parser] input patch received: 1 file changed, 1 insertion(+), 1 deletion(-)
[info] [parser] extracted valid hunk range for src/utils.ts: lines [10-14]
[info] [parser] state schema validated via Zod. transitioning to reviewer...
[info] [reviewer] llm payload received. generated 2 raw review comments.
[debug] [reviewer] draft comment 1 -> src/utils.ts:10
[debug] [reviewer] draft comment 2 -> src/utils.ts:78
[info] [verifier] intercepting draft payload for validation...
[info] [verifier] comment 1 (line 10) inside valid range [10-14] -> approved
[warn] [verifier] comment 2 targets line 78 (outside hunk range [10-14]) -> reference dropped
[info] [pipeline] execution finished. outputting filtered markdown report.
