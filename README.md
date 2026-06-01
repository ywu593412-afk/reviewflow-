# DiffLens

A deterministic verification layer for AI code reviews that prevents line-coordinate hallucinations from reaching pull requests. Built with LangGraph, it orchestrates parallel review agents and validates every generated comment against actual diff coordinates to catch invalid, deleted, or out-of-scope line targets.

## The Problem

During development, we observed that LLMs regularly miscalculate line numbers when reading raw unified diffs. They frequently anchor critiques onto deleted lines (`-`), unchanged context boundaries, or coordinates completely outside the modified hunks. This results in noisy review feedback and increases review overhead for developers.

### Before / After Case Study

Given the following Git diff:

```diff
@@ -10,5 +10,6 @@
 function processPayment(user: User) {
-  logAdminAction(user.id);
+  if (!user.isActive) {
+    throw new Error("Inactive user");
+  }
   return stripe.charge(user.paymentId);
 }
