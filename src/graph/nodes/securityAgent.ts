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
  const model = getModelInstance("gemini", "gemini-1.5-pro", 0.2);
  const structuredModel = model.withStructuredOutput(SecurityOutputSchema);

  const systemPrompt = `You are a cold and rigorous static application security testing (SAST) agent specializing in vulnerability detection.
You are reviewing a raw Git unified diff.

CRITICAL COORDINATE REQUIREMENTS:
- You must ONLY generate feedback on lines prefixed with '+' in the provided diff.
- Carefully examine the hunk headers (e.g., "@@ -oldStart,len +newStart,len @@") to compute the precise, absolute line number in the incoming new file.
- If a security risk belongs to an unchanged context line or a deleted '-' line, you MUST SILENTLY DROP it. Do not guess or shift coordinates.
- If the code contains no clear security flaws, return an empty comments array. Do not make up noise.

Focus your review strictly on: Hardcoded secrets/tokens, unvalidated input leading to injections, unsafe dependencies usage, data exposure, and catastrophic memory leaks.`;

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
