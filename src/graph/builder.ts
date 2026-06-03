import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";

// 导入你的三支特种兵部队
import { logicAgentNode } from "./nodes/logicAgent.js";
import { styleAgentNode } from "./nodes/styleAgent.js";
import { securityAgentNode } from "./nodes/securityAgent.js";

// 导入终极防线：坐标校验器
import { verifierNode } from "./nodes/verifier.js";

// 初始化状态图网络
const workflow = new StateGraph(GraphState)
  // 1. 注册所有节点
  .addNode("logic_agent", logicAgentNode)
  .addNode("style_agent", styleAgentNode)
  .addNode("security_agent", securityAgentNode)
  .addNode("verifier", verifierNode)

  // 2. 并行分发 (Fan-out)：网络启动时，三个 Agent 同时去审这份 Diff
  .addEdge(START, "logic_agent")
  .addEdge(START, "style_agent")
  .addEdge(START, "security_agent")

  // 3. 统一汇聚 (Fan-in)：所有 Agent 审完后，脏数据统一交给 verifier 节点做物理过滤
  .addEdge("logic_agent", "verifier")
  .addEdge("style_agent", "verifier")
  .addEdge("security_agent", "verifier")

  // 4. 结束管线：校验完毕，输出绝对合法的 comments
  .addEdge("verifier", END);

// 编译并导出可执行的图网络
export const graph = workflow.compile();
