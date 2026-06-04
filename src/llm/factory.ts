import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function getModelInstance(provider: string, modelName: string, temperature: number): any {
  console.log(`\n[Factory Active] 当前调用: provider=${provider}, model=${modelName}`);
  
  // 直接使用入参 provider，不要写死
  if (provider === "gemini") {
    return new ChatGoogleGenerativeAI({
      modelName: modelName,
      temperature: temperature,
    } as any);
  }

  if (provider === "openai") {
    return new ChatOpenAI({
      modelName: modelName,
      temperature: temperature,
    } as any);
  }

  if (provider === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("缺少 DEEPSEEK_API_KEY");

    return new ChatOpenAI({
      model: modelName,
      modelName: modelName,
      temperature: temperature,
      apiKey: apiKey,
      openAIApiKey: apiKey,
      baseURL: "https://api.deepseek.com/v1",
      configuration: {
        baseURL: "https://api.deepseek.com/v1",
      },
    } as any);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
