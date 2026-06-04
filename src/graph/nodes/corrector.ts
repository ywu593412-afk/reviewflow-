import { GraphStateType } from "../state.js";
import { ReviewComment } from "../../types.js";
// 请替换为你项目中实际调用大模型的工具函数
// import { invokeLLM } from "../../utils/llm.js"; 

export async function correctorNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log(`[Corrector Node] 开始第 ${state.retryCount} 次坐标修正...`);

  const commentsToCorrect = state.pendingVerifyComments || [];
  if (commentsToCorrect.length === 0 || !state.validationErrors.length) {
    return {};
  }

  const errorContext = state.validationErrors.join("\n");
  
  // 提取有效的行段索引供大模型参考
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
    
    请严格对照有效索引，修正上述评论的 'line' 字段。如果确实无法找到对应的代码行，请勿修改内容，尽力而为。
    必须且只能返回修正后的 JSON 数组，格式例如: [{ "path": "src/main.ts", "line": 15, "body": "..." }]
  `;

  try {
    // ⚠️ 此处依赖你的具体 LLM 调用封装，请按需调整
    // const responseText = await invokeLLM(prompt);
    // const correctedComments = JSON.parse(responseText) as ReviewComment[];
    
    // 这里为了演示不报错，暂用原数据模拟返回。实际使用请开启上方代码。
    const correctedComments = commentsToCorrect;

    return {
      pendingVerifyComments: correctedComments,
    };
  } catch (error) {
    console.error("[Corrector Node] LLM 纠错生成或解析失败:", error);
    // 如果大模型出错或 JSON 解析失败，我们原样返回，
    // 交给下一轮的 Verifier 触发重试上限的优雅降级，防止系统崩溃
    return { pendingVerifyComments: commentsToCorrect };
  }
}
