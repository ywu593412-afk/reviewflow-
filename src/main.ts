import * as core from "@actions/core";
import * as github from "@actions/github";
import { graph, parseDiffToValidLines } from "./index.js";

export async function run() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("缺少 GITHUB_TOKEN");

    const octokit = github.getOctokit(token);
    const context = github.context;
    const { owner, repo } = context.repo;
    const prNumber = context.payload.pull_request?.number;

    if (!prNumber) return;

    const { data: diffData } = await octokit.rest.pulls.get({
      owner, repo, pull_number: prNumber, mediaType: { format: "diff" },
    });

    const diffIndex = parseDiffToValidLines(diffData as unknown as string);
    const result = await graph.invoke({ diff: diffData as unknown as string, diffIndex, comments: [] });
    
    const comments = (result.comments || []).map((c: any) => ({
      path: c.file.replace(/^\//, ''),
      line: Number(c.line),
      body: `🤖 审查发现: ${c.body}`,
    }));

    // --- 强制调试输出 ---
    console.log("=== 准备发送的评论内容 ===");
    console.log(JSON.stringify(comments, null, 2));

    if (comments.length > 0) {
      try {
        await octokit.rest.pulls.createReview({
          owner, repo, pull_number: prNumber,
          event: "COMMENT",
          comments: comments,
        });
        core.info("成功发布评论！");
      } catch (err: any) {
        console.error("=== 发送评论到 GitHub 失败 ===");
        console.error(err.message);
        throw err; // 抛出错误以确保 Actions 显示红叉，方便我们查看
      }
    } else {
      core.info("没有发现可疑代码。");
    }
  } catch (error: any) {
    core.setFailed(`执行失败: ${error.message}`);
  }
}

run();
