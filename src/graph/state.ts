import { Annotation } from "@langchain/langgraph";
import { ReviewComment, DiffIndex } from "../types.js";

export const GraphState = Annotation.Root({
  diff: Annotation<string>,
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
  pendingVerifyComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => y, 
    default: () => [],
  }),
  finalComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),
  generalComments: Annotation<ReviewComment[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),
  validationErrors: Annotation<string[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),
  retryCount: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
});

export type GraphStateType = typeof GraphState.State;
