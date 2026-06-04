import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState, GraphStateType } from "./state.js";
import { logicAgentNode } from "./nodes/logicAgent.js";
import { styleAgentNode } from "./nodes/styleAgent.js";
import { securityAgentNode } from "./nodes/securityAgent.js";
import { verifierNode } from "./nodes/verifier.js";
import { correctorNode } from "./nodes/corrector.js";
import { summarizerNode } from "./nodes/summarizer.js"; // 新增

function aggregateNode(state: GraphStateType): Partial<GraphStateType> {
  return { pendingVerifyComments: [...state.styleComments, ...state.securityComments, ...state.logicComments] };
}

const workflow = new StateGraph(GraphState)
  .addNode("logic", logicAgentNode)
  .addNode("style", styleAgentNode)
  .addNode("security", securityAgentNode)
  .addNode("aggregate", aggregateNode)
  .addNode("verifier", verifierNode)
  .addNode("corrector", correctorNode)
  .addNode("summarizer", summarizerNode) // 新增
  .addEdge(START, "logic")
  .addEdge(START, "style")
  .addEdge(START, "security")
  .addEdge("logic", "aggregate")
  .addEdge("style", "aggregate")
  .addEdge("security", "aggregate")
  .addEdge("aggregate", "verifier")
  .addConditionalEdges("verifier", (s) => (s.validationErrors?.length > 0 ? "corrector" : "summarizer")) // 验证后流向 summarizer
  .addEdge("corrector", "verifier")
  .addEdge("summarizer", END);

export const graph = workflow.compile();
