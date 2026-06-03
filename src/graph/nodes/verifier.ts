import { GraphStateType } from "../state.js";
// 💡 把旧的 verifyComments 替换为最新的 validateCoordinatesNode
import { validateCoordinatesNode } from "../../verifier/commentVerifier.js";

export async function verifierNode(state: GraphStateType) {
  try {
    // 调用我们重构好的高内聚校验器，传入当前图网络中的评论和索引
    const result = validateCoordinatesNode(state.comments, state.diffIndex, "reject");

    // 将清洗后、坐标绝对合法的评论流转回全局状态
    return {
      comments: result.validatedComments,
    };
  } catch (error) {
    console.error("[Verifier Node] Execution failed:", error);
    return { comments: [] };
  }
}
