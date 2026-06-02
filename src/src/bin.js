#!/usr/bin/env node
import { execSync } from "child_process";
import { runDiffLens } from "./index.js";

// 自动探测可用的基准分支
function getBaseBranch() {
  const checkBranches = ["origin/main", "origin/master", "main", "master"];
  for (const branch of checkBranches) {
    try {
      // 使用 rev-parse 检查分支是否存在，不输出任何垃圾日志
      execSync(`git rev-parse --verify ${branch}`, { stdio: "ignore" });
      return branch;
    } catch {
      continue;
    }
  }
  return null;
}

async function main() {
  try {
    const baseBranch = getBaseBranch();
    
    if (!baseBranch) {
      console.error("❌ Error: 无法自动探测到有效的基准分支 (main/master)。请确保您处于 Git 仓库中。");
      process.exit(1);
    }

    console.log(`🔍 Detecting changes against: ${baseBranch}`);
    const diff = execSync(`git diff ${baseBranch}`, { encoding: "utf8" });
    
    if (!diff.trim()) {
      console.log(`✅ No active code changes detected against ${baseBranch}.`);
      return;
    }

    const trustedComments = await runDiffLens({ diff });
    // 后续渲染逻辑保持不变...
    
  } catch (error) {
    console.error("Critical error during execution:", error.message);
    process.exit(1);
  }
}

main();
