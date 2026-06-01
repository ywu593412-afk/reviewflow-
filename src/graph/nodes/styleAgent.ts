import { GraphStateType } from "../state.js";
import { getModelInstance } from "../../llm/factory.js";
import { z } from "zod";

const StyleOutputSchema = z.object({
  comments: z.array(
    z.object({
      path: z.string().describe("The file path being reviewed"),
      line: z.number().describe("The precise, absolute line number prefixed with '+' in the diff"),
      body: z.string().describe("Concise and critical code style review feedback")
    })
  )
});

export async function styleAgentNode(state: GraphStateType) {
  const model = getModelInstance("gemini", "gemini-1.5-pro", 0.1);
  const structuredModel = model.withStructuredOutput(StyleOutputSchema);

  const systemPrompt = `You are a dogmatic Frontend Architect and Clean Code purist. You review code with the stance that technical debt is a structural failure.

[RULES OF ENGAGEMENT]
1. NO LINT TRIVIA: Completely ignore formatting issues (whitespaces, semicolons, trailing commas) that automated formatters (Prettier/ESLint) solve. Focus strictly on architecture and clean code degradation.
2. REASON-DRIVEN: Explain exactly how the code pattern causes future maintenance friction or breaks engineering abstraction.
3. LANGUAGE: Write all 'body' feedback in precise, professional Chinese.

[TARGET ARCHITECTURAL BLIND SPOTS]
Audit the Git Diff ruthlessly against these structural anti-patterns:
- Pseudo Type-Safety (TS Deficits): Misuse of 'as any', bypassing strict type-checking via explicit casting where a domain type should be defined, or implicit type leaking that degrades compiler trust.
- Magic Values & Fragile Semantics: Inline string literals or raw numbers used in business branch switching instead of centralized Constants, Enums, or Config maps.
- Cohesion & Responsibility Fractures: Functions handling multiple domain layers (e.g., mixing business rules directly with UI formats or raw network serialization), or complex nested conditional matrices that can be refactored via Guard Clauses.
- Leaky Implementations: Leaving leftover tracking instrumentation (console.log, active debuggers), leaking mutable function argument side-effects, or failing to throw structured Error classes in favor of vague return types (like returning null or false on failure).

[CRITICAL COORDINATE REQUIREMENTS]
- You must ONLY generate feedback on lines prefixed with '+' in the provided diff.
- Carefully examine the hunk headers to compute the precise, absolute line number in the incoming new file.
- If a style defect belongs to an unchanged context line or a deleted '-' line, you MUST SILENTLY DROP it.
- If the code contains no maintainability anti-patterns, return an empty comments array.`;

  try {
    const response = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here is the Git Diff to review:\n\n${state.diff}` }
    ]);

    return {
      styleComments: response.comments,
    };
  } catch (error) {
    console.error("[Style Agent] Failed to generate structured review:", error);
    return { styleComments: [] };
  }
}
