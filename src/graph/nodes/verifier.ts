export async function verifierNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log(">>> [Verifier] 被调用了！当前待校验数量:", state.pendingVerifyComments?.length);
  // ... 原有逻辑
import { GraphStateType } from "../state.js";
import { validateCoordinatesNode } from "../../verifier/commentVerifier.js";

const MAX_RETRIES = 2;

export async function verifierNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  try {
    const commentsToVerify = state.pendingVerifyComments || [];
    if (commentsToVerify.length === 0) return {};

    const result = validateCoordinatesNode(commentsToVerify, state.diffIndex, "classify");
    const passedComments = result.passed || [];
    const rejectedComments = result.rejected || [];

    if (rejectedComments.length === 0) {
      return {
        finalComments: [...(state.finalComments || []), ...passedComments],
        pendingVerifyComments: [],
        validationErrors: [],
      };
    }

    if (state.retryCount < MAX_RETRIES) {
      const errors = rejectedComments.map(c => `文件 ${c.path} 的第 ${c.line} 行越界，请修正。`);
      return {
        finalComments: [...(state.finalComments || []), ...passedComments],
        pendingVerifyComments: rejectedComments,
        validationErrors: errors,
        retryCount: state.retryCount + 1,
      };
    }

    const degradedComments = rejectedComments.map(c => ({
      ...c, line: 0, body: `[坐标失效] ${c.body}`
    }));

    return {
      finalComments: [...(state.finalComments || []), ...passedComments],
      generalComments: [...(state.generalComments || []), ...degradedComments],
      pendingVerifyComments: [],
      validationErrors: [],
    };
  } catch (e) {
    return { pendingVerifyComments: [] };
  }
}
