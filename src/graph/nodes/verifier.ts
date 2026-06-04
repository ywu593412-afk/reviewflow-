import { GraphStateType } from "../state.js";
// 请确保这里的路径与你实际的坐标校验函数路径一致
import { validateCoordinatesNode } from "../../verifier/commentVerifier.js";

// 设置最大重试次数
const MAX_RETRIES = 2;

export async function verifierNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  try {
    console.log(`[Verifier] 开始校验，当前重试次数: ${state.retryCount}`);

    const commentsToVerify = state.pendingVerifyComments || [];
    if (commentsToVerify.length === 0) {
      return {};
    }

    // 调用底层的坐标映射检查函数
    const result = validateCoordinatesNode(commentsToVerify, state.diffIndex, "classify");
    
    const passedComments = result.passed || [];
    const rejectedComments = result.rejected || [];

    // 情况 A：所有评论坐标合法，全部放行
    if (rejectedComments.length === 0) {
      return {
        finalComments: [...(state.finalComments || []), ...passedComments],
        pendingVerifyComments: [], // 清空流转池
        validationErrors: [],      // 清空报错日志
      };
    }

    // 情况 B：存在非法坐标，且尚未达到重试上限，打回重写
    if (state.retryCount < MAX_RETRIES) {
      const errors = rejectedComments.map(
        (c) => `文件 ${c.path} 的第 ${c.line} 行超出修改范围，请重新确认。`
      );
      
      return {
        finalComments: [...(state.finalComments || []), ...passedComments],
        pendingVerifyComments: rejectedComments, // 留给 Corrector 修正
        validationErrors: errors,
        retryCount: state.retryCount + 1,
      };
    }

    // 情况 C：存在非法坐标，且已达到重试上限，执行优雅降级
    const degradedComments = rejectedComments.map((c) => ({
      ...c,
      line: 0, 
      body: `[原定位第 ${c.line} 行，坐标已失效] ${c.body}`
    }));

    return {
      finalComments: [...(state.finalComments || []), ...passedComments],
      generalComments: [...(state.generalComments || []), ...degradedComments],
      pendingVerifyComments: [], // 清空流转池，结束循环
      validationErrors: [],      // 清空报错日志
    };

  } catch (error) {
    console.error("[Verifier Node] Execution failed:", error);
    return { pendingVerifyComments: [] };
  }
}
