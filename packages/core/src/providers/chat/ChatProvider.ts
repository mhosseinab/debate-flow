import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ProviderConfig, ChatProviderId } from "../types";

// The chat seam — a Strategy abstraction. Each provider is a class implementing
// ChatProvider; the registry (chatModel.ts) picks one by id. A class lazily
// imports only its own provider package, so the bundle pulls in exactly the
// providers registered (unlike a universal initChatModel switch that references
// every provider). Add a provider by adding one class + registry entry +
// installing its package — no downstream changes.

/**
 * One concrete chat provider. `create` builds a configured LangChain chat model
 * for the given config; `id` is the key it registers under. This is the seam's
 * extension point — implement it to add a provider.
 */
export interface ChatProvider {
  readonly id: ChatProviderId;
  create(cfg: ProviderConfig): Promise<BaseChatModel>;
}
