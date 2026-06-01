import { DiffIndex, FileIndex, HunkRange } from "../types.js";

export function parseDiff(rawDiff: string): DiffIndex {
  const index: DiffIndex = new Map();
  
  const fileHeaderRe = /^diff --git a\/.+ b\/(.+)/;
  const hunkHeaderRe = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/;
  
  let currentFile: FileIndex | null = null;
  let currentNewLine = 0;
  
  for (const line of rawDiff.split("\n")) {
    const fileMatch = line.match(fileHeaderRe);
    if (fileMatch) {
      currentFile = {
        path: fileMatch[1],
        hunks: [],
        validLines: new Set<number>()
      };
      index.set(fileMatch[1], currentFile);
      continue;
    }
    
    if (!currentFile) continue;
    
    const hunkMatch = line.match(hunkHeaderRe);
    if (hunkMatch) {
      currentNewLine = parseInt(hunkMatch[1], 10);
      const newLen = hunkMatch[2] !== undefined ? parseInt(hunkMatch[2], 10) : 1;
      
      const hunk: HunkRange = {
        newStart: currentNewLine,
        newEnd: currentNewLine + newLen - 1
      };
      currentFile.hunks.push(hunk);
      continue;
    }
    
    // 统计行号：跳过 "---" 和 "+++" 文件头行
    if (line.startsWith("---") || line.startsWith("+++")) {
      continue;
    }
    
    if (line.startsWith("+")) {
      currentFile.validLines.add(currentNewLine);
      currentNewLine++;
    } else if (!line.startsWith("-")) {
      // 这里的 context 行（空格开头）代表新旧文件都有，新文件行号照常递增
      currentNewLine++;
    }
    // "-" 开头的删除行在新文件里不存在，所以直接跳过，行号不前进
  }
  
  return index;
}
