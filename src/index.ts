// src/index.ts

// 1. 导出多智能体网络核心入口
export { graph } from "./graph/builder.js";

// 2. 导出基准测试需要的 Diff 解析函数
export { parseDiff as parseDiffToValidLines } from "./verifier/diffParser.js";

// 3. 用 as 将 verifyComments 重命名转发为测试脚本需要的 validateCoordinatesNode
export { verifyComments as validateCoordinatesNode } from "./verifier/commentVerifier.js";
