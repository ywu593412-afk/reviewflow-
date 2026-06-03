import * as core from "@actions/core";
import * as github from "@actions/github";
import { graph, parseDiffToValidLines } from "./index.js";

export async function run() {
  try {
    const token = process.env.INPUT_GITHUB_TOKEN;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    if (!token) throw new Error("缺少 GitHub Token");
    if (!deepseekKey) throw new Error("缺少 DEEPSEEK_API_KEY");

    const octokit = github.getOctokit(token);
    const context = github.context;

    if (context.eventName !== "pull_request" || !context.payload.pull_request) {
      core.info("当前非 Pull Request 事件，跳过。");
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const { owner, repo } = context.repo;

    const response = await octokit.rest.pulls.get({
      owner, repo, pull_number: prNumber, mediaType: { format: "diff" },
    });

    const diffString = response.data as unknown as string;
    const diffIndex = parseDiffToValidLines(diffString);

    const result = await graph.invoke({
      diff: diffString,
      diffIndex: diffIndex,
      comments: []
    });

    const validatedComments = result.comments || [];
    if (validatedComments.length === 0) {
      core.info("审查完毕：未发现漏洞。");
      return;
    }

    const reviewComments = validatedComments.map((c: any) => ({
      path: c.file,
      line: Number(c.line),
      body: c.body,
    }));

    await octokit.rest.pulls.createReview({
      owner, repo, pull_number: prNumber,
      event: "COMMENT",
      comments: reviewComments,
    });

    core.info("PR Review 提交成功。");
  } catch (error: any) {
    core.setFailed(`运行崩溃: ${error.message}`);
  }
}

run();