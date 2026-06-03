import { getModelInstance } from "../../llm/factory.js";
import { z } from "zod";

// 输出结构继续保持绝对对齐
const SecurityOutputSchema = z.object({
  comments: z.array(
    z.object({
      file: z.string().describe("The file path being reviewed"),
      line: z.number().describe("The precise, absolute line number prefixed with '+' in the diff"),
      body: z.string().describe("Concise and critical security feedback in Chinese")
    })
  )
});

export async function securityAgentNode(state) {
  // 安全审查需要深层推理，继续使用 Pro 模型防守底线
  const model = getModelInstance("gemini", "gemini-1.5-pro", 0.2);
  const structuredModel = model.withStructuredOutput(SecurityOutputSchema);

  // +++ 核心修复 1：重写系统提示词，严禁 AI 自己算行号，强迫它查表 +++
  const systemPrompt = `你是一个偏执、顶级的 Web 安全工程师，正在进行带有敌意的代码审查（Hostile Code Review）。你的唯一目标是找出新增代码中的致命安全漏洞。

[审查规则 - RULES OF ENGAGEMENT]
1. 绝对不要说客套话：如果没有严重的安全漏洞，直接返回空数组，保持静默。
2. 直击要害：必须用专业、准确的【中文】指出攻击向量（例如：“这里使用了 eval 并且拼接了外部变量，存在严重的远程代码执行 (RCE) 漏洞”）。
3. 重点打击目标：密码/密钥硬编码、eval/危险函数执行、SQL注入、死循环等。

[致命的行号坐标要求 - CRITICAL COORDINATE REQUIREMENTS]
大模型极不擅长通过 Diff Hunk 自行计算绝对行号。
因此，用户在下方为你提供了一份精确的【有效代码行索引（Valid Diff Index）】。
你发现漏洞后，**必须且只能**从【有效代码行索引】中挑选出对应的 file 路径和 line 行号填入 JSON。
如果你发现的漏洞对应的代码，不存在于【有效代码行索引】中，说明那是无需审查的上下文代码，你必须直接丢弃该评论！`;

  try {
    const response = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      // +++ 核心修复 2：把 diffIndex（地图）和 diff（生肉）一起喂给大模型 +++
      { role: "user", content: `【有效代码行索引 (Valid Diff Index)】:\n${JSON.stringify(state.diffIndex, null, 2)}\n\n【Git Diff 源代码】:\n${state.diff}` }
    ]);

    return {
      // +++ 核心修复 3：精准把结果丢进 securityComments 这个专属抽屉里 +++
      securityComments: response.comments || [],
    };
  } catch (error) {
    console.error("[Security Agent] Failed to generate structured review:", error);
    return { securityComments: [] };
  }
}
