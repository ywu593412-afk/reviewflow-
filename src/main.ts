import * as core from "@actions/core";
import * as github from "@actions/github";
import { graph, parseDiffToValidLines } from "./index.js";

export async function run() {
  try {
    // 1. 获取输入参数与上下文环境
    const token = core.getInput("github-token", { required: true });
    const octokit = github.getOctokit(token);
    const context = github.context;

    // 校验触发事件：仅在 Pull Request 场景下运行
    if (context.eventName !== "pull_request" || !context.payload.pull_request) {
      core.info("当前非 Pull Request 事件，DiffLens 退出执行。");
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    core.info(`[DiffLens] 开始处理 PR #${prNumber} in ${owner}/${repo}`);

    // 2. 获取 PR 的 Git Diff 原文
    // 强制指定 mediaType 为 diff，避免返回 JSON 对象
    const response = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
      mediaType: {
        format: "diff",
      },
    });

    const diffString = response.data as unknown as string;
    if (!diffString) {
      core.warning("[DiffLens] 未获取到有效 Diff 数据。");
      return;
    }

    // 3. 构建物理坐标系并启动多智能体网络
    core.info("[DiffLens] 正在解析 Diff 构建坐标系...");
    const diffIndex = parseDiffToValidLines(diffString);

    core.info("[DiffLens] 启动 LangGraph 多智能体并行审查...");
    const result = await graph.invoke({
      diff: diffString,
      diffIndex: diffIndex,
      comments: [] // 初始化全局状态
    });

    const validatedComments = result.comments || [];

    if (validatedComments.length === 0) {
      core.info("[DiffLens] 审查完毕：未发现逻辑漏洞或不规范风格。");
      return;
    }

    // 4. 数据映射：将底层结构转换为 GitHub API 接受的评论格式
    const reviewComments = validatedComments.map((c: any) => ({
      path: c.file, // GitHub API 规定文件路径字段必须为 path
      line: c.line,
      body: c.body,
    }));

    // 5. 执行回写动作：提交 Review
    core.info(`[DiffLens] 准备提交 ${reviewComments.length} 条评论至 PR...`);
    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      event: "COMMENT", 
      comments: reviewComments,
    });

    core.info("[DiffLens] PR Review 提交成功。");

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`[DiffLens] 运行崩溃: ${error.message}`);
    } else {
      core.setFailed(`[DiffLens] 运行崩溃: 发生未知错误`);
    }
  }
}

// 执行入口
run();
