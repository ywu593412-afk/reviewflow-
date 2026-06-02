import { StateGraph, START, END } from "@langchain/langgraph";
import { model } from "./llm/index.js";

// ==========================================
// 1. 状态通道定义 (State Schema)
// ==========================================
const stateSchema = {
  diff: { value: (x: any, y: any) => y, default: () => "" },
  rawComments: { value: (x: any, y: any) => y, default: () => [] },
  trustedComments: { value: (x: any, y: any) => y, default: () => [] },
  finalReport: { value: (x: any, y: any) => y, default: () => [] },
};

// ==========================================
// 2. 多智能体核心节点实现
// ==========================================

// 节点 A: 大模型初步审查智能体
export async function reviewAgentNode(state: any) {
  const { diff } = state;
  if (!diff) return { rawComments: [] };

  const prompt = `You are an expert code reviewer. Review the following Git Diff and identify bugs, anti-patterns, security issues, or code style deviations.
Output your review as a strictly valid JSON array of objects. Each object must have these exact fields:
- "file": (string) relative path of the file
- "line": (number) the exact line number where the issue occurs in the new version of the file
- "comment": (string) clear, constructive review comment

Git Diff:
${diff}`;

  try {
    const result = await model.generateContent({
      contents: prompt,
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    const responseText = result.response.text().trim();
    const rawComments = JSON.parse(responseText);
    return { rawComments: Array.isArray(rawComments) ? rawComments : [] };
  } catch (error: any) {
    console.error("🚨 [Review Agent] 生成审查意见失败:", error.message);
    return { rawComments: [] };
  }
}

// 辅助函数：精确定位原始 Diff 中真正发生变动的物理行号
function getValidDiffLines(diffText: string): Set<string> {
  const validLines = new Set<string>();
  if (!diffText) return validLines;

  const lines = diffText.split('\n');
  let currentFile = '';
  let currentLineInFile = 0;

  for (const line of lines) {
    // 解析目标文件名
    if (line.startsWith('+++ b/')) {
      currentFile = line.substring(6).trim();
      continue;
    }
    
    // 过滤掉 Diff 的其他前置元数据行
    if (line.startsWith('--- ') || line.startsWith('index ') || line.startsWith('similarity ')) {
      continue;
    }

    // 解析 Hunk 头 (使用非捕获分组 完美兼容单行变动与标准区块)
    if (line.startsWith('@@ ')) {
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        currentLineInFile = parseInt(match[1], 10) - 1;
      }
      continue;
    }

    // 严格跟踪和映射行号
    if (currentFile) {
      if (line.startsWith('\\')) {
        continue;
      }

      if (line.startsWith('+')) {
        currentLineInFile++;
        validLines.add(`${currentFile}:${currentLineInFile}`);
      } else if (!line.startsWith('-')) {
        currentLineInFile++;
      }
    }
  }
  return validLines;
}

// 节点 B: 验证器节点 (确定性算法过滤层)
export async function verifierNode(state: any) {
  const { diff, rawComments } = state; 
  
  if (!rawComments || !Array.isArray(rawComments)) {
    return { trustedComments: [] };
  }

  const validCoordinates = getValidDiffLines(diff);
  const trustedComments = [];

  for (const comment of rawComments) {
    const coordinateKey = `${comment.file}:${comment.line}`;

    if (validCoordinates.has(coordinateKey)) {
      trustedComments.push(comment);
    } else {
      console.warn(`🚨 [Verifier] 拦截幻觉行号: 试图在 [${comment.file}] Line ${comment.line} 创建评论，但该行不在实际变动范围内。`);
    }
  }

  return { trustedComments };
}

// 节点 C: 严重级别排序节点 (强约束 JSON 分级层)
export async function severityRankerNode(state: any) {
  const { trustedComments } = state;

  if (!trustedComments || !Array.isArray(trustedComments) || trustedComments.length === 0) {
    return { finalReport: [] };
  }

  const prompt = `You are a senior software quality assurance engineer. 
Classify these verified code review comments into exactly four severity levels: 'critical', 'high', 'medium', or 'low'.
Retain the original fields ('file', 'line', 'comment') and add the "severity" field for each object.

Input:
${JSON.stringify(trustedComments, null, 2)}`;

  try {
    const result = await model.generateContent({
      contents: prompt,
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.response.text().trim();
    const finalReport = JSON.parse(responseText);
    
    return { finalReport: Array.isArray(finalReport) ? finalReport : trustedComments };

  } catch (error: any) {
    console.warn("⚠️ [Severity Ranker] 结构化解析异常，启动平稳退化机制。Error:", error.message);
    
    const fallbackReport = trustedComments.map((item: any) => ({
      ...item,
      severity: "medium"
    }));
    return { finalReport: fallbackReport };
  }
}

// ==========================================
// 3. 编排拓扑网络连线 (Graph Construction)
// ==========================================
const workflow = new StateGraph({ channels: stateSchema })
  .addNode("review", reviewAgentNode)
  .addNode("verifier", verifierNode)
  .addNode("ranker", severityRankerNode)
  
  .addEdge(START, "review")
  .addEdge("review", "verifier")
  .addEdge("verifier", "ranker")
  .addEdge("ranker", END);

const app = workflow.compile();

// ==========================================
// 4. 统一对外的核心调用接口
// ==========================================
export async function runDiffLens(inputs: { diff: string }) {
  const initialState = {
    diff: inputs.diff,
    rawComments: [],
    trustedComments: [],
    finalReport: []
  };
  
  const result = await app.invoke(initialState);
  return result.finalReport;
}
