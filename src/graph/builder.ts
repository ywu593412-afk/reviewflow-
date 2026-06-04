import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState, GraphStateType } from "./state.js";

// 导入你的三支特种兵部队 (保持你原有的命名)
import { logicAgentNode } from "./nodes/logicAgent.js";
import { styleAgentNode } from "./nodes/styleAgent.js";
import { securityAgentNode } from "./nodes/securityAgent.js";

// 导入终极防线(校验器)与新建的后勤部队(纠错器)
import { verifierNode } from "./nodes/verifier.js";
import { correctorNode } from "./nodes/corrector.js";

// 💡 聚合节点：负责解决 LangGraph 的并发等待陷阱
// 确保三个 Agent 都跑完后，再把所有初步评论打包送入待校验池，防止 verifier 被触发三次
function aggregateNode(state: GraphStateType): Partial<GraphStateType> {
  const allInitialComments = [
    ...(state.styleComments || []),
    ...(state.securityComments || []),
    ...(state.logicComments || []),
  ];
  return { pendingVerifyComments: allInitialComments };
}

// 💡 条件路由函数：判断是去纠错，还是走向结束
function checkVerificationStatus(state: GraphStateType) {
  if (state.validationErrors && state.validationErrors.length > 0) {
    return "corrector"; // 有报错日志，打回修正
  }
  return END; // 完美通过，或已达到重试上限并完成降级，结束流程
}

// 初始化状态图网络
const workflow = new StateGraph(GraphState)
  // 1. 注册所有节点
  .addNode("logic_agent", logicAgentNode)
  .addNode("style_agent", styleAgentNode)
  .addNode("security_agent", securityAgentNode)
  .addNode("aggregate", aggregateNode)
  .addNode("verifier", verifierNode)
  .addNode("corrector", correctorNode)

  // 2. 并行分发 (Fan-out)：网络启动时，三个 Agent 同时去审这份 Diff
  .addEdge(START, "logic_agent")
  .addEdge(START, "style_agent")
  .addEdge(START, "security_agent")

  // 3. 统一汇聚 (Fan-in)：所有 Agent 审完后，全部指向聚合节点
  .addEdge("logic_agent", "aggregate")
  .addEdge("style_agent", "aggregate")
  .addEdge("security_agent", "aggregate")

  // 4. 将汇总后的脏数据送入物理过滤防线
  .addEdge("aggregate", "verifier")

  // 5. 核心状态机路由：根据验证结果进行条件分流
  .addConditionalEdges("verifier", checkVerificationStatus)

  // 6. 纠错完成后，必须强制回到验证器，形成防死循环的校验闭环
  .addEdge("corrector", "verifier");

// 编译并导出可执行的图网络
export const graph = workflow.compile();
