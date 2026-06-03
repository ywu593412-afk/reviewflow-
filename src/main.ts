import * as core from "@actions/core";
import * as github from "@actions/github";
import { graph, parseDiffToValidLines } from "./index.js";

export async function run() {
  try {
    // 直接从底层环境变量读取，彻底绕过 core.getInput 的解析坑
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      core.setFailed("环境变量中未找到 GITHUB_TOKEN，请检查工作流配置。");
      return;
    }

    const octokit = github.getOctokit(token);
    const context = github.context;

    if (context.eventName !== "pull_request" || !context.payload.pull_request) {
      core.info("当前非 Pull Request 事件，退出执行。");
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
  } catch (error) {
    core.setFailed(`运行崩溃: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

run();
