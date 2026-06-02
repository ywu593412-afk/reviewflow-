// src/index.ts
import { graph } from "./graph/builder.js";
import { parseDiff } from "./verifier/diffParser.js";
import { verifyComments } from "./verifier/commentVerifier.js";

// 1. 导出多智能体网络核心入口
export { graph };

// 2. 导出基准测试需要的 Diff 解析函数
export { parseDiff as parseDiffToValidLines };

// 3. 💥 工业级防御性别名转发：自动兼容 数组、LangGraph State 对象 以及 undefined，彻底粉碎 "not iterable" 报错
export function validateCoordinatesNode(comments: any, diffIndex: any, strategy: any) {
  // 如果第一个参数是标准的数组，直接使用
  // 如果第一个参数是对象且含有 comments 数组，自动提取
  // 其他任何奇葩情况（如 undefined），直接兜底为空数组 []，确保绝对可迭代
  const actualComments = Array.isArray(comments)
    ? comments
    : (comments && typeof comments === "object" && Array.isArray(comments.comments))
      ? comments.comments
      : [];

  // 同理防错：如果第一个参数是对象，尝试从中提取 diffIndex 索引
  const actualDiffIndex = diffIndex || (comments && typeof comments === "object" ? (comments.diffIndex || comments.index) : undefined);

  return verifyComments(actualComments, actualDiffIndex, strategy);
}
