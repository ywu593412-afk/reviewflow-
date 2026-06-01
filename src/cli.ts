import { execSync } from "child_process";
import { runDiffLens } from "./index.js";

async function main() {
  console.log("[DiffLens CLI] Initializing automated code review...");

  try {
    // 1. 自动抓取当前分支与 main 分支对比的原始 Unified Diff 文本
    // 在 CI/CD 环境中，这行命令能极为干净地抽离出本次 PR 的核心变更
    console.log("[DiffLens CLI] Fetching git diff against origin/main...");
    const diff = execSync("git diff origin/main", { encoding: "utf8" });

    if (!diff.trim()) {
      console.log("[DiffLens CLI] No active code changes detected against origin/main. Exiting.");
      return;
    }

    // 2. 驱使多智能体网络运行
    const trustedComments = await runDiffLens({ diff });

    // 3. 打印最终审查报告
    console.log("\n================ 🛡️ DiffLens Review Report ================");
    if (trustedComments.length === 0) {
      console.log("✅ Perfect! No code style, security, or logical flaws found.");
    } else {
      console.log(`🚀 Found ${trustedComments.length} trusted optimizations:\n`);
      trustedComments.forEach((comment, index) => {
        console.log(`[${index + 1}] File: ${comment.path} | Line: ${comment.line}`);
        console.log(`    Feedback: ${comment.body}\n`);
      });
    }
    console.log("===========================================================");

  } catch (error) {
    console.error("[DiffLens CLI] Fatal execution error:", error);
    process.exit(1);
  }
}

main();
