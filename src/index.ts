import { parseDiff } from "./verifier/diffParser.js";
import { validateCoordinatesNode } from "./verifier/commentVerifier.js";
import { graph } from "./graph/builder.js"; 

export { parseDiff as parseDiffToValidLines, validateCoordinatesNode, graph };

// === 换成这个极度危险的测试函数 ===
export function testBug() {
  // 1. 严重的安全漏洞：密码硬编码
  const dbPassword = "super_secret_admin_password_123!";
  
  // 2. 绝对会被 AI 拦截的危险代码执行
  eval("console.log('User password is: " + dbPassword + "')");
  
  // 3. 致命的业务逻辑漏洞：死循环
  let count = 0;
  while (count < 10) {
    console.log("这段代码会永远卡死，因为 count 永远不自增");
  }
}
