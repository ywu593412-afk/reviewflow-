import { parseDiffToValidLines, validateCoordinatesNode } from "../src/index.js"; // 这里的路径根据你实际的导出位置微调

// 1. 模拟一段真实的 Git Diff（包含一个 10 行的文件）
const mockRawDiff = `
diff --git a/src/index.ts b/src/index.ts
index e69de29..bb93412 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,5 +1,10 @@
 export const hello = () => {
-  console.log("old");
+  console.log("new branch check");
+  const a = 1;
+  const b = 2;
+  return a + b;
 };
+const extraLine = "valid";
`;

// 2. 模拟大模型生成的 5 条评论，其中故意夹带 2 条行号幻觉（指向不存在的 45 行和已删除的旧行）
const mockLLMComments = [
  { file: "src/index.ts", line: 2, severity: "suggestion" as const, body: "Good adjustment here." },
  { file: "src/index.ts", line: 5, severity: "warning" as const, body: "Variable b could be a const." },
  { file: "src/index.ts", line: 45, severity: "critical" as const, body: "Hallucinated line! This should be intercepted." },
  { file: "src/index.ts", line: 100, severity: "critical" as const, body: "Another out-of-bounds line." }
];

function runBenchmark() {
  console.log("🚀 Starting difflens local benchmark test...");
  
  // 执行你的核心解析逻辑
  const validLineMap = parseDiffToValidLines(mockRawDiff);
  
  // 组装 LangGraph 的初始状态
  const initialState = {
    rawDiff: mockRawDiff,
    validLineMap,
    generatedComments: mockLLMComments,
    validatedComments: [],
    retryCount: 0,
    errors: []
  };

  // 执行你的核心拦截校验节点
  const result = validateCoordinatesNode(initialState);

  // 3. 打印出硬核的统计结果
  const total = mockLLMComments.length;
  const intercepted = result.errors.length;
  const leaked = result.validatedComments.filter(c => !validLineMap[c.file]?.includes(c.line)).length;

  console.log("\n📊 --- BENCHMARK INTEGRITY REPORT ---");
  console.table({
    "Total Simulated Comments": total,
    "Intercepted Hallucinations": intercepted,
    "Leaked Invalid Comments": leaked,
    "Validation Success Rate": `${((total - intercepted) / total * 100).toFixed(1)}%`
  });
  
  if (leaked === 0) {
    console.log("\n✅ Test Passed: difflens successfully maintained a 0.0% leakage rate.");
  }
}

runBenchmark();
