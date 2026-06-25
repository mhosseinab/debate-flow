import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ProviderConfig } from "./types";

// The chat seam. Each entry lazily imports only its own provider package, so the
// bundle pulls in exactly the providers registered here (unlike a universal
// initChatModel switch that references every provider). Add a provider by adding
// one entry + installing its package — no downstream changes.
type ChatModelLoader = (cfg: ProviderConfig) => Promise<BaseChatModel>;

const LOADERS: Record<string, ChatModelLoader> = {
  "google-genai": async (cfg) => {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    return new ChatGoogleGenerativeAI({
      model: cfg.model,
      apiKey: cfg.apiKey,
      temperature: cfg.temperature,
      maxOutputTokens: cfg.maxOutputTokens,
      maxRetries: cfg.maxRetries,
    });
  },
  openai: async (cfg) => {
    const { ChatOpenAI } = await import("@langchain/openai");
    return new ChatOpenAI({
      model: cfg.model,
      apiKey: cfg.apiKey,
      temperature: cfg.temperature,
      maxTokens: cfg.maxOutputTokens,
      maxRetries: cfg.maxRetries,
    });
  },
};

export async function createChatModel(cfg: ProviderConfig): Promise<BaseChatModel> {
  const loader = LOADERS[cfg.provider];
  if (!loader) {
    throw new Error(
      `Unsupported chat provider: "${cfg.provider}". Known providers: ${listChatProviders().join(", ")}`,
    );
  }
  return loader(cfg);
}

export function listChatProviders(): ChatProviderName[] {
  return Object.keys(LOADERS) as ChatProviderName[];
}

type ChatProviderName = keyof typeof LOADERS;
