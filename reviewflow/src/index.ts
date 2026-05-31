import { StateGraph, START, END } from "@langchain/langgraph";
import { Octokit } from "@octokit/rest";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import pLimit from "p-limit";

// 1. 使用 Zod 强约束 AI 吐出的评论格式，防止 JSON 解析崩溃
const CommentSchema = z.object({
  path: z.string().describe("文件路径"),
  line: z.number().describe("代码行号"),
  body: z.string().describe("具体的审查意见，使用 Markdown 格式")
});
const ReviewOutputSchema = z.array(CommentSchema);

// 2. 定义多智能体图状态 (Graph State)
interface ReviewState {
  owner: string;
  repo: string;
  pullNumber: number;
  commitSha: string; 
  diffContent: string;
  styleReview?: string;
  securityReview?: string;
  logicReview?: string;
  commentsToPost: z.infer<typeof ReviewOutputSchema>;
}

// 初始化大模型与 GitHub 客户端
const model = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.1 });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// ==================== 3. 智能体节点定义 ====================

async function styleAgent(state: ReviewState): Promise<Partial<ReviewState>> {
  const prompt = `You are a Code Style Expert. Review this diff for linting and naming conventions:\n${state.diffContent}`;
  const response = await model.invoke(prompt);
  return { styleReview: response.content as string };
}

async function securityAgent(state: ReviewState): Promise<Partial<ReviewState>> {
  const prompt = `You are a Cyber Security Engineer. Audit this diff for leaks and SQL injections:\n${state.diffContent}`;
  const response = await model.invoke(prompt);
  return { securityReview: response.content as string };
}

async function logicAgent(state: ReviewState): Promise<Partial<ReviewState>> {
  const prompt = `You are a Principal Developer. Check this diff for logical flaws and async race conditions:\n${state.diffContent}`;
  const response = await model.invoke(prompt);
  return { logicReview: response.content as string };
}

// 汇总节点：利用 withStructuredOutput 确保 100% 返回正确 JSON
async function aggregatorNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const structuredModel = model.withStructuredOutput(ReviewOutputSchema);
  
  const aggregatePrompt = `
    Merge these reviews into structured line-level feedback:
    Style feedback: ${state.styleReview}
    Security feedback: ${state.securityReview}
    Logic feedback: ${state.logicReview}
  `;
  
  const comments = await structuredModel.invoke(aggregatePrompt);

  // 使用 p-limit 控制并发请求数（每次最多3个），防止触发 GitHub 二级限流
  const limit = pLimit(3);
  const commentPromises = comments.map((comment) => 
    limit(async () => {
      try {
        await octokit.pulls.createReviewComment({
          owner: state.owner,
          repo: state.repo,
          pull_number: state.pullNumber,
          body: comment.body,
          commit_id: state.commitSha, 
          path: comment.path,
          line: comment.line,
        });
      } catch (error) {
        console.error(`Failed to post comment on ${comment.path}:${comment.line}`, error);
      }
    })
  );

  await Promise.all(commentPromises);
  return { commentsToPost: comments };
}

// ==================== 4. 编排 LangGraph 工作流 ====================
// 【已修复】：换回了 TypeScript 官方最稳固、无版本冲突的 channels 声明方式
const workflow = new StateGraph<ReviewState>({
  channels: {
    owner: null,
    repo: null,
    pullNumber: null,
    commitSha: null,
    diffContent: null,
    styleReview: null,
    securityReview: null,
    logicReview: null,
    commentsToPost: null
  }
})
  .addNode("style_agent", styleAgent)
  .addNode("security_agent", securityAgent)
  .addNode("logic_agent", logicAgent)
  .addNode("aggregator", aggregatorNode)
  .addEdge(START, "style_agent")
  .addEdge(START, "security_agent")
  .addEdge(START, "logic_agent")
  .addEdge("style_agent", "aggregator")
  .addEdge("security_agent", "aggregator")
  .addEdge("logic_agent", "aggregator")
  .addEdge("aggregator", END);

const app = workflow.compile();

// ==================== 5. 统一系统入口函数 ====================
export async function runApplication() {
  console.log("=== ReviewFlow Multi-Agent System Starting ===");
  const initialState: ReviewState = {
    owner: "ywu593412-afk",
    repo: "reviewflow-",
    pullNumber: 1,
    commitSha: "b3f7a1c9e8d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3", 
    diffContent: "const pass = '123456';\nasync function getUser() { return db.query('SELECT * FROM users WHERE id = ' + id); }",
    commentsToPost: []
  };

  await app.invoke(initialState);
  console.log("=== ReviewFlow Run Completed Successfully ===");
}
