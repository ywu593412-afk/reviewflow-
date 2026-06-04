import { GraphStateType } from "../state.js";
import { getModelInstance } from "../../llm/factory.js";
import { z } from "zod";

const CorrectionSchema = z.object({
  comments: z.array(z.object({ 
    path: z.string(), 
    line: z.number(), 
    body: z.string() 
  }))
});

export async function correctorNode(state: GraphStateType) {
  console.log(`[Corrector Node] 开始尝试修正越界行号...`);

  const commentsToCorrect = state.pendingVerifyComments || [];
  if (commentsToCorrect.length === 0 || !state.validationErrors.length) return {};

  // 1. 修正：调用你刚刚改好的深度求索工厂
  const model = getModelInstance("deepseek", "deepseek-chat", 0.1);
  const structuredModel = model.withStructuredOutput(CorrectionSchema);

  // 2. 增强 Prompt：明确要求输出纯净的 JSON
  const prompt = `
你是一个精准的代码审查修复助手。
当前文件有效修改范围：${JSON.stringify(Array.from(state.diffIndex.entries()))}
校验器报错详情：${state.validationErrors.join(" | ")}
需要修正的评论：${JSON.stringify(commentsToCorrect)}

任务：根据有效范围索引，将评论中的 'line' 字段修正为对应文件的实际合法行号。
要求：只输出 JSON 对象，不要包含任何 Markdown 标记（如 \`\`\`json），不要输出任何解释文字。`;

  try {
    const response = await structuredModel.invoke([
      { role: "system", content: "You are a precise coding assistant that only outputs valid JSON." },
      { role: "user", content: prompt }
    ]);

    return { 
      pendingVerifyComments: response.comments.map(c => ({ 
        ...c, 
        path: c.path, 
        line: c.line, 
        body: c.body 
      })) 
    };
  } catch (e) {
    console.error("[Corrector Node] DeepSeek 修正失败:", e);
    // 依然兜底返回原数据，避免工作流中断
    return { pendingVerifyComments: commentsToCorrect };
  }
}
