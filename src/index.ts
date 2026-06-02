// src/index.ts

// 1. 导出 graph 目录下的多智能体网络核心入口
export { runDiffLens } from "./graph/builder.js";

// 2. 导出 verifier 目录下的物理校验核心函数
// 💡 用 as 把 parseDiff 重命名转发为测试脚本需要的 parseDiffToValidLines
export { parseDiff as parseDiffToValidLines } from "./verifier/diffParser.js";
export { validateCoordinatesNode } from "./verifier/commentVerifier.js";
