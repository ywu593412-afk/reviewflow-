// src/index.ts

// 1. 导出多智能体网络核心入口
export { graph } from "./graph/builder.js";

// 2. 导出基准测试需要的 Diff 解析函数
export { parseDiff as parseDiffToValidLines } from "./verifier/diffParser.js";

// 3. 导出具备高内聚校验与防御能力的核心节点
export { validateCoordinatesNode } from "./verifier/commentVerifier.js";

// === 下面是故意制造的逻辑漏洞（AI 必须抓到这个） ===
export function testBug() {
  // 故意制造一个明显的代码风险：访问未定义对象的属性
  // 任何 AI 审查员看到这里都会触发警告
  const obj: any = undefined;
  return obj.someProperty; 
}
