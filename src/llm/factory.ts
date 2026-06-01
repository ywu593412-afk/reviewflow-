import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function getModelInstance(provider: string, modelName: string, temperature: number) {
  const p = provider.toLowerCase();
  
  if (p === "gemini") {
    return new ChatGoogleGenerativeAI({
      modelName: modelName || "gemini-1.5-pro",
      temperature: temperature,
    });
  }
  
  if (p === "openai") {
    return new ChatOpenAI({
      modelName: modelName || "gpt-4o",
      temperature: temperature,
    });
  }
  
  if (p === "deepseek") {
    return new ChatOpenAI({
      modelName: modelName || "deepseek-chat",
      temperature: temperature,
      configuration: {
        baseURL: "https://api.deepseek.com/v1",
      },
    });
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}
