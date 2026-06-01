import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import { styleAgentNode } from "./nodes/styleAgent.js";
import { securityAgentNode } from "./nodes/securityAgent.js";
import { logicAgentNode } from "./nodes/logicAgent.js";
import { verifierNode } from "./nodes/verifier.js";

const workflow = new StateGraph(GraphState)
  // 1. 注册所有节点
  .addNode("styleAgent", styleAgentNode)
  .addNode("securityAgent", securityAgentNode)
  .addNode("logicAgent", logicAgentNode)
  .addNode("verifier", verifierNode)

  // 2. 编排并行分发流 (Fan-Out)：图启动时，三个 Agent 并发运行
  .addEdge(START, "styleAgent")
  .addEdge(START, "securityAgent")
  .addEdge(START, "logicAgent")

  // 3. 编排数据汇聚流 (Fan-In)：利用 state 中的 reducer，自动等待三者完成后统一进入安检拦截层
  .addEdge("styleAgent", "verifier")
  .addEdge("securityAgent", "verifier")
  .addEdge("logicAgent", "verifier")

  // 4. 验证结束，流转至终点
  .addEdge("verifier", END);

// 编译并导出可执行的图流实例
export const graph = workflow.compile();
