import { GraphStateType } from "../state.js";
// 引入你封装的 LLM 工具（这里仅作伪代码示意）
import { invokeLLM } from "../utils/llm.js"; 

export async function correctorNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log(`[Corrector Node] 开始第 ${state.retryCount} 次坐标修正...`);

  // 取出被 Verifier 拦截的详细错误信息
  const errorContext = state.validationErrors.join("\n");

  // 构建针对性的纠错 Prompt
  const prompt = `
    你是一个代码审查纠错智能体。前面的模型生成了很好的评论，但行坐标越界了。
    目前的有效文件行范围索引：${JSON.stringify(Array.from(state.diffIndex.entries()))}
    
    以下是越界的评论及其报错详情：
    ${errorContext}
    
    请严格对照有效索引修正这些评论的 'line' 字段。无法修正的请将 'line' 设为 0。
    直接返回修正后的 ReviewComment 数组格式 JSON。
  `;

  // 调用模型获取修复后的评论（需确保模型输出 JSON 并解析）
  const correctedComments = await invokeLLM(prompt); 

  // 将上一次已经通过的 finalComments，与这次修正完的 correctedComments 合并，
  // 重新放回 pendingVerifyComments 让 Verifier 再检查一次
  return {
    pendingVerifyComments: [...state.finalComments, ...correctedComments],
  };
}
