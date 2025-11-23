
import { PodcastDuration, VoiceProfile } from './types';

export const DURATIONS: PodcastDuration[] = [5, 15, 30, 45, 60];

export const VOICE_PROFILES: VoiceProfile[] = [
  { name: 'Puck', gender: 'Male', description: 'Deep, rough' },
  { name: 'Charon', gender: 'Male', description: 'Deep, authoritative' },
  { name: 'Kore', gender: 'Female', description: 'Soft, calm' },
  { name: 'Fenrir', gender: 'Male', description: 'High energy' },
  { name: 'Zephyr', gender: 'Female', description: 'Balanced, clear' },
];

export const OPTIONS = {
    tones: ["Neutral & Balanced", "Heated Debate", "Casual Banter", "NPR Style / Serious", "High Energy / Radio", "Investigative"],
    formats: ["Standard Debate (2 Sides)", "Host & Guest Interview", "Roundtable Discussion", "Narrative Storytelling", "Educational / Explainer"],
    languages: ["English", "Spanish", "French", "German", "Portuguese", "Japanese", "Persian"],
    introStyles: ["Standard Welcome", "Cold Open (Hook First)", "Teaser (Highlight Clip)"],
    pacing: ["Relaxed (Slow)", "Conversational (Default)", "Rapid-Fire (Fast)"],
    balances: ["Balanced (50/50)", "Host-Led (70/30)", "Guest-Star (30/70)"],
    soundDesigns: ["Clean (Dialogue Only)", "Standard (Transitions)", "Cinematic (Rich SFX)"],
    musicGenres: ["Lo-Fi / Chill", "Corporate / Tech", "Cinematic / Orchestral", "Jazz / Lounge", "Electronic / Upbeat"],
    vocabLevels: ["Accessible", "Sophisticated", "Academic", "Simplified (ESL)"],
    conclusions: ["Thought Provoking Question", "Direct Call to Action", "Abrupt Fade Out", "Summarizing Wrap-up"]
};

export const DEFAULT_CONFIG: any = { // Typed as any to avoid circular dep issues during init, validated elsewhere
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
    generateShowNotes: false,
    musicGenre: "Lo-Fi / Chill",
    vocabularyLevel: "Accessible",
    conclusionStyle: "Thought Provoking Question",
    generateViralClip: false,
    criticalAnalysis: false,
    customPrompt: ""
};
