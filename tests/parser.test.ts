import { describe, it, expect } from 'vitest';

function parseDiffHunkHeader(header: string): [number, number] | null {
  const match = header.match(/^@@ -\d+,\d+ \+(\d+),(\d+) @@/);
  if (!match) return null;
  const start = parseInt(match[1], 10);
  const lines = parseInt(match[2], 10);
  return [start, start + lines - 1];
}

describe('Diff Parser Regex Enforcer', () => {
  it('should accurately extract valid line ranges from unified diff headers', () => {
    const rawHeader = "@@ -12,4 +12,4 @@ function processData(data) {";
    const range = parseDiffHunkHeader(rawHeader);
    expect(range).toEqual([12, 15]);
  });
});
