import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ProviderConfig } from "../types";
import type { ChatProvider } from "./ChatProvider";

/** Google Gemini via @langchain/google-genai. Ignores `baseURL`. */
export class GoogleGenAIProvider implements ChatProvider {
  readonly id = "google-genai" as const;

  async create(cfg: ProviderConfig): Promise<BaseChatModel> {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    return new ChatGoogleGenerativeAI({
      model: cfg.model,
      apiKey: cfg.apiKey,
      temperature: cfg.temperature,
      maxOutputTokens: cfg.maxOutputTokens,
      maxRetries: cfg.maxRetries,
    });
  }
}
