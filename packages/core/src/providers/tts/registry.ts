import type { TTSProvider } from "./TTSProvider";
import type { TTSProviderConfig } from "../types";
import { GeminiTTSProvider } from "./geminiTTS";

/** TTS seam factory — selects a concrete provider from config. */
export function createTTSProvider(cfg: TTSProviderConfig): TTSProvider {
  switch (cfg.provider) {
    case "google-genai":
      if (!cfg.apiKey) throw new Error("TTS apiKey missing");
      return new GeminiTTSProvider({ apiKey: cfg.apiKey, model: cfg.model });
    default:
      throw new Error(`Unsupported TTS provider: "${cfg.provider}"`);
  }
}
