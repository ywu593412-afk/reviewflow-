// 1. 导出多智能体网络核心入口
export { graph } from "./graph/builder.js";

// 2. 导出基准测试需要的 Diff 解析函数
export { parseDiff as parseDiffToValidLines } from "./verifier/diffParser.js";

// 3. 导出具备高内聚校验与防御能力的核心节点
export { validateCoordinatesNode } from "./verifier/commentVerifier.js";

// === 下面是故意制造漏洞的测试代码 ===
export function testBug() {
  const data = [1, 2, 3];
  // 故意制造：魔术数字 (Style) + 越界隐式解引用 (Logic) + 未处理的异步 (Logic)
  if (data.length > 0) {
    console.log(data[5].id); 
  }
  Promise.resolve('test');
}
