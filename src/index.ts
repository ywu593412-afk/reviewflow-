import { parseDiff } from "./verifier/diffParser.js";
import { validateCoordinatesNode } from "./verifier/commentVerifier.js";

export { parseDiff as parseDiffToValidLines, validateCoordinatesNode };

// 模拟导出 graph 对象，以便 main.ts 调用
export const graph = {
  invoke: async (input: any) => {
    // 你的 AI 处理逻辑在这里
    return { comments: [] }; 
  }
};

// 修复崩溃后的代码逻辑
export function testBug() {
  const obj: any = undefined;
  
  // 增加安全防护，防止运行时崩溃
  if (obj && obj.someProperty) {
    console.log(obj.someProperty);
  } else {
    console.warn("检测到空对象访问，已拦截崩溃。");
  }
  
  // 修复你日志里报错的 user 对象访问
  const user: any = undefined; 
  if (user && user.name) {
      console.log(user.name);
  } else {
      console.warn("警告：user 对象为空，跳过此属性访问");
  }
}
