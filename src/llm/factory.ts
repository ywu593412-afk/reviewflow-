import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ProxyAgent } from "undici";

// 🚀 核心全局拦截：强行给 Node.js 的原生 fetch 注入代理宿主
// 让它所有发往谷歌官方的请求，全部雷打不动地走你手机小火箭的局域网共享端口
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  return originalFetch(input, {
    ...init,
    dispatcher: new ProxyAgent("http://172.20.10.1:1082"),
  } as any);
};

export function getModelInstance(provider: string, modelName: string, temperature: number) {
  const p = provider.toLowerCase();

  if (p === "gemini") {
    // 恢复官方原装客户端，直接带上你的官方密钥冲向谷歌服务器
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
