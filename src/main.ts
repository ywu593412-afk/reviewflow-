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

    console.log("========== AI 原始返回数据 ==========");
    console.log(JSON.stringify(result, null, 2));

    // 把所有可能的抽屉都翻一遍（注意包含了你截图里的中文 key）
    const allComments = [
      ...(result.styleComments || []),
      ...(result.securityComments || []),
      ...(result.logicComments || []),
      ...(result.finalComments || []),
      ...(result["最终评论"] || []), 
      ...(result.comments || [])
    ];

    if (allComments.length > 0) {
      // 如果有具体的代码行评论，精确发布
      await octokit.rest.pulls.createReview({
        owner, repo, pull_number: prNumber!,
        event: "COMMENT",
        comments: allComments.map((c: any) => ({
          path: c.file, line: Number(c.line), body: c.body,
        })),
      });
      console.log("精确代码行评论已发布");
    } else {
      // +++ 核心修复：如果 AI 交白卷，强制发送全局 PR 通知 +++
      console.log("AI 未返回具体代码行，发送兜底全局评论...");
      await octokit.rest.issues.createComment({
        owner, 
        repo, 
        issue_number: prNumber!,
        body: "🤖 **ReviewFlow 机器人播报**：\n\n🎉 **基建成功**：流水线与 Actions 环境已 100% 跑通！\n⚠️ **审查提示**：多智能体已读取代码，但当前返回了空数组 `[]`，未能生成针对具体代码行的审查。请检查 `graph/builder.js` 中的 Prompt 提示词格式，或确认 Diff 行号解析逻辑。"
      });
      console.log("兜底评论已发布，请去 PR 页面查看！");
    }

  } catch (error: any) {
    console.error("FATAL_ERROR:", error);
    process.exit(1);
  }
}

run();
