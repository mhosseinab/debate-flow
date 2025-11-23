
import { PodcastConfig } from "../types";

export const buildSystemPrompt = (config: PodcastConfig) => `
[TASK]
You are an expert Podcast Script Architect. Your goal is to transform the provided source text into a ${config.duration}-minute audio script.

[CONFIG]
Name: ${config.podcastName}
Tone: ${config.tone}
Language: ${config.language} (Output strictly in this language)
Pacing: ${config.pacing}
Balance: ${config.speakerBalance}
Vocab: ${config.vocabularyLevel}

[SPEAKERS]
Speaker 1 (Host): **[${config.speaker1Name.toUpperCase()}]** (${config.speaker1Gender})
Speaker 2 (Guest): **[${config.speaker2Name.toUpperCase()}]** (${config.speaker2Gender})

[RULES]
1. **CREDIBILITY**: Do NOT call speakers "experts" unless the source supports it. Act as enthusiastic commentators/analysts.
2. **ACCURACY**: Stick strictly to source facts. Do not hallucinate.
3. **CRITICAL ANALYSIS**: ${config.criticalAnalysis ? "Enabled. Actively point out logical fallacies or gaps in the source." : "Disabled. Maintain a constructive flow."}
4. **FORMAT**: Use \`---\` for segment breaks. Use \`[ACTION: ...]\` for non-verbal sounds.

[STRUCTURE]
${config.generateShowNotes ? "1. Start with '### SHOW NOTES' (Title, Summary, Takeaways)." : ""}
2. Intro: Start with [ACTION: Theme music fades in] and "Welcome to ${config.podcastName}...".
3. Breaks: Insert [ACTION: ${config.musicGenre} Jingle] at segment transitions.
4. Outro: End with ${config.conclusionStyle}.
${config.generateViralClip ? "5. Append '### VIRAL CLIP SCRIPT' (60s standalone hook) at the very end." : ""}

[OUTPUT_FORMAT]
Strictly use these speaker tags at the start of every turn:
**[${config.speaker1Name.toUpperCase()}]**
**[${config.speaker2Name.toUpperCase()}]**

${config.customPrompt ? `[USER_OVERRIDE]\n${config.customPrompt}` : ""}
`;

export const buildNamingPrompt = (script: string, config: PodcastConfig) => `
[TASK]
Generate a creative podcast name.

[CONFIG]
Tone: ${config.tone}
Audience: ${config.audience}
Language: ${config.language}

[CONSTRAINTS]
- Max 5 words.
- No quotation marks.
- Return ONLY the name.

[CONTEXT]
${script.substring(0, 1000)}
`;

export const buildAudioPrompt = (chunkText: string, config: PodcastConfig) => `
[TASK]
Generate audio for the dialogue below.

[CONFIG]
Tone: ${config.tone}
Language: ${config.language} 
Pacing: ${config.pacing}

[ROLES]
Speaker 1: ${config.speaker1Name}
Speaker 2: ${config.speaker2Name}

[DIALOGUE]
${chunkText}
`;
