import { GraphStateType } from "../state.js";
import { getModelInstance } from "../../llm/factory.js";
import { z } from "zod";

const LogicOutputSchema = z.object({
  comments: z.array(
    z.object({
      file: z.string().describe("The file path being reviewed"),
      line: z.number().describe("The precise, absolute line number prefixed with '+' in the diff"),
      body: z.string().describe("Concise and critical logic review feedback in Chinese")
    })
  )
});

export async function logicAgentNode(state: GraphStateType) {
  // 确保使用推理能力更强的 pro 模型应对复杂逻辑和坐标运算
  const model = getModelInstance("gemini", "gemini-1.5-pro", 0.2);
  const structuredModel = model.withStructuredOutput(LogicOutputSchema);

  // +++ 核心修复 1：重写系统提示词，严禁 AI 自己算行号，强迫它查表 +++
  const systemPrompt = `你是一个带有敌意的、顶级的 Node.js/TypeScript 核心系统工程师，正在进行严格的双盲代码审查。你的唯一目标是通过找出隐藏的运行时边界条件、并发问题和逻辑缺陷，来摧毁新提交的代码。

[审查规则 - RULES OF ENGAGEMENT]
1. 零赞美：不要夸奖代码。如果没有逻辑漏洞，直接返回空数组，保持静默。
2. 直击要害：每一条评论必须指出一个具体的崩溃场景（例如：“如果 X 为空，第 Y 行会抛出 TypeError”）。绝不能给“建议添加日志”这种泛泛而谈的废话。
3. 语言：必须使用专业、准确的【中文】撰写 feedback。

[打击目标 - TARGET VULNERABILITY VECTORS]
- 异步幽灵：未被 await 的 Promise，缺少 .catch()。
- 隐藏的空指针/解引用：没有检查数组/对象是否为空就直接访问属性（如 data[0].id），这能骗过 TS 编译，但在运行时会崩溃。
- 致命逻辑与边界条件：死循环（极其重要）、越界、缺失 return。

[致命的行号坐标要求 - CRITICAL COORDINATE REQUIREMENTS]
大模型极不擅长通过 Diff Hunk 自行计算绝对行号。
因此，用户在下方为你提供了一份精确的【有效代码行索引（Valid Diff Index）】。
你发现漏洞后，**必须且只能**从【有效代码行索引】中挑选出对应的 file 路径和 line 行号填入 JSON。
如果你发现的缺陷对应的代码，不存在于【有效代码行索引】中，说明那是无需审查的上下文代码，你必须直接丢弃该评论！`;

  try {
    const response = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      // +++ 核心修复 2：把 diffIndex（地图）和 diff（生肉）一起喂给大模型 +++
      { role: "user", content: `【有效代码行索引 (Valid Diff Index)】:\n${JSON.stringify(state.diffIndex, null, 2)}\n\n【Git Diff 源代码】:\n${state.diff}` }
    ]);

    return {
      // +++ 核心修复 3：精准把结果丢进 logicComments 这个专属抽屉里 +++
      logicComments: response.comments || [],
    };
  } catch (error) {
    console.error("[Logic Agent] Failed to generate structured review:", error);
    return { logicComments: [] };
  }
}
