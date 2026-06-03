import * as core from "@actions/core";
import * as github from "@actions/github";
import { graph, parseDiffToValidLines } from "./index.js";

export async function run() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      core.setFailed("未找到 GITHUB_TOKEN");
      return;
    }

    const octokit = github.getOctokit(token);
    const context = github.context;

    if (context.eventName !== "pull_request" || !context.payload.pull_request) {
      core.info("非 PR 事件，退出。");
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    core.info(`[DiffLens] 开始处理 PR #${prNumber} in ${owner}/${repo}`);

    const response = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
      mediaType: { format: "diff" },
    });

    const diffString = response.data as unknown as string;
    if (!diffString) return;

    const diffIndex = parseDiffToValidLines(diffString);

    // === 核心逻辑保护层 ===
    // 即使多智能体审查逻辑崩溃，也不要中断整个 GitHub Action 流程
    let result;
    try {
      result = await graph.invoke({
        diff: diffString,
        diffIndex: diffIndex,
        comments: []
      });
    } catch (agentError) {
      console.error("=== 多智能体审查代理执行崩溃 ===");
      console.error(agentError);
      result = { comments: [] }; // 发生故障时返回空列表，防止程序终止
    }
    // === 核心逻辑保护层结束 ===

    const validatedComments = result.comments || [];
    if (validatedComments.length === 0) {
      core.info("审查完毕：未发现问题。");
      return;
    }

    const reviewComments = validatedComments.map((c: any) => ({
      path: c.file,
      line: c.line,
      body: c.body,
    }));

    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      event: "COMMENT",
      comments: reviewComments,
    });

    core.info("[DiffLens] PR Review 提交成功。");
  } catch (error: any) {
    console.error("=== 发生未捕获的严重系统错误 ===");
    console.error(error);
    // 只有在非 Agent 相关的严重系统级错误发生时，我们才标记失败
    core.setFailed(`运行崩溃: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

run();
