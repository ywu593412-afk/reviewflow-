import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import { styleAgent, securityAgent, logicAgent } from "./nodes/agents.js"; // 你的原始节点
import { verifierNode } from "./nodes/verifier.js";
import { correctorNode } from "./nodes/corrector.js";

// 💡 这是一个简单的聚合节点：它负责等待三个 Agent 跑完，把数据打包送入循环池
function aggregateNode(state: any) {
  const allInitialComments = [
    ...state.styleComments,
    ...state.securityComments,
    ...state.logicComments,
  ];
  return { pendingVerifyComments: allInitialComments };
}

// 💡 条件路由逻辑：决定是循环还是结束
function checkVerificationStatus(state: any) {
  if (state.validationErrors && state.validationErrors.length > 0) {
    return "correctorNode"; // 有错，去纠正器
  }
  return END; // 全对，或已经完成优雅降级，结束流程
}

const workflow = new StateGraph(GraphState)
  // 1. 注册图谱中所有的节点
  .addNode("styleAgent", styleAgent)
  .addNode("securityAgent", securityAgent)
  .addNode("logicAgent", logicAgent)
  .addNode("aggregateNode", aggregateNode)
  .addNode("verifierNode", verifierNode)
  .addNode("correctorNode", correctorNode)

  // 2. 并发起点：同时派发给三个专门领域的 Agent
  .addEdge(START, "styleAgent")
  .addEdge(START, "securityAgent")
  .addEdge(START, "logicAgent")

  // 3. 并发终点：利用 LangGraph 机制，汇聚到 aggregateNode（解决并发陷阱）
  .addEdge("styleAgent", "aggregateNode")
  .addEdge("securityAgent", "aggregateNode")
  .addEdge("logicAgent", "aggregateNode")

  // 4. 将初始总数据送入验证器
  .addEdge("aggregateNode", "verifierNode")

  // 5. 核心循环：根据验证结果进行条件路由
  .addConditionalEdges("verifierNode", checkVerificationStatus)

  // 6. 纠错完成后，再次回到验证器
  .addEdge("correctorNode", "verifierNode");

export const app = workflow.compile();
