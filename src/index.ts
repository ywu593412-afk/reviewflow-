// src/index.ts

// 1. 导出 graph 目录下的多智能体网络核心入口
export { runDiffLens } from "./graph/builder.js";

// 2. 导出 verifier 目录下的物理校验核心函数（供 CLI 和基准测试脚本调用）
export { parseDiffToValidLines } from "./verifier/diffParser.js";
export { validateCoordinatesNode } from "./verifier/commentVerifier.js";
