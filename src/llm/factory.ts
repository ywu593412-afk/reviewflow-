import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function getModelInstance(provider: string, modelName: string, temperature: number) {
  // 核心硬核拦截：全员无条件切到国内直连的 DeepSeek 通道
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
    // 影子防线：前置校验终端环境变量，防止因漏配密钥导致 cryptic 错误
    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY.trim() === "") {
      throw new Error(
        "\n[DiffLens Error] 核心终止：未在当前终端检测到有效的 DEEPSEEK_API_KEY。\n" +
        "请检查并在运行前确保执行了：set DEEPSEEK_API_KEY=你的sk-开头的真实密钥\n"
      );
    }

    return new ChatOpenAI({
      modelName: actualModelName,
      temperature: temperature,
      // 跨版本多重对齐，确保新旧版 LangChain 均能精准识别密钥
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
