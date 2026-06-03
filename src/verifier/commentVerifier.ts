import { ReviewComment, DiffIndex, VerifyResult } from "../types.js";

function findNearestValidLine(
  target: number,
  validLines: Set<number>,
  hunks: any[]
): number | null {
  const containingHunk = hunks.find(
    (h) => target >= h.newStart && target <= h.newEnd
  );
  if (!containingHunk) return null;

  let nearest: number | null = null;
  let minDist = Infinity;

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

export function validateCoordinatesNode(
  stateOrComments: any,
  diffIndex?: DiffIndex,
  strategy: "reject" | "correct" = "reject"
) {
  // 入参防御：自适应解析状态对象或直接传入的数组
  const comments: any[] = Array.isArray(stateOrComments)
    ? stateOrComments
    : (stateOrComments && typeof stateOrComments === "object" && Array.isArray(stateOrComments.comments))
      ? stateOrComments.comments
      : [];

  const actualDiffIndex = diffIndex || (stateOrComments && typeof stateOrComments === "object" ? stateOrComments.diffIndex : undefined);

  const passed: any[] = [];
  const corrected: any[] = [];
  const errors: any[] = []; 

  for (const rawComment of comments) {
    // 字段属性双向绑定：防止外部脚本通过 file 或 path 访问时发生 undefined
    const comment = {
      ...rawComment,
      file: rawComment.file || rawComment.path,
      path: rawComment.path || rawComment.file
    };

    if (!comment.file) {
      errors.push(comment);
      continue;
    }

    const fileIndex = actualDiffIndex ? actualDiffIndex.get(comment.file) : undefined;

    if (!fileIndex) {
      errors.push(comment);
      continue;
    }

    if (fileIndex.validLines.has(comment.line)) {
      passed.push(comment);
      continue;
    }

    if (strategy === "correct") {
      const nearest = findNearestValidLine(
        comment.line,
        fileIndex.validLines,
        fileIndex.hunks
      );
      if (nearest !== null) {
        corrected.push({
          ...comment,
          line: nearest,
          body: `${comment.body}\n\n> ⚠️ _Line coordinate auto-corrected from ${comment.line} to ${nearest} by DiffLens_`
        });
      } else {
        errors.push(comment);
      }
    } else {
      errors.push(comment);
    }
  }

  const validatedComments = [...passed, ...corrected];

  if (errors.length > 0) {
    console.warn(`[DiffLens Verifier] Blocked ${errors.length} coordinate-shifted comments from rendering.`);
  }

  // 原生返回完备结构，直接对接业务和评测脚本
  return {
    errors,
    validatedComments,
    passed,
    corrected,
    rejected: errors
  };
}
