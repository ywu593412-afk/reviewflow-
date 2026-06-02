// src/index.ts
import { graph } from "./graph/builder.js";
import { parseDiff } from "./verifier/diffParser.js";
import { verifyComments } from "./verifier/commentVerifier.js";

// 1. 导出多智能体网络核心入口
export { graph };

// 2. 导出基准测试需要的 Diff 解析函数
export { parseDiff as parseDiffToValidLines };

// 3. 💥 终极防御与字段双向适配层：粉碎一切因测试脚本命名差异导致的崩溃
export function validateCoordinatesNode(comments: any, diffIndex: any, strategy: any) {
  const actualComments = Array.isArray(comments)
    ? comments
    : (comments && typeof comments === "object" && Array.isArray(comments.comments))
      ? comments.comments
      : [];

  const actualDiffIndex = diffIndex || (comments && typeof comments === "object" ? (comments.diffIndex || comments.index) : undefined);

  // 执行核心校验逻辑
  const verificationResult = verifyComments(actualComments, actualDiffIndex, strategy);

  // 💡 字段防错兼容：确保每个评论对象同时拥有 file 和 path 属性，杜绝 undefined
  const normalize = (arr: any[]) =>
    (arr || []).map(c => ({
      ...c,
      file: c.file || c.path,
      path: c.path || c.file
    }));

  const passed = normalize(verificationResult.passed);
  const corrected = normalize(verificationResult.corrected);
  const rejected = normalize(verificationResult.rejected);

  // 💡 核心修复：合并已验证通过和已自动修正的评论，作为 validatedComments 喂给第 50 行
  const validatedComments = [...passed, ...corrected];

  return {
    errors: rejected,
    validatedComments: validatedComments,
    passed: passed,
    corrected: corrected,
    rejected: rejected
  };
}
