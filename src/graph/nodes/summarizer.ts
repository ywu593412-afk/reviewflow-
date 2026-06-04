import { GraphStateType } from "../state.js";
import { getModelInstance } from "../../llm/factory.js";

export async function summarizerNode(state: GraphStateType) {
  console.log("[Summarizer] 开始生成代码审查摘要...");
  const allComments = [...state.finalComments, ...state.generalComments];
  
  if (allComments.length === 0) {
    return { summary: "代码逻辑无瑕疵，审查通过。" };
  }

  const model = getModelInstance("deepseek", "deepseek-chat", 0.3);
  const prompt = `将以下代码审查意见归类总结：\n${JSON.stringify(allComments)}\n\n要求：用简练的中文生成一份PR审查摘要，按“架构问题”、“性能优化”、“规范建议”分类，并在末尾给出一个总体评价。不要包含 Markdown 标记。`;

  try {
    const response = await model.invoke(prompt);
    return { summary: response.content };
  } catch (e) {
    console.error("[Summarizer] 摘要生成失败:", e);
    return { summary: "审查完成，但摘要生成出现小故障。" };
  }
}
