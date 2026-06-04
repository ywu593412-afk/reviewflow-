import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState, GraphStateType } from "./state.js";
import { logicAgentNode } from "./nodes/logicAgent.js";
import { styleAgentNode } from "./nodes/styleAgent.js";
import { securityAgentNode } from "./nodes/securityAgent.js";
import { verifierNode } from "./nodes/verifier.js";
import { correctorNode } from "./nodes/corrector.js";

function aggregateNode(state: GraphStateType): Partial<GraphStateType> {
  return { pendingVerifyComments: [...state.styleComments, ...state.securityComments, ...state.logicComments] };
}

function checkVerificationStatus(state: GraphStateType) {
  return (state.validationErrors && state.validationErrors.length > 0) ? "corrector" : END;
}

const workflow = new StateGraph(GraphState)
  .addNode("logic_agent", logicAgentNode)
  .addNode("style_agent", styleAgentNode)
  .addNode("security_agent", securityAgentNode)
  .addNode("aggregate", aggregateNode)
  .addNode("verifier", verifierNode)
  .addNode("corrector", correctorNode)
  .addEdge(START, "logic_agent")
  .addEdge(START, "style_agent")
  .addEdge(START, "security_agent")
  .addEdge("logic_agent", "aggregate")
  .addEdge("style_agent", "aggregate")
  .addEdge("security_agent", "aggregate")
  .addEdge("aggregate", "verifier")
  .addConditionalEdges("verifier", checkVerificationStatus)
  .addEdge("corrector", "verifier");

export const graph = workflow.compile();
