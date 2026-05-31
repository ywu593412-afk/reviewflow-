import * as fs from "fs";
import dotenv from "dotenv";
import { GitHubConnector } from "./github.js";
import { buildEngineWorkflow } from "./agent.js";

dotenv.config();

interface GitHubWorkflowPayload {
  repository?: {
    name: string;
    owner: {
      login: string;
    };
  };
  pull_request?: {
    number: number;
  };
}

async function runApplication(): Promise<void> {
  console.log("=================================================");
  console.log("       ReviewFlow Agentic Review Initiated       ");
  console.log("=================================================");

  const githubToken = process.env.GITHUB_TOKEN;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!githubToken || githubToken.trim() === "") {
    console.error("Fatal Error: GITHUB_TOKEN is undefined inside running environment.");
    process.exit(1);
  }

  if (!openaiApiKey || openaiApiKey.trim() === "") {
    console.error("Fatal Error: OPENAI_API_KEY is undefined inside running environment.");
    process.exit(1);
  }

  let owner = process.env.GITHUB_OWNER || "";
  let repo = process.env.GITHUB_REPO || "";
  let pullNumber = parseInt(process.env.GITHUB_PR_NUMBER || "0", 10);

  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath && fs.existsSync(eventPath)) {
    try {
      console.log(`Parsing GitHub Actions Workflow event path: ${eventPath}`);
      const rawPayload = fs.readFileSync(eventPath, "utf-8");
      const payload = JSON.parse(rawPayload) as GitHubWorkflowPayload;

      if (payload.repository) {
        owner = payload.repository.owner.login;
        repo = payload.repository.name;
      }

      if (payload.pull_request) {
        pullNumber = payload.pull_request.number;
      }
    } catch (error) {
      console.warn(`Could not parse GITHUB_EVENT_PATH payload: ${(error as Error).message}`);
    }
  }

  if (!owner ||!repo || isNaN(pullNumber) || pullNumber <= 0) {
    console.error("Fatal Error: Could not resolve targeting Git Repository details (owner, repo, pullNumber).");
    console.error(`Resolved properties: owner=${owner}, repo=${repo}, pullNumber=${pullNumber}`);
    process.exit(1);
  }

  console.log(`Target Repository: ${owner}/${repo}`);
  console.log(`Target Pull Request: #${pullNumber}`);

  const connector = new GitHubConnector(githubToken);

  try {
    console.log("Retrieving PR diff formatted payload...");
    const rawDiff = await connector.getPullRequestDiff(owner, repo, pullNumber);

    console.log("Compiling file changes & physical line mapping table...");
    const parsedFiles = connector.parseDiff(rawDiff);

    let diffPayload = "";
    for (const file of parsedFiles) {
      diffPayload += `File: ${file.path}\n`;
      for (const lineObj of file.addedLines) {
        diffPayload += `Line ${lineObj.lineNum}: ${lineObj.content}\n`;
      }
    }

    if (!diffPayload || diffPayload.trim() === "") {
      console.log("No reviewable added lines identified inside the target changes. Exiting flow with code 0.");
      process.exit(0);
    }

    console.log("Instantiating LangGraph Agentic Engine...");
    const workflow = buildEngineWorkflow();

    const initialState = {
      owner,
      repo,
      pullNumber,
      diff: diffPayload,
      styleComments:,
      securityComments:,
      logicComments:,
      finalComments:,
    };

    console.log("Triggering concurrent audits across style, security, and logic domains...");
    const result = await workflow.invoke(initialState);

    console.log(`Submitting consolidated recommendations (${result.finalComments.length} items)...`);
    await connector.postReviewComments(owner, repo, pullNumber, result.finalComments);

    console.log("=================================================");
    console.log("       ReviewFlow Agentic Review Completed       ");
    console.log("=================================================");
  } catch (error) {
    console.error(`Pipeline execution crash: ${(error as Error).message}`);
    process.exit(1);
  }
}

runApplication().catch((err) => {
  console.error(`Unhandled process termination: ${(err as Error).message}`);
  process.exit(1);
});