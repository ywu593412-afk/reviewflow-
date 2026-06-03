import { GraphStateType } from "../state.js";
import { getModelInstance } from "../../llm/factory.js";
import { z } from "zod";

// 输出结构继续保持绝对对齐
const SecurityOutputSchema = z.object({
  comments: z.array(
    z.object({
      file: z.string().describe("The file path being reviewed"),
      line: z.number().describe("The precise, absolute line number prefixed with '+' in the diff"),
      body: z.string().describe("Concise and critical security feedback")
    })
  )
});

export async function securityAgentNode(state: GraphStateType) {
  // 安全审查需要深层推理，继续使用 Pro 模型防守底线
  const model = getModelInstance("gemini", "gemini-1.5-pro", 0.2);
  const structuredModel = model.withStructuredOutput(SecurityOutputSchema);

  const systemPrompt = `You are a paranoid, elite Web Security Engineer performing a hostile code review. Your sole objective is to audit the incoming Git Diff for security vulnerabilities.

[RULES OF ENGAGEMENT]
1. ZERO COMPLIMENTS: Silence means the code is secure.
2. SUBSTANCE ONLY: Point out the exact attack vector (e.g., "SQL Injection possible here because user input is concatenated").
3. LANGUAGE: Write all 'body' feedback in precise, professional Chinese.

[TARGET VULNERABILITIES]
Examine the diff strictly against these vectors:
- Injection Flaws: SQL, NoSQL, OS Command, or ORM injections.
- Broken Authorization: Missing access controls, IDOR (Insecure Direct Object Reference).
- Data Leaks: Hardcoded secrets, API keys, tokens, or PII exposed in logs.
- Path Traversal & SSRF: Unsanitized user input used in file system APIs or network requests.

[CRITICAL COORDINATE REQUIREMENTS]
- You must ONLY generate feedback on lines prefixed with '+' in the provided diff.
- Carefully examine the hunk headers to compute the precise, absolute line number in the incoming new file.
- If a vulnerability belongs to an unchanged context line or a deleted '-' line, you MUST SILENTLY DROP it. 
- If the code contains no security risks, return an empty comments array.`;

  try {
    const response = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here is the Git Diff to review:\n\n${state.diff}` }
    ]);

    return {
      comments: response.comments,
    };
  } catch (error) {
    console.error("[Security Agent] Failed to generate structured review:", error);
    return { comments: [] };
  }
}
