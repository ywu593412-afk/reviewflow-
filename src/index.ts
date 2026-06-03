// src/index.ts

// 1. 导出多智能体网络核心入口
export { graph } from "./graph/builder.js";

// 2. 导出基准测试需要的 Diff 解析函数
export { parseDiff as parseDiffToValidLines } from "./verifier/diffParser.js";

// 3. 导出具备高内聚校验与防御能力的核心节点
export { validateCoordinatesNode } from "./verifier/commentVerifier.js";
