// src/index.ts
import { graph } from "./graph/builder.js";
import { parseDiff } from "./verifier/diffParser.js";
import { verifyComments } from "./verifier/commentVerifier.js";

// 1. 导出多智能体网络核心入口
export { graph };

// 2. 导出基准测试需要的 Diff 解析函数
export { parseDiff as parseDiffToValidLines };

// 3. 💥 终极适配重载：完美桥接业务层的 rejected 和评测脚本死卡的 errors 字段
export function validateCoordinatesNode(comments: any, diffIndex: any, strategy: any) {
  const actualComments = Array.isArray(comments)
    ? comments
    : (comments && typeof comments === "object" && Array.isArray(comments.comments))
      ? comments.comments
      : [];

  const actualDiffIndex = diffIndex || (comments && typeof comments === "object" ? (comments.diffIndex || comments.index) : undefined);

  // 执行你的核心逻辑，拿到 { passed, corrected, rejected }
  const verificationResult = verifyComments(actualComments, actualDiffIndex, strategy);

  // 💡 核心修复：把业务层的 rejected 数组同时赋值给 errors 属性，彻底喂饱 benchmark.ts
  return {
    ...verificationResult,
    errors: verificationResult.rejected || [],
    passed: verificationResult.passed || [],
    corrected: verificationResult.corrected || [],
    rejected: verificationResult.rejected || []
  };
}
