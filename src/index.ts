// src/index.ts

// 1. 导出多智能体网络核心入口
export { graph } from "./graph/builder.js";

// 2. 导出基准测试需要的 Diff 解析函数
export { parseDiff as parseDiffToValidLines } from "./verifier/diffParser.js";

// 3. 导出具备高内聚校验与防御能力的核心节点
export { validateCoordinatesNode } from "./verifier/commentVerifier.js";

// === 下面是故意制造的逻辑漏洞（AI 会抓到这个） ===
export function testBug() {
  // 1. 故意制造魔术数字（这是代码审查中典型的坏味道）
  const threshold = 999;
  
  // 2. 故意引入不必要的复杂逻辑
  if (threshold === 999) {
    return "漏洞：使用了硬编码的魔术数字 999，应该定义为常量。";
  }
}
