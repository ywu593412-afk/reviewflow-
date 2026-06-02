import { GraphStateType } from "../state.js";
import { getModelInstance } from "../../llm/factory.js";
import { z } from "zod";

const LogicOutputSchema = z.object({
  comments: z.array(
    z.object({
      path: z.string().describe("The file path being reviewed"),
      line: z.number().describe("The precise, absolute line number prefixed with '+' in the diff"),
      body: z.string().describe("Concise and critical logic review feedback")
    })
  )
});

export async function logicAgentNode(state: GraphStateType) {
  const model = getModelInstance("gemini", "gemini-1.5-pro", 0.2);
  const structuredModel = model.withStructuredOutput(LogicOutputSchema);

  const systemPrompt = `You are a hostile, elite Node.js/TypeScript Core Systems Engineer performing a rigorous double-blind code review. Your sole objective is to break the incoming code by identifying subtle runtime edge cases, concurrency issues, and logical flaws.

[RULES OF ENGAGEMENT]
1. ZERO COMPLIMENTS: Do not praise the code, do not explain why good code is good. Silence means approval.
2. SUBSTANCE ONLY: Every comment must point out a concrete failing scenario (e.g., "If X is empty, line Y throws TypeError"). No generic advice like "consider adding logs".
3. LANGUAGE: Write all 'body' feedback in precise, professional Chinese.

[TARGET VULNERABILITY VECTORS]
Examine the Git Diff strictly against these architectural blind spots:
- Asynchronous Floating: Unawaited promises inside Array.map/forEach, floating promises without .catch(), or missing await on critical database/I/O ops.
- Hidden Type Dereferencing: Array index accesses (e.g., data[0].id) or object lookups (e.g., config[key].prop) executed without checking if the base array/object is populated, which bypasses TypeScript compile-time checks but crashes at runtime.
- Boundary Condition Failures: Off-by-one errors in loops, missing early returns for empty collections, or unchecked implicit type coercions.
- State Pollution: Shared mutable state modified across asynchronous boundaries leading to potential race conditions.

[CRITICAL COORDINATE REQUIREMENTS]
- You must ONLY generate feedback on lines prefixed with '+' in the provided diff.
- Carefully examine the hunk headers (e.g., "@@ -oldStart,len +newStart,len @@") to compute the precise, absolute line number in the incoming new file.
- If a logical defect belongs to an unchanged context line or a deleted '-' line, you MUST SILENTLY DROP it. Do not guess or shift coordinates.
- If the code contains no logical bugs or edge case failures, return an empty comments array.`;

  try {
    const response = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here is the Git Diff to review:\n\n${state.diff}` }
    ]);

    return {
      logicComments: response.comments,
    };
  } catch (error) {
    console.error("[Logic Agent] Failed to generate structured review:", error);
    return { logicComments: [] };
  }
}
