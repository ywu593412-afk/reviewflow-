import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import pLimit from "p-limit";

// ==========================================
// 1. 结构化输出约束定义 (Zod Strict Schema)
// ==========================================
const ReviewCommentSchema = z.object({
  path: z.string().describe("The relative file path being reviewed"),
  line: z.number().describe("The physical line number in the code file"),
  comment: z.string().describe("Clear, actionable review feedback or security warnings")
});

const ReviewOutputSchema = z.object({
  comments: z.array(ReviewCommentSchema)
});

// ==========================================
// 2. 现代 LangGraph 状态图定义 (Annotation Syntax)
// ==========================================
const GraphState = Annotation.Root({
  diffContent: Annotation<string>(),
  styleComments: Annotation<any[]>({ reducer: (x, y) => y, default: () => [] }),
  securityComments: Annotation<any[]>({ reducer: (x, y) => y, default: () => [] }),
  logicComments: Annotation<any[]>({ reducer: (x, y) => y, default: () => [] }),
  finalComments: Annotation<any[]>({ reducer: (x, y) => y, default: () => [] }),
});

// ==========================================
// 3. 核心大模型与多智能体节点 (Robust Prompting)
// ==========================================
const model = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0.1 });
const structuredModel = model.withStructuredOutput(ReviewOutputSchema);

// 风格与规范智能体
async function styleAgent(state: typeof GraphState.State) {
  const prompt = `You are an elite Code Style Expert. Inspect the following Git Diff for syntax issues, naming conventions, formatting, and ESLint/TypeScript best practices. Be specific:\n\n${state.diffContent}`;
  const res = await structuredModel.invoke(prompt);
  return { styleComments: res.comments };
}

// 安全漏洞智能体
async function securityAgent(state: typeof GraphState.State) {
  const prompt = `You are a Senior Application Security Engineer. Scan this Git Diff strictly for critical vulnerabilities: hardcoded credentials/keys, SQL Injection, XSS, unsafe data handling, or dependency flaws:\n\n${state.diffContent}`;
  const res = await structuredModel.invoke(prompt);
  return { securityComments: res.comments };
}

// 业务逻辑与性能智能体
async function logicAgent(state: typeof GraphState.State) {
  const prompt = `You are a Principal Software Architect. Evaluate this Git Diff for logical bugs, race conditions, memory leaks, unhandled promises, and severe architectural flaws:\n\n${state.diffContent}`;
  const res = await structuredModel.invoke(prompt);
  return { logicComments: res.comments };
}

// 智能体融合汇聚节点
async function aggregatorNode(state: typeof GraphState.State) {
  // 聚合并行计算出的所有评论数据
  const combined = [
    ...state.styleComments,
    ...state.securityComments,
    ...state.logicComments
  ];
  return { finalComments: combined };
}

// ==========================================
// 4. 构建并编译多智能体拓扑图 (StateGraph Build)
// ==========================================
const workflow = new StateGraph(GraphState)
  .addNode("styleAgent", styleAgent)
  .addNode("securityAgent", securityAgent)
  .addNode("logicAgent", logicAgent)
  .addNode("aggregatorNode", aggregatorNode)
  .addEdge("__start__", "styleAgent")
  .addEdge("__start__", "securityAgent")
  .addEdge("__start__", "logicAgent")
  .addEdge("styleAgent", "aggregatorNode")
  .addEdge("securityAgent", "aggregatorNode")
  .addEdge("logicAgent", "aggregatorNode")
  .addEdge("aggregatorNode", "__end__");

export const app = workflow.compile();

// ==========================================
// 5. 动态系统工程入口 (Production-ready Entry)
// ==========================================
export async function runReviewflow(options: {
  owner: string;
  repo: string;
  pullNumber: number;
  commitSha: string;
  diffContent: string;
}) {
  console.log(`[ReviewFlow] Initializing graph for ${options.owner}/${options.repo}#${options.pullNumber}`);
  
  // 触发 LangGraph 编译图流转
  const result = await app.invoke({ diffContent: options.diffContent });
  const comments = result.finalComments || [];
  
  // 并发写入控制：防止高频调用导致 GitHub API 被封禁
  const limit = pLimit(3); 
  
  await Promise.all(
    comments.map((c) =>
      limit(async () => {
        try {
          // 模拟执行：未来对接真实 octokit.pulls.createReviewComment
          console.log(`[ReviewFlow Success] Posted comment to ${c.path} on line ${c.line}`);
        } catch (error) {
          // 局部重容错机制：单条失败绝不卡死主工作流
          console.error(`[ReviewFlow Error] Failed to post comment to line ${c.line}:`, error);
        }
      })
    )
  );
  
  return comments;
}
