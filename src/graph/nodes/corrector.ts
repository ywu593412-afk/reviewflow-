import { GraphStateType } from "../state.js";
import { getModelInstance } from "../../llm/factory.js"; // 复用你的工厂
import { z } from "zod";

// 定义纠错后的输出 Schema，与你的 logicAgent 保持一致，确保字段对齐
const CorrectionSchema = z.object({
  comments: z.array(
    z.object({
      path: z.string(), // 对应 ReviewComment 中的 path
      line: z.number(), // 修正后的行号
      body: z.string()  // 评论内容
    })
  )
});

export async function correctorNode(state: GraphStateType) {
  console.log(`[Corrector Node] 开始第 ${state.retryCount} 次坐标修正...`);

  const commentsToCorrect = state.pendingVerifyComments || [];
  if (commentsToCorrect.length === 0 || !state.validationErrors.length) {
    return {};
  }

  // 获取模型实例 (复用你现有的 pro 模型)
  const model = getModelInstance("gemini", "gemini-1.5-pro", 0.2);
  const structuredModel = model.withStructuredOutput(CorrectionSchema);

  const errorContext = state.validationErrors.join("\n");
  const validRanges = Array.from(state.diffIndex.entries()).map(([file, index]) => {
    return `文件: ${file}, 有效行段: ${JSON.stringify(index.hunks)}`;
  }).join("\n");

  const prompt = `
你是一个代码审查纠错智能体。以下审查评论在映射回原始文件时发生了行号(line)越界。
目前的有效文件行范围索引如下：
${validRanges}

报错详情：
${errorContext}

需要修正的评论数据：
${JSON.stringify(commentsToCorrect, null, 2)}

请严格对照有效索引，修正上述评论的 'line' 字段。如果确实无法找到对应的代码行，请勿修改内容。
请返回符合 schema 的 JSON 结构。
`;

  try {
    const response = await structuredModel.invoke([
      { role: "system", content: "你是一个专门负责修正代码审查行号坐标的智能体。" },
      { role: "user", content: prompt }
    ]);

    // 将修正后的 comments 映射为 ReviewComment[] 格式返回
    const corrected = response.comments.map(c => ({
        path: c.path,
        line: c.line,
        body: c.body
    }));

    return {
      pendingVerifyComments: corrected,
    };
  } catch (error) {
    console.error("[Corrector Node] LLM 纠错生成失败:", error);
    // 异常情况下返回原数据，交由 Verifier 触发降级逻辑，防止卡死
    return { pendingVerifyComments: commentsToCorrect };
  }
}
