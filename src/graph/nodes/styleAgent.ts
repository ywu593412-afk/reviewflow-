import { GraphStateType } from "../state.js";
import { getModelInstance } from "../../llm/factory.js";
import { z } from "zod";

// 💡 必须与 logicAgent 保持完全一致的输出结构，确保图网络状态顺利汇聚
const StyleOutputSchema = z.object({
  comments: z.array(
    z.object({
      file: z.string().describe("The file path being reviewed"),
      line: z.number().describe("The precise, absolute line number prefixed with '+' in the diff"),
      body: z.string().describe("Concise and critical code style feedback")
    })
  )
});

export async function styleAgentNode(state: GraphStateType) {
  // 💡 算力分级：风格审查不需要极深推理，降配使用较快的 flash 模型，提升整体并行速度
  const model = getModelInstance("gemini", "gemini-1.5-flash", 0.2);
  const structuredModel = model.withStructuredOutput(StyleOutputSchema);

  const systemPrompt = `You are an uncompromising Clean Code enforcer. Your sole objective is to ruthlessly critique the incoming code for readability, maintainability, and naming conventions.

[RULES OF ENGAGEMENT]
1. ZERO COMPLIMENTS: Do not praise the code. Silence means approval.
2. SUBSTANCE ONLY: Point out the exact smell and explain why it is bad.
3. LANGUAGE: Write all 'body' feedback in precise, professional Chinese.

[TARGET CODE SMELLS]
Examine the Git Diff strictly against these readability issues:
- Magic Variables: Unexplained hardcoded numbers or strings.
- Poor Naming: Cryptic, overly abbreviated, or misleading variable/function names.
- Cognitive Complexity: Excessive nesting (e.g., deep if/else or loop chains) or functions that clearly do too many things.
- Comment Clutter: Redundant comments that just repeat what the code does, or commented-out dead code.

[CRITICAL COORDINATE REQUIREMENTS]
- You must ONLY generate feedback on lines prefixed with '+' in the provided diff.
- Carefully examine the hunk headers (e.g., "@@ -oldStart,len +newStart,len @@") to compute the precise, absolute line number in the incoming new file.
- If a style defect belongs to an unchanged context line or a deleted '-' line, you MUST SILENTLY DROP it. Do not guess or shift coordinates.
- If the code is clean and adheres to standard practices, return an empty comments array.`;

  try {
    const response = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here is the Git Diff to review:\n\n${state.diff}` }
    ]);

    return {
      comments: response.comments,
    };
  } catch (error) {
    console.error("[Style Agent] Failed to generate structured review:", error);
    // 容错兜底：如果 Flash 模型偶尔输出异常，返回空数组，绝不能阻塞整个图网络
    return { comments: [] }; 
  }
}
