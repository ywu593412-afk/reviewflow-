import * as core from "@actions/core";
import * as github from "@actions/github";
import { graph, parseDiffToValidLines } from "./index.js";

async function run() {
  core.info(">>> 诊断开始：检查环境变量...");
  const token = process.env.INPUT_GITHUB_TOKEN;
  const key = process.env.DEEPSEEK_API_KEY;

  if (!token) {
    core.setFailed("❌ 错误：GITHUB_TOKEN 未获取到。请检查 .yml 里的 env 配置。");
    return;
  }
  if (!key) {
    core.setFailed("❌ 错误：DEEPSEEK_API_KEY 未获取到。请检查 Secrets 设置。");
    return;
  }
  core.info(`>>> 检查通过。Token长度: ${token.length}, Key长度: ${key.length}`);

  try {
    const octokit = github.getOctokit(token);
    const context = github.context;
    
    core.info(`>>> 事件类型: ${context.eventName}`);
    if (context.eventName !== "pull_request") {
        core.warning(">>> 警告：这不是一个 PR 事件，程序将退出。");
        return;
    }

    const { owner, repo } = context.repo;
    const prNumber = context.payload.pull_request?.number;
    core.info(`>>> 正在处理 PR #${prNumber}`);

    const response = await octokit.rest.pulls.get({
      owner, repo, pull_number: prNumber!, mediaType: { format: "diff" },
    });

    const diffString = response.data as unknown as string;
    core.info(">>> Diff 获取成功，长度: " + diffString.length);
    
    const diffIndex = parseDiffToValidLines(diffString);
    core.info(">>> Diff 解析完成，节点数: " + diffIndex.length);

    core.info(">>> 正在调用 AI 进行审查...");
    const result = await graph.invoke({
      diff: diffString,
      diffIndex: diffIndex,
      comments: []
    });

    const comments = result.comments || [];
    core.info(`>>> AI 审查完成，发现建议: ${comments.length} 条`);

    if (comments.length > 0) {
      await octokit.rest.pulls.createReview({
        owner, repo, pull_number: prNumber!,
        event: "COMMENT",
        comments: comments.map((c: any) => ({
          path: c.file, line: Number(c.line), body: c.body,
        })),
      });
      core.info(">>> ✅ 评论已成功发布到 PR！");
    } else {
      core.info(">>> ℹ️ 未发现需要审查的代码问题。");
    }

  } catch (error: any) {
    core.setFailed(`>>> ❌ 运行崩溃: ${error.stack}`);
  }
}

run();
