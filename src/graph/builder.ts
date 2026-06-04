import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState, GraphStateType } from "./state.js";

// 引入你所有的业务节点（请确保路径与你实际文件中的导出名一致）
import { styleAgent } from "./nodes/styleAgent.js"; 
import { securityAgent } from "./nodes/securityAgent.js";
import { logicAgent } from "./nodes/logicAgent.js";
import { verifierNode } from "./nodes/verifier.js";
import { correctorNode } from "./nodes/corrector.js";

// 💡 聚合节点：负责解决 LangGraph 的并发等待问题
// 当三个初始 Agent 跑完后，它负责把结果打包送入循环池
function aggregateNode(state: GraphStateType): Partial<GraphStateType> {
  const allInitialComments = [
    ...(state.styleComments || []),
    ...(state.securityComments || []),
    ...(state.logicComments || []),
  ];
  return { pendingVerifyComments: allInitialComments };
}

// 💡 条件路由函数：判断是走向纠错还是走向结束
function checkVerificationStatus(state: GraphStateType) {
  if (state.validationErrors && state.validationErrors.length > 0) {
    return "correctorNode"; // 有错，打回修正
  }
  return END; // 全对，或者已被截断降级，结束流程
}

// 构建图谱
const workflow = new StateGraph(GraphState)
  // 1. 注册所有的 Node
  .addNode("styleAgent", styleAgent)
  .addNode("securityAgent", securityAgent)
  .addNode("logicAgent", logicAgent)
  .addNode("aggregateNode", aggregateNode)
  .addNode("verifierNode", verifierNode)
  .addNode("correctorNode", correctorNode)

  // 2. 并发起点：同时触发三个审查维度的 Agent
  .addEdge(START, "styleAgent")
  .addEdge(START, "securityAgent")
  .addEdge(START, "logicAgent")

  // 3. 并发终点：汇聚到聚合节点
  .addEdge("styleAgent", "aggregateNode")
  .addEdge("securityAgent", "aggregateNode")
  .addEdge("logicAgent", "aggregateNode")

  // 4. 将初始总数据送入验证器
  .addEdge("aggregateNode", "verifierNode")

  // 5. 核心状态机路由：根据验证结果分发
  .addConditionalEdges("verifierNode", checkVerificationStatus)

  // 6. 纠错完成后，必须强制回到验证器，形成死循环防护闭环
  .addEdge("correctorNode", "verifierNode");

// 编译并导出可运行的应用实例
export const app = workflow.compile();
