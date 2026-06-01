import { graph } from "./graph/builder.js";
import { loadConfig } from "./config/loader.js";
import { ReviewComment } from "./types.js";

export interface RunDiffLensOptions {
  diff: string;
  cwd?: string;
}

export async function runDiffLens(options: RunDiffLensOptions): Promise<ReviewComment[]> {
  const { diff, cwd } = options;
  
  // 1. 动态加载项目中央配置
  const config = loadConfig(cwd);
  
  // 2. 初始化 LangGraph 状态机参数
  const initialState = {
    diff: diff,
    styleComments: [],
    securityComments: [],
    logicComments: [],
    finalComments: [],
  };

  console.log(`[DiffLens] Launching multi-agent workflow via ${config.llm.provider}/${config.llm.model}...`);

  try {
    // 3. 驱动拓扑图并发运行并等待安检拦截结果
    const finalState = await graph.invoke(initialState);
    
    console.log(`[DiffLens] Execution finished. Yielded ${finalState.finalComments?.length || 0} trusted comments.`);
    
    return finalState.finalComments || [];
  } catch (error) {
    console.error("[DiffLens] Execution halted due to a critical graph error:", error);
    throw error;
  }
}
