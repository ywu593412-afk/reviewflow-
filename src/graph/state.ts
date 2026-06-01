import { Annotation } from "@langchain/langgraph";
import { ReviewComment } from "../types.js";

export const GraphState = Annotation.Root({
  // 输入的原始 Git Diff 文本
  diff: Annotation<string>,
  
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
  
  // 最终经过校验层清洗、过滤后的可信评论输出
  finalComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),
});

export type GraphStateType = typeof GraphState.State;
