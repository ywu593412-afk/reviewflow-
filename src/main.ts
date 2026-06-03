import * as core from "@actions/core";
import * as github from "@actions/github";
import { graph, parseDiffToValidLines } from "./index.js";

export async function run() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("未找到 GITHUB_TOKEN");

    const octokit = github.getOctokit(token);
    const context = github.context;

    if (context.eventName !== "pull_request" || !context.payload.pull_request) {
      core.info("非 PR 事件，跳过。");
      return;
    }

    const { owner, repo } = context.repo;
    const prNumber = context.payload.pull_request.number;

    core.info(`[DiffLens] 开始分析 PR #${prNumber} ...`);

    const { data: diffData } = await octokit.rest.pulls.get({
      owner, repo, pull_number: prNumber, mediaType: { format: "diff" },
    });

    const diffString = diffData as unknown as string;
    const diffIndex = parseDiffToValidLines(diffString);

    // 监控 Agent 产出
    core.info(">>> 开始调用多智能体网络...");
    const result = await graph.invoke({ diff: diffString, diffIndex: diffIndex, comments: [] });
    
    console.log("=== 智能体产出的原始内容 ===");
    console.log(JSON.stringify(result.comments, null, 2));

    const validatedComments = (result.comments || []).filter((c: any) => c.file && c.line);
    
    if (validatedComments.length === 0) {
      core.info("审查完毕：智能体未产出评论。");
      return;
    }

    // 格式化评论以符合 GitHub API 要求
    const reviewComments = validatedComments.map((c: any) => ({
      path: c.file.replace(/^\//, ''), // 去掉开头的斜杠，防止路径匹配失败
      line: Number(c.line),
      body: `🤖 DiffLens 审查建议: ${c.body}`,
    }));

    core.info(">>> 准备发送的评论列表:");
    console.log(JSON.stringify(reviewComments, null, 2));

    await octokit.rest.pulls.createReview({
      owner, repo, pull_number: prNumber,
      event: "COMMENT",
      comments: reviewComments,
    });

    core.info("[DiffLens] 成功发布评论！");
  } catch (error: any) {
    console.error("=== 严重错误现场 ===", error);
    core.setFailed(`流程终止: ${error.message}`);
  }
}

run();
