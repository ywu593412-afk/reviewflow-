import { model } from "./llm/index.js"; // 请根据你实际的 Gemini 实例引入路径进行对齐

// 辅助函数：精确定位原始 Diff 中真正发生变动的物理行号
function getValidDiffLines(diffText: string): Set<string> {
  const validLines = new Set<string>();
  if (!diffText) return validLines;

  const lines = diffText.split('\n');
  let currentFile = '';
  let currentLineInFile = 0;

  for (const line of lines) {
    // 1. 解析目标文件名
    if (line.startsWith('+++ b/')) {
      currentFile = line.substring(6).trim();
      continue;
    }
    
    // 过滤掉 Diff 的其他前置元数据行
    if (line.startsWith('--- ') || line.startsWith('index ') || line.startsWith('similarity ')) {
      continue;
    }

    // 2. 解析 Hunk 头 (使用非捕获分组 (?:...) 完美兼容 @@ -1 +1 @@ 和 @@ -10,7 +15,8 @@)
    if (line.startsWith('@@ ')) {
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        // Hunk 头指定的行号是该变动块在新文件中的起始行号
        // 预设为起始行号减 1，因为随后进入内容行时会先执行自增
        currentLineInFile = parseInt(match[1], 10) - 1;
      }
      continue;
    }

    // 3. 严格跟踪和映射行号
    if (currentFile) {
      // 显式拦截并忽略 Git 末尾的无换行符等元数据标记，防止行号无故偏移
      if (line.startsWith('\\')) {
        continue;
      }

      if (line.startsWith('+')) {
        currentLineInFile++;
        // 记录唯一合法的变更坐标格式：文件名:行号
        validLines.add(`${currentFile}:${currentLineInFile}`);
      } else if (!line.startsWith('-')) {
        // 属于未变动的普通上下文行，目标文件行号需正常累加以保证位置准确
        currentLineInFile++;
      }
      // 如果是 '-' 开头的删除行，由于它不存在于新文件中，目标文件行号不累加，直接跳过
    }
  }
  return validLines;
}

// 验证器节点核心调度逻辑
export async function verifierNode(state: any) {
  const { diff, rawComments } = state; 
  
  if (!rawComments || !Array.isArray(rawComments)) {
    return { trustedComments: [] };
  }

  // 1. 提取原始 Diff 的真实变动坐标快照
  const validCoordinates = getValidDiffLines(diff);
  const trustedComments = [];

  // 2. 逐条严格交叉比对
  for (const comment of rawComments) {
    // 确保大模型返回的字段能够正确映射到 coordinateKey
    const coordinateKey = `${comment.file}:${comment.line}`;

    if (validCoordinates.has(coordinateKey)) {
      // 坐标真实存在，属于合法的审查意见
      trustedComments.push(comment);
    } else {
      // 成功捕获大模型幻觉，进行拦截过滤
      console.warn(`🚨 [Verifier] 拦截幻觉行号: 试图在 [${comment.file}] Line ${comment.line} 创建评论，但该行不在实际变动范围内。`);
    }
  }

  return { trustedComments };
}

// 严重级别排序节点核心逻辑
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
