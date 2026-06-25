import { describe, it, expect, vi, beforeEach } from "vitest";

const generateContent = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
    constructor(public opts: unknown) {}
  },
}));

import { createTTSProvider } from "./registry";

describe("TTS seam (Gemini provider)", () => {
  beforeEach(() => generateContent.mockReset());

  it("creates a Gemini provider advertising multi-speaker capability", () => {
    const provider = createTTSProvider({
      provider: "google-genai",
      model: "gemini-2.5-flash-preview-tts",
      apiKey: "k",
    });
    expect(provider.id).toBe("google-genai");
    expect(provider.capabilities.multiSpeaker).toBe(true);
  });

  it("throws when the api key is missing", () => {
    expect(() =>
      createTTSProvider({ provider: "google-genai", model: "m" }),
    ).toThrow(/apiKey/i);
  });

  it("maps speakers into multiSpeakerVoiceConfig and returns base64 audio", async () => {
    generateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ inlineData: { data: "BASE64AUDIO" } }] } }],
    });
    const provider = createTTSProvider({
      provider: "google-genai",
      model: "gemini-2.5-flash-preview-tts",
      apiKey: "k",
    });

    const out = await provider.synthesize({
      text: "Alex: hello\nSarah: hi",
      speakers: [
        { speaker: "Alex", voiceName: "Puck" },
        { speaker: "Sarah", voiceName: "Kore" },
      ],
    });

    expect(out).toBe("BASE64AUDIO");
    const callArg = generateContent.mock.calls[0][0];
    expect(callArg.model).toBe("gemini-2.5-flash-preview-tts");
    expect(callArg.config.responseModalities).toEqual(["AUDIO"]);
    const cfgs = callArg.config.speechConfig.multiSpeakerVoiceConfig.speakerVoiceConfigs;
    expect(cfgs).toHaveLength(2);
    expect(cfgs[0]).toEqual({
      speaker: "Alex",
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
    });
  });

  it("returns null when the response carries no audio", async () => {
    generateContent.mockResolvedValue({ candidates: [] });
    const provider = createTTSProvider({
      provider: "google-genai",
      model: "m",
      apiKey: "k",
    });
    const out = await provider.synthesize({ text: "x", speakers: [] });
    expect(out).toBeNull();
  });
});
