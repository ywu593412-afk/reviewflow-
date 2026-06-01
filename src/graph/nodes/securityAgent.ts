import { GraphStateType } from "../state.js";
import { getModelInstance } from "../../llm/factory.js";
import { z } from "zod";

const SecurityOutputSchema = z.object({
  comments: z.array(
    z.object({
      path: z.string().describe("The file path being reviewed"),
      line: z.number().describe("The precise, absolute line number prefixed with '+' in the diff"),
      body: z.string().describe("Concise and critical security review feedback")
    })
  )
});

export async function securityAgentNode(state: GraphStateType) {
  const model = getModelInstance("gemini", "gemini-1.5-pro", 0.1);
  const structuredModel = model.withStructuredOutput(SecurityOutputSchema);

  const systemPrompt = `You are a hostile AppSec Auditor and Penetration Testing Expert. Your sole purpose is to flag exploitable security vulnerabilities and attack vectors introduced in the Git diff.

[RULES OF ENGAGEMENT]
1. ZERO TOLERANCE: Do not give pass marks or advice on boilerplate. If no vulnerability is present, return an empty comments array.
2. EXPLOIT PROOF: Every comment must state the concrete threat model (e.g., "Attacker parameter X can bypass path resolution via Y to read Z").
3. LANGUAGE: Write all 'body' feedback in precise, professional Chinese.

[TARGET ATTACK VECTORS]
Audit the Git Diff ruthlessly against these precise security flaws:
- Credential & Secret Exposure: Hardcoded entropy, plain-text private keys, webhook secrets, or variables exposed to client bundles (look for 'sk-', 'key-', 'secret').
- Injection & Context Breaking: Unsanitized dynamic execution paths (eval, new Function, child_process.exec), unsanitized user inputs inside raw database query fragments, or OS command injection vectors.
- Path Traversal & SSRF: Unvalidated URL construction using external strings (potential SSRF via fetch/axios), or file system interaction using naive path concatenation instead of secure path.resolve/path.join with boundary checks.
- Cryptographic Deficits & ReDoS: Use of Math.random() for security tokens/IDs (instead of crypto.randomUUID), weak hashing (MD5/SHA1), or user-controlled complex Regular Expressions vulnerable to ReDoS (Regex Denial of Service).

[CRITICAL COORDINATE REQUIREMENTS]
- You must ONLY generate feedback on lines prefixed with '+' in the provided diff.
- Carefully examine the hunk headers to compute the precise, absolute line number in the incoming new file.
- If a security flaw belongs to an unchanged context line or a deleted '-' line, you MUST SILENTLY DROP it.
- If the code contains no security failures, return an empty comments array.`;

  try {
    const response = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here is the Git Diff to review:\n\n${state.diff}` }
    ]);

    return {
      securityComments: response.comments,
    };
  } catch (error) {
    console.error("[Security Agent] Failed to generate structured review:", error);
    return { securityComments: [] };
  }
}
