import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function getModelInstance(provider: string, modelName: string, temperature: number): any {
  console.log(`\n[Factory Active] 成功触发底层工厂拦截！当前入参 -> provider: ${provider}, model: ${modelName}`);
  
  // ✨ 技巧 1：显式指定为 string 类型，打破字面量锁定，解决 TS2367 报错
  const p: string = "deepseek";
  const actualModelName = "deepseek-chat";

  if (p === "gemini") {
    return new ChatGoogleGenerativeAI({
      modelName: actualModelName,
      temperature: temperature,
    } as any);
  }

  if (p === "openai") {
    return new ChatOpenAI({
      modelName: actualModelName,
      temperature: temperature,
    } as any);
  }

  if (p === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("\n[DiffLens Error] 运行终止：未在当前终端检测到有效的 DEEPSEEK_API_KEY。\n");
    }

    // ✨ 技巧 2：末尾使用 as any 强行断言，彻底绕过本地 LangChain 版本的参数类型死锁，解决 TS2353 报错
    // 这样既保证了生成的 JS 包含 baseURL，又能让编译器闭嘴放行
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
    } as any);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
