import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ProviderConfig, ChatProviderId } from "./types";
import type { ChatProvider } from "./chat/ChatProvider";
import { GoogleGenAIProvider } from "./chat/GoogleGenAIProvider";
import { OpenAIProvider } from "./chat/OpenAIProvider";
import { DeepSeekProvider } from "./chat/DeepSeekProvider";

// The chat seam's registry + factory. Each provider lives in its own class under
// ./chat (Strategy pattern); this file maps id → instance and exposes the two
// public entry points. Add a provider by adding its class + one entry here.
export type { ChatProvider } from "./chat/ChatProvider";

const REGISTRY: ReadonlyMap<ChatProviderId, ChatProvider> = new Map(
  [new GoogleGenAIProvider(), new OpenAIProvider(), new DeepSeekProvider()].map(
    (p) => [p.id, p],
  ),
);

export async function createChatModel(cfg: ProviderConfig): Promise<BaseChatModel> {
  const provider = REGISTRY.get(cfg.provider);
  if (!provider) {
    throw new Error(
      `Unsupported chat provider: "${cfg.provider}". Known providers: ${listChatProviders().join(", ")}`,
    );
  }
  return provider.create(cfg);
}

export function listChatProviders(): ChatProviderId[] {
  return [...REGISTRY.keys()];
}
