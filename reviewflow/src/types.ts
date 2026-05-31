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
  styleComments: Annotation<ReviewComment>({
    reducer: (left, right) => left.concat(right),
    default: () =>,
  }),
  securityComments: Annotation<ReviewComment>({
    reducer: (left, right) => left.concat(right),
    default: () =>,
  }),
  logicComments: Annotation<ReviewComment>({
    reducer: (left, right) => left.concat(right),
    default: () =>,
  }),
  finalComments: Annotation<ReviewComment>({
    reducer: (_left, right) => right,
    default: () =>,
  }),
});

export type GraphState = typeof GraphStateAnnotation.State;
