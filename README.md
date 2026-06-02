# difflens (v1.3.0)

**A deterministic validation engine that prevents LLM line-number hallucinations from reaching pull requests.**

AI code review systems often generate valuable feedback but attach comments to non-existent lines, deleted code, or coordinates that fall outside the actual patch. These failures make automated review pipelines unreliable and difficult to trust in production environments.

difflens solves this by parsing unified diffs, constructing an exact whitelist of reviewable coordinates, and validating every generated comment against that coordinate map before publication. Invalid references are rejected or deterministically remapped when possible.

Built in TypeScript with LangGraph JS and Octokit, difflens can run as a standalone validation engine or integrate directly into CI workflows through GitHub Actions.

**Result: every emitted review comment is guaranteed to reference a valid location inside the reviewed patch.**