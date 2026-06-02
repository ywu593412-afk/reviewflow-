// src/index.ts

// 1. 导出多智能体网络核心入口
export { graph } from "./graph/builder.js";

// 2. 导出基准测试需要的 Diff 解析函数
export { parseDiff as parseDiffToValidLines } from "./verifier/diffParser.js";

// 3. 补齐基准测试需要的坐标校验节点（把之前我看漏的这一行彻底加上）
export { validateCoordinatesNode } from "./verifier/commentVerifier.js";
