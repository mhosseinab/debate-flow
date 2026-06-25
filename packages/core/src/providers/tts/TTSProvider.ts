// TTS seam. Concrete providers (Gemini today) implement this; callers depend only
// on the interface. Capabilities let callers degrade gracefully when a provider
// can't do multi-speaker in a single call.

export interface SpeakerVoice {
  /** Name as it appears in the dialogue (e.g. "Alex"). */
  speaker: string;
  /** Provider-specific prebuilt voice id (e.g. "Puck"). */
  voiceName: string;
}

export interface TTSRequest {
  /** TTS-ready text (speaker tags already flattened to "Name:" form). */
  text: string;
  speakers: SpeakerVoice[];
}

export interface TTSCapabilities {
  /** True if multiple speakers can be voiced in a single synthesize() call. */
  multiSpeaker: boolean;
  maxSpeakers: number;
}

export interface TTSProvider {
  readonly id: string;
  readonly capabilities: TTSCapabilities;
  /** Returns base64-encoded PCM audio for the request, or null if none was returned. */
  synthesize(req: TTSRequest): Promise<string | null>;
}
