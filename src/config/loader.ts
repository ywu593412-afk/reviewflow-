import fs from "fs";
import path from "path";

export interface DiffLensConfig {
  llm: {
    provider: string;
    model: string;
    temperature: number;
  };
  agents: {
    style: { enabled: boolean };
    security: { enabled: boolean };
    logic: { enabled: boolean };
  };
  verifier: {
    enabled: boolean;
    onHallucination: "reject" | "correct";
  };
  output: {
    format: "github-pr" | "json" | "markdown";
  };
}

export function loadConfig(cwd = process.cwd()): DiffLensConfig {
  const configPath = path.join(cwd, "difflens.config.json");
  let raw: any = {};

  // 1. 读取本地 json 配置文件
  if (fs.existsSync(configPath)) {
    try {
      raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (e) {
      console.warn(`[Config] Failed to parse difflens.config.json, falling back to env.`);
    }
  }

  // 2. 环境变量三层覆盖策略 (最高优先级覆盖，CI/CD 环境极度友好)
  if (process.env.DIFFLENS_PROVIDER) {
    raw.llm = raw.llm || {};
    raw.llm.provider = process.env.DIFFLENS_PROVIDER;
  }
  if (process.env.DIFFLENS_MODEL) {
    raw.llm = raw.llm || {};
    raw.llm.model = process.env.DIFFLENS_MODEL;
  }

  // 3. 兜底默认值保障
  return {
    llm: {
      provider: raw.llm?.provider || "gemini",
      model: raw.llm?.model || "gemini-1.5-pro",
      temperature: raw.llm?.temperature ?? 0.2,
    },
    agents: {
      style: { enabled: raw.agents?.style?.enabled ?? true },
      security: { enabled: raw.agents?.security?.enabled ?? true },
      logic: { enabled: raw.agents?.logic?.enabled ?? true },
    },
    verifier: {
      enabled: raw.verifier?.enabled ?? true,
      onHallucination: raw.verifier?.onHallucination || "reject",
    },
    output: {
      format: raw.output?.format || "github-pr",
    },
  };
}
