import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function getModelInstance(provider: string, modelName: string, temperature: number) {
  const p = "deepseek";
  const actualModelName = "deepseek-chat";

  if (p === "gemini") {
    return new ChatGoogleGenerativeAI({
      modelName: actualModelName,
      temperature: temperature,
    });
  }

  if (p === "openai") {
    return new ChatOpenAI({
      modelName: actualModelName,
      temperature: temperature,
    });
  }

  if (p === "deepseek") {
    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY.trim() === "") {
      throw new Error(
        "\n[DiffLens Error] 核心终止：未在当前终端检测到有效的 DEEPSEEK_API_KEY。\n" +
        "请检查并在运行前确保执行了：set DEEPSEEK_API_KEY=你的sk-开头的真实密钥\n"
      );
    }

    return new ChatOpenAI({
      modelName: actualModelName,
      temperature: temperature,
      // ✨ 关键修正：将 baseURL 提升至最外层顶级参数，强制阻止其回流至 OpenAI 官方域名
      baseURL: "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_API_KEY,
      openAIApiKey: process.env.DEEPSEEK_API_KEY,
      configuration: {
        baseURL: "https://api.deepseek.com/v1",
        apiKey: process.env.DEEPSEEK_API_KEY,
      },
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
