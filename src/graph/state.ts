import { Annotation } from "@langchain/langgraph";
// 💡 注意：这里假设你在 types.ts 中定义了 DiffIndex
import { ReviewComment, DiffIndex } from "../types.js";

export const GraphState = Annotation.Root({
  // 输入的原始 Git Diff 文本
  diff: Annotation<string>,
  
  // 💡 [补全遗漏] 解析出的 Diff 索引，供验证器对照坐标
  diffIndex: Annotation<DiffIndex>({
    reducer: (x, y) => y,
    default: () => new Map(), 
  }),
  
  // 风格智能体产生的候选评论，使用 concat 数组拼接进行并行汇聚
  styleComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  // 安全智能体产生的候选评论
  securityComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  // 业务逻辑智能体产生的候选评论
  logicComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  // 最终经过校验层清洗、过滤后的可信评论输出 (精确坐标)
  finalComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),

  // 💡 [新增] 存放因行号失效而降级的全局/文件级评论
  generalComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),

  // 💡 [新增] 存放传给 LLM 让其修正的错误信息
  validationErrors: Annotation<string[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),

  // 💡 [新增] 记录当前坐标修正的重试次数，防止死循环
  retryCount: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
});

export type GraphStateType = typeof GraphState.State;
