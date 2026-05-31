import { describe, it, expect } from 'vitest';

interface ReviewComment {
  line: number;
  text: string;
}

function verifier(comments: ReviewComment[], validRange: [number, number]): ReviewComment[] {
  return comments.filter(comment => comment.line >= validRange[0] && comment.line <= validRange[1]);
}

describe('Verifier Node Location Filter', () => {
  it('should drop hallucinated comments targeting out-of-bounds line numbers', () => {
    const validRange: [number, number] = [10, 14];
    const mockComments: ReviewComment[] = [
      { line: 12, text: "Valid flaw within the patch hunk." },
      { line: 78, text: "Hallucinated comment targeting untouched line." }
    ];

    const result = verifier(mockComments, validRange);
    expect(result).toHaveLength(1);
    expect(result[0].line).toBe(12);
  });
});
