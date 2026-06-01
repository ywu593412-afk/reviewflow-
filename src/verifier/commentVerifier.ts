import { ReviewComment, DiffIndex, VerifyResult, FileIndex } from "../types.js";

function findNearestValidLine(
  target: number,
  validLines: Set<number>,
  hunks: any[]
): number | null {
  // 判定目标行号是否落在任何一个合法的 hunk 变更区间内
  const containingHunk = hunks.find(
    (h) => target >= h.newStart && target <= h.newEnd
  );
  if (!containingHunk) return null;

  let nearest: number | null = null;
  let minDist = Infinity;

  // 在同一个 hunk 内部寻找距离最近的合法变动行
  for (const validLine of validLines) {
    if (validLine < containingHunk.newStart || validLine > containingHunk.newEnd) {
      continue;
    }
    const dist = Math.abs(validLine - target);
    if (dist < minDist) {
      minDist = dist;
      nearest = validLine;
    }
  }
  return nearest;
}

export function verifyComments(
  comments: ReviewComment[],
  diffIndex: DiffIndex,
  strategy: "reject" | "correct" = "reject"
): VerifyResult {
  const result: VerifyResult = { passed: [], corrected: [], rejected: [] };

  for (const comment of comments) {
    const fileIndex = diffIndex.get(comment.path);

    // Level 3: 文件路径根本不在 diff 中（空间张冠李戴），直接丢弃
    if (!fileIndex) {
      result.rejected.push(comment);
      continue;
    }

    // Level 1: 精确命中合法变动行，直接放行
    if (fileIndex.validLines.has(comment.line)) {
      result.passed.push(comment);
      continue;
    }

    // Level 2: 未精确命中，根据配置策略处理
    if (strategy === "correct") {
      const nearest = findNearestValidLine(
        comment.line,
        fileIndex.validLines,
        fileIndex.hunks
      );
      if (nearest !== null) {
        result.corrected.push({
          ...comment,
          line: nearest,
          body: `${comment.body}\n\n> ⚠️ _Line coordinate auto-corrected from ${comment.line} to ${nearest} by DiffLens_`
        });
      } else {
        result.rejected.push(comment);
      }
    } else {
      // 默认执行严格拦截策略，杜绝行号错位带来的语义灾难
      result.rejected.push(comment);
    }
  }

  return result;
}
