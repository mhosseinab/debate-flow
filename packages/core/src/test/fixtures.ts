import type { PodcastConfig } from "../types";

/** A fully-populated config for tests so prompt templates have every variable. */
export const sampleConfig: PodcastConfig = {
  podcastName: "Mind Matters",
  duration: 5,
  tone: "Neutral & Balanced",
  format: "Standard Debate (2 Sides)",
  audience: "General Public",
  language: "English",
  introStyle: "Standard Welcome",
  pacing: "Conversational (Default)",
  speaker1Name: "Alex",
  speaker1Gender: "Male",
  speaker1Voice: "Puck",
  speaker2Name: "Sarah",
  speaker2Gender: "Female",
  speaker2Voice: "Kore",
  speakerBalance: "Balanced (50/50)",
  soundDesign: "Standard (Transitions)",
  musicGenre: "Lo-Fi / Chill",
  vocabularyLevel: "Accessible",
  conclusionStyle: "Thought Provoking Question",
  generateShowNotes: false,
  generateViralClip: false,
  criticalAnalysis: false,
  customPrompt: "",
  llm: {
    provider: "google-genai",
    model: "gemini-2.5-flash",
    temperature: 0.8,
    maxOutputTokens: 8192,
    maxRetries: 3,
  },
  tts: {
    provider: "google-genai",
    model: "gemini-2.5-flash-preview-tts",
  },
};
