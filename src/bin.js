#!/usr/bin/env node
import { execSync } from "child_process";
import { runDiffLens } from "./index.js";

// 1. 自动探测可用的基准分支
function getBaseBranch() {
  const checkBranches = ["origin/main", "origin/master", "main", "master"];
  for (const branch of checkBranches) {
    try {
      execSync(`git rev-parse --verify ${branch}`, { stdio: "ignore" });
      return branch;
    } catch {
      continue;
    }
  }
  return null;
}

async function main() {
  // 设置 10MB 的安全缓冲区，防止大型 Diff 导致缓冲区溢出崩溃 (ENOBUFS)
  const EXEC_OPTIONS = {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024 
  };

  try {
    const baseBranch = getBaseBranch();
    
    if (!baseBranch) {
      console.error("❌ Error: 无法自动探测到有效的基准分支 (main/master)。请确保您处于 Git 仓库中。");
      process.exit(1);
    }

    console.log(`🔍 Detecting changes against: ${baseBranch}`);
    const diff = execSync(`git diff ${baseBranch}`, EXEC_OPTIONS);
    
    if (!diff.trim()) {
      console.log(`✅ No active code changes detected against ${baseBranch}.`);
      return;
    }

    // 调用 LangGraph 多智能体核心
    const trustedComments = await runDiffLens({ diff });
    // 后续渲染逻辑...
    
  } catch (error) {
    console.error("\n❌ [DiffLens CLI 运行异常]:");

    // 针对各种边缘生产环境隐患进行定点清除和优雅报错
    const errorMsg = error.message || "";
    
    if (error.code === "ENOBUFS") {
      console.error("-> 错误原因: 当前 Git Diff 文本量过大，超出了进程默认缓冲区。");
      console.error("-> 解决建议: 请尝试分批提交代码，或减少单次 Pull Request 的文件变更量。");
    } else if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
      console.error("-> 错误原因: 底层 Gemini API 触发了免费额度频率限制（Rate Limit）或配额耗尽。");
      console.error("-> 解决建议: 请检查您的 API Key 状态，或者稍等几分钟后重新执行审查。");
    } else if (errorMsg.includes("fetch failed") || errorMsg.includes("UND_ERR_CONNECT")) {
      console.error("-> 错误原因: 无法连接到大模型终端，网络请求失败。");
      console.error("-> 解决建议: 请检查您的网络代理（Proxy）配置，确保能够正常访问谷歌 API 服务。");
    } else {
      // 兜底的未知逻辑错误
      console.error(`-> ${errorMsg || error}`);
    }
    
    process.exit(1);
  }
}

main();
