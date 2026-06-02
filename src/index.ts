#!/usr/bin/env node
import { execSync } from "child_process";
// 💡 请将此处改为你实际定义 runDiffLens 函数的文件路径（例如 `./workflow.js` 或 `./agent.js`）
// 注意：在 ESM 环境下，即使是 TS 文件，导入时也必须保留 `.js` 后缀
import { runDiffLens } from "./graph/index.js"; 

// 自动探测可用的基准分支
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

// 根据严重级别映射不同的终端前缀图标
function getSeverityIcon(severity) {
  switch (severity) {
    case "critical": return "🔴 [Critical]";
    case "high":     return "🟠 [High]";
    case "medium":   return "🟡 [Medium]";
    case "low":      return "🔵 [Low]";
    default:         return "⚪ [Notice]";
  }
}

async function main() {
  const EXEC_OPTIONS = {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024 // 10MB 安全缓冲区
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

    console.log("🤖 Analyzing code changes with Multi-Agent pipeline...");
    // 调用更新后的图网络，拿到包含 severity 的最终报告数组
    const finalReport = await runDiffLens({ diff });
    
    if (!finalReport || finalReport.length === 0) {
      console.log("🎉 Code review passed! No issues found by DiffLens.");
      return;
    }

    console.log(`\n📝 [DiffLens Review Report] Found ${finalReport.length} insights:\n`);
    
    // 按严重程度权重进行降序排列，确保高危问题优先置顶
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sortedReport = [...finalReport].sort((a, b) => {
      const orderA = severityOrder[a.severity] !== undefined ? severityOrder[a.severity] : 4;
      const orderB = severityOrder[b.severity] !== undefined ? severityOrder[b.severity] : 4;
      return orderA - orderB;
    });

    // 结构化终端精美渲染
    sortedReport.forEach((item) => {
      const icon = getSeverityIcon(item.severity);
      console.log(`${icon} ${item.file}:${item.line}`);
      console.log(`   💡 ${item.comment}\n`);
    });
    
  } catch (error) {
    console.error("\n❌ [DiffLens CLI 运行异常]:");
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
      console.error(`-> ${errorMsg || error}`);
    }
    process.exit(1);
  }
}

main();
