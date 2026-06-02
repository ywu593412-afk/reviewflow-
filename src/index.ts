// src/index.ts

// 1. 修正为正确的 graph 导出（把之前我瞎编的 runDiffLens 改掉）
export { graph } from "./graph/builder.js";

// 2. 保持别名转发，精准对接测试脚本
export { parseDiff as parseDiffToValidLines } from "./verifier/diffParser.js";
