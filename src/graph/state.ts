import { Annotation } from "@langchain/langgraph";
import { ReviewComment, DiffIndex } from "../types.js";

export const GraphState = Annotation.Root({
  // 输入的原始 Git Diff 文本
  diff: Annotation<string>,
  
  // 解析出的 Diff 索引，供验证器严格对照坐标
  diffIndex: Annotation<DiffIndex>({
    reducer: (x, y) => y,
    default: () => new Map(), 
  }),
  
  styleComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  securityComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  logicComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),

  // 核心：专门用于在 Aggregate -> Verifier -> Corrector 之间传递待校验的数据
  pendingVerifyComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => y, 
    default: () => [],
  }),
  
  // 最终经过校验层清洗、过滤后的可信评论输出 (精确坐标)
  finalComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),

  // 存放因行号失效而降级的全局/文件级评论
  generalComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),

  // 存放传给 Corrector 让其修正的错误信息详情
  validationErrors: Annotation<string[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),

  // 记录当前坐标修正的重试次数，绝对防止死循环
  retryCount: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
});

export type GraphStateType = typeof GraphState.State;
