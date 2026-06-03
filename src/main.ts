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

    const result = await graph.invoke({
      diff: diffString,
      diffIndex: diffIndex,
      comments: []
    });

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
    console.error("=== 发生未捕获的严重错误 ===");
    console.error(error);
    if (error && error.errors) {
      console.error("=== 并发节点详细死因 ===");
      console.error(JSON.stringify(error.errors, null, 2));
    }
    core.setFailed(`运行崩溃: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

run();
