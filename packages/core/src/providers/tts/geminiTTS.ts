import { GoogleGenAI } from "@google/genai";
import type { TTSProvider, TTSRequest, TTSCapabilities } from "./TTSProvider";

/** Gemini multi-speaker TTS via @google/genai responseModalities: ['AUDIO']. */
export class GeminiTTSProvider implements TTSProvider {
  readonly id = "google-genai";
  readonly capabilities: TTSCapabilities = { multiSpeaker: true, maxSpeakers: 2 };

  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(opts: { apiKey: string; model: string }) {
    this.client = new GoogleGenAI({ apiKey: opts.apiKey });
    this.model = opts.model;
  }

  async synthesize(req: TTSRequest): Promise<string | null> {
    const res = await this.client.models.generateContent({
      model: this.model,
      contents: [{ parts: [{ text: req.text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: req.speakers.map((s) => ({
              speaker: s.speaker,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voiceName } },
            })),
          },
        },
      },
    });
    return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
  }
}
