import { parseDiff } from "./verifier/diffParser.js";
import { validateCoordinatesNode } from "./verifier/commentVerifier.js";
// 把真正的 AI 大脑接回来
import { graph } from "./graph/builder.js"; 

export { parseDiff as parseDiffToValidLines, validateCoordinatesNode, graph };

// === 下面是故意制造的逻辑漏洞（AI 必须抓到这个） ===
export function testBug() {
  // 故意制造一个明显的代码风险：访问未定义对象的属性
  // 只要这个函数不被执行，就不会搞崩流水线；但 AI 审查源码时一定会报警
  const user: any = undefined;
  
  console.log(user.name); // 致命错误 1
  return user.someProperty; // 致命错误 2
}
