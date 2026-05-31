import { Octokit } from "@octokit/rest";

export interface ParsedDiffLine {
  lineNum: number;
  content: string;
}

export interface ParsedFileDiff {
  path: string;
  addedLines: ParsedDiffLine;
}

export class GitHubConnector {
  private octokit: Octokit;

  constructor(token: string) {
    if (!token || token.trim() === "") {
      throw new Error("GitHubConnector initialization failed: GITHUB_TOKEN is required.");
    }
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Fetches the unified raw diff of a pull request.
   */
  async getPullRequestDiff(owner: string, repo: string, pullNumber: number): Promise<string> {
    try {
      const response = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        mediaType: {
          format: "diff",
        },
      });
      // The API returns the raw text diff directly when mediaType format is 'diff'.
      return response.data as unknown as string;
    } catch (error) {
      throw new Error(`Failed to retrieve git diff from GitHub: ${(error as Error).message}`);
    }
  }

  /**
   * Creates a review session containing multiple line-level comments.
   */
  async postReviewComments(
    owner: string,
    repo: string,
    pullNumber: number,
    comments: { path: string; line: number; body: string }
  ): Promise<void> {
    if (comments.length === 0) {
      console.log("No high-severity issues found. Review completed with 0 inline comments.");
      return;
    }

    try {
      const formattedComments = comments.map((c) => ({
        path: c.path,
        line: c.line,
        body: c.body,
        side: "RIGHT" as const,
      }));

      await this.octokit.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        event: "COMMENT",
        comments: formattedComments,
        body: "🤖 **ReviewFlow: Multi-Agent Automated Analysis Completed**\n\nI have evaluated the changes introduced in this pull request using parallel deep-review agents. Below are the verified findings.",
      });
      console.log(`Successfully published ${comments.length} inline review comments.`);
    } catch (error) {
      throw new Error(`Failed to submit batch code review to GitHub: ${(error as Error).message}`);
    }
  }

  /**
   * Parses standard git unified diff format and calculates precise absolute line numbers.
   */
  parseDiff(diffText: string): ParsedFileDiff {
    const files: ParsedFileDiff =;
    const lines = diffText.split("\n");
    let currentFile: ParsedFileDiff | null = null;
    let currentLineInNewFile = 0;

    for (const line of lines) {
      if (line.startsWith("diff --git")) {
        const parts = line.split(" ");
        const rawPath = parts;
        if (rawPath) {
          // Remove prefix 'b/' from file path
          const path = rawPath.substring(2);
          currentFile = { path, addedLines: };
          files.push(currentFile);
        }
        continue;
      }

      if (!currentFile) {
        continue;
      }

      if (line.startsWith("@@")) {
        const match = line.match(/@@ -\d+,?\d* \+(\d+),?\d* @@/);
        if (match) {
          const startLine = match;
          if (startLine) {
            currentLineInNewFile = parseInt(startLine, 10);
          }
        }
        continue;
      }

      if (line.startsWith("+") &&!line.startsWith("+++")) {
        currentFile.addedLines.push({
          lineNum: currentLineInNewFile,
          content: line.substring(1),
        });
        currentLineInNewFile++;
      } else if (line.startsWith(" ")) {
        currentLineInNewFile++;
      }
    }

    return files;
  }
}
