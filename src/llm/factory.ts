import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function getModelInstance(provider: string, modelName: string, temperature: number) {
  // 🚨 核心追踪日志：用来绝对判定这段代码是否真的被当前的运行环境执行了
  console.log(`\n[Factory Active] 成功触发底层工厂拦截！当前入参 -> provider: ${provider}, model: ${modelName}`);
  
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
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("\n[DiffLens Error] 运行终止：未在当前终端检测到有效的 DEEPSEEK_API_KEY。\n");
    }

    // 覆盖所有可能的 LangChain 参数版本命名，彻底堵死由于依赖包版本对齐引发的域名回流
    return new ChatOpenAI({
      model: actualModelName,
      modelName: actualModelName,
      temperature: temperature,
      apiKey: apiKey,
      openAIApiKey: apiKey,
      baseURL: "https://api.deepseek.com/v1",
      configuration: {
        baseURL: "https://api.deepseek.com/v1",
        apiKey: apiKey,
      },
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
