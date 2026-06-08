import { ASTValidator } from './ast-validator';

const mockSourceCode = `
import { something } from 'somewhere';

// 一些干扰代码，用来打乱行号
function helper() {
  console.log("doing nothing");
  console.log("still doing nothing");
}

// 目标测试函数 1
export async function parseDiff(diffText: string) {
  // 假设大模型幻觉了，说这里是第 50 行
  const result = process(diffText);
  return result;
}

// 目标测试函数 2
class AgentState {
  execute() {
    return true;
  }
}
`;

async function runTest() {
  console.log("🚀 初始化 AST 验证器...");
  const validator = new ASTValidator();
  await validator.init();
  console.log("✅ 初始化成功！\n");
  
  try {
    console.log("🔍 正在测试寻找 'parseDiff' 函数的真实行号...");
    const coords1 = validator.findRealCoordinates(mockSourceCode, 'parseDiff');
    console.log(`🎯 精准命中！'parseDiff' 的真实起始行: ${coords1.realStartLine}, 结束行: ${coords1.realEndLine}\n`);

    console.log("🔍 正在测试寻找 'execute' 方法的真实行号...");
    const coords2 = validator.findRealCoordinates(mockSourceCode, 'execute');
    console.log(`🎯 精准命中！'execute' 的真实起始行: ${coords2.realStartLine}, 结束行: ${coords2.realEndLine}\n`);
    
    console.log("🛑 正在测试大模型胡编乱造的函数名...");
    validator.findRealCoordinates(mockSourceCode, 'hallucinationFunction');
    
  } catch (error: any) {
    console.log(`🛡️ 成功拦截错误: ${error.message}`);
  }
}

runTest().catch(console.error);
