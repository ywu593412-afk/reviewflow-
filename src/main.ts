import * as core from "@actions/core";
import * as github from "@actions/github";
import { graph, parseDiffToValidLines } from "./index.js";

async function run() {
  console.log("DEBUG: 脚本已进入执行区");
  try {
    const token = process.env.INPUT_GITHUB_TOKEN;
    const key = process.env.DEEPSEEK_API_KEY;

    if (!token || !key) {
        throw new Error(`环境变量缺失: token=${!!token}, key=${!!key}`);
    }

    const octokit = github.getOctokit(token);
    const context = github.context;
    
    if (context.eventName !== "pull_request") {
        console.log("非PR事件，跳过");
        return;
    }

    const { owner, repo } = context.repo;
    const prNumber = context.payload.pull_request?.number;

    const response = await octokit.rest.pulls.get({
      owner, repo, pull_number: prNumber!, mediaType: { format: "diff" },
    });

    const diffString = response.data as unknown as string;
    const diffIndex = parseDiffToValidLines(diffString);

    const result = await graph.invoke({
      diff: diffString,
      diffIndex: diffIndex,
      comments: []
    });

    if (result.comments && result.comments.length > 0) {
      await octokit.rest.pulls.createReview({
        owner, repo, pull_number: prNumber!,
        event: "COMMENT",
        comments: result.comments.map((c: any) => ({
          path: c.file, line: Number(c.line), body: c.body,
        })),
      });
      console.log("评论已发布");
    } else {
      console.log("未发现bug");
    }

  } catch (error: any) {
    console.error("FATAL_ERROR:", error);
    process.exit(1);
  }
}

// 删掉了错误的 require 判断，直接强制执行
run();
