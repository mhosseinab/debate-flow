// Provider/model seam — the dependency-inversion boundary. Nothing downstream of
// these types imports a concrete model SDK directly; they go through the factories
// in chatModel.ts / tts/registry.ts. Adding a provider = one registry entry, no
// changes to the graph, prompts, or UI.

/** Chat (text-generation) providers the registry knows how to construct. */
export type ChatProviderId = "google-genai" | "openai";

export interface ProviderConfig {
  provider: ChatProviderId;
  model: string;
  /** BYOK: supplied at runtime by the user. */
  apiKey?: string;
  temperature?: number;
  maxOutputTokens?: number;
  maxRetries?: number;
}

/** TTS providers. Kept separate from chat because capabilities differ. */
export type TTSProviderId = "google-genai";

export interface TTSProviderConfig {
  provider: TTSProviderId;
  model: string;
  /** BYOK: supplied at runtime by the user. */
  apiKey?: string;
}
