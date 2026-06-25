import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ProviderConfig, ChatProviderId } from "../types";
import type { ChatProvider } from "./ChatProvider";

/**
 * OpenAI (and any OpenAI-wire-compatible endpoint) via @langchain/openai.
 * `cfg.baseURL` targets a custom endpoint (proxy/gateway/self-hosted); when
 * unset, `defaultBaseURL` applies (none for OpenAI). DeepSeek subclasses this to
 * supply its own default endpoint — same client, different base URL.
 */
export class OpenAIProvider implements ChatProvider {
  readonly id: ChatProviderId = "openai";
  protected readonly defaultBaseURL?: string = undefined;

  async create(cfg: ProviderConfig): Promise<BaseChatModel> {
    const { ChatOpenAI } = await import("@langchain/openai");
    const baseURL = cfg.baseURL ?? this.defaultBaseURL;
    return new ChatOpenAI({
      model: cfg.model,
      apiKey: cfg.apiKey,
      temperature: cfg.temperature,
      maxTokens: cfg.maxOutputTokens,
      maxRetries: cfg.maxRetries,
      ...(baseURL ? { configuration: { baseURL } } : {}),
    });
  }
}
