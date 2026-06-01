import { GraphStateType } from "../state.js";
import { getModelInstance } from "../../llm/factory.js";
import { z } from "zod";

// 使用 Zod 定义大模型必须返回的严格结构，确保输出与我们的基础类型契约一致
const StyleOutputSchema = z.object({
  comments: z.array(
    z.object({
      path: z.string().describe("The file path being reviewed"),
      line: z.number().describe("The precise, absolute line number prefixed with '+' in the diff"),
      body: z.string().describe("Concise code style review feedback")
    })
  )
});

export async function styleAgentNode(state: GraphStateType) {
  // 1. 今晚先硬编码实例化 Gemini，后续会由全局配置中心统一驱动
  const model = getModelInstance("gemini", "gemini-1.5-pro", 0.2);

  // 2. 利用 LangChain 的结构化输出接口，卡死大模型的返回格式
  const structuredModel = model.withStructuredOutput(StyleOutputSchema);

  // 3. 编排包含“事前约束”的严厉提示词系统
  const systemPrompt = `You are an expert static code analysis agent specializing in TypeScript/JavaScript code style and architectural best practices.
You are reviewing a raw Git unified diff.

CRITICAL COORDINATE REQUIREMENTS:
- You must ONLY generate feedback on lines prefixed with '+' in the provided diff.
- Carefully examine the hunk headers (e.g., "@@ -oldStart,len +newStart,len @@") to compute the precise, absolute line number in the incoming new file.
- If a style issue belongs to an unchanged context line or a deleted '-' line, you MUST SILENTLY DROP it. Do not guess or shift coordinates.
- If the code contains no pure style violations, return an empty comments array. Do not make up noise.

Focus your review on: Variable naming, TypeScript type safety, function decompilation, and code readability.`;

  try {
    const response = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here is the Git Diff to review:\n\n${state.diff}` }
    ]);

    // 4. 将提取出的干净候选评论写入对应的通道，触发 LangGraph 的自动聚合
    return {
      styleComments: response.comments,
    };
  } catch (error) {
    console.error("[Style Agent] Failed to generate structured review:", error);
    return { styleComments: [] };
  }
}
