import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function getModelInstance(provider: string, modelName: string, temperature: number) {
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
