import { GraphStateType } from "../state.js";
import { validateCoordinatesNode } from "../../verifier/commentVerifier.js";

// 设置最大重试次数，防止模型陷入幻觉死循环
const MAX_RETRIES = 2;

export async function verifierNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  try {
    console.log(`[Verifier] 开始校验，当前重试次数: ${state.retryCount}`);

    // 1. 获取当前需要校验的评论（来自各个 Agent 的初始汇总，或 Corrector 的修正结果）
    const commentsToVerify = state.pendingVerifyComments || [];
    if (commentsToVerify.length === 0) {
      return {};
    }

    // 2. 调用底层校验逻辑
    // 假设你的校验函数能分离出 passed 和 rejected
    const result = validateCoordinatesNode(commentsToVerify, state.diffIndex, "classify");
    
    const passedComments = result.passed || [];
    const rejectedComments = result.rejected || [];

    // 3. 校验全部通过：清空流转池，写入最终结果
    if (rejectedComments.length === 0) {
      return {
        finalComments: passedComments,
        pendingVerifyComments: [], // 清空临时池
        validationErrors: [],      // 清空错误
      };
    }

    // 4. 存在越界坐标，检查是否达到重试上限
    if (state.retryCount < MAX_RETRIES) {
      // 尚未达到上限：生成错误日志供 Corrector 读取，增加重试次数
      const errors = rejectedComments.map(
        (c) => `文件 ${c.path} 的第 ${c.line} 行超出修改范围，请根据提供的索引重新确认。`
      );
      
      return {
        // passed 的那部分我们先留着或者一并放回 pending，这里为了稳妥起见，
        // 我们只把 passed 累加到 finalComments，剩下的留在 pending 中等 Corrector 修正
        finalComments: [...state.finalComments, ...passedComments],
        pendingVerifyComments: rejectedComments, 
        validationErrors: errors,
        retryCount: state.retryCount + 1,
      };
    }

    // 5. 达到重试上限：执行优雅降级
    // 将依然无法确定准确行号的评论，剥离行号，转入全局评论池
    const degradedComments = rejectedComments.map((c) => ({
      ...c,
      line: 0, 
      body: `[原定位第 ${c.line} 行，坐标已失效] ${c.body}`
    }));

    return {
      finalComments: [...state.finalComments, ...passedComments], // 合法的正常输出
      generalComments: [...state.generalComments, ...degradedComments], // 无法修正的降级输出
      pendingVerifyComments: [], // 清空临时池，结束当前循环
      validationErrors: [], // 清空错误信息，让路由指向结束
    };

  } catch (error) {
    console.error("[Verifier Node] Execution failed:", error);
    return { pendingVerifyComments: [] };
  }
}
