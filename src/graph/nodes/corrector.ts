import { GraphStateType } from "../state.js";
import { ReviewComment } from "../../types.js";
import { getModelInstance } from "../../llm/factory.js";
import { z } from "zod";

const CorrectionSchema = z.object({
  comments: z.array(z.object({ path: z.string(), line: z.number(), body: z.string() }))
});

export async function correctorNode(state: GraphStateType) {
  const commentsToCorrect = state.pendingVerifyComments || [];
  if (commentsToCorrect.length === 0 || !state.validationErrors.length) return {};

  const model = getModelInstance("gemini", "gemini-1.5-pro", 0.2);
  const structuredModel = model.withStructuredOutput(CorrectionSchema);

  const prompt = `修正审查评论的行号越界问题。有效范围索引: ${JSON.stringify(Array.from(state.diffIndex.entries()))}。详情: ${state.validationErrors.join("\n")}。评论: ${JSON.stringify(commentsToCorrect)}`;

  try {
    const response = await structuredModel.invoke([{ role: "user", content: prompt }]);
    return { pendingVerifyComments: response.comments.map(c => ({ ...c, path: c.path, line: c.line, body: c.body })) };
  } catch (e) {
    return { pendingVerifyComments: commentsToCorrect };
  }
}
