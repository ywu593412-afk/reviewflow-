import { Annotation } from "@langchain/langgraph";

export interface ReviewComment {
  path: string;
  line: number;
  body: string;
}

export const GraphStateAnnotation = Annotation.Root({
  owner: Annotation<string>(),
  repo: Annotation<string>(),
  pullNumber: Annotation<number>(),
  diff: Annotation<string>(),
  styleComments: Annotation<ReviewComment[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  securityComments: Annotation<ReviewComment[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  logicComments: Annotation<ReviewComment[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  finalComments: Annotation<ReviewComment[]>({
    reducer: (left, right) => right,
    default: () => [],
  }),
});

export type GraphState = typeof GraphStateAnnotation.State;

// ============================= 后续 #3 多模型支持所需的类型定义 =============================

export type LLMProvider = 'openai' | 'deepseek' | 'gemini';

export interface LLMConfig {
  provider: LLMProvider;
  modelName: string;
  apiKey: string;
  temperature?: number;
}
