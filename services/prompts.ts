
import { PromptTemplate } from "@langchain/core/prompts";
import { PodcastConfig } from "../types";

// DRY: Reusable template formatting helper
const formatTemplate = async (template: PromptTemplate, variables: Record<string, string>): Promise<string> => {
    return template.format(variables);
};

// DRY: Conditional section builder
const buildConditionalSection = (condition: boolean, content: string): string => {
    return condition ? content : "";
};

// System prompt template for debate generation
const SYSTEM_PROMPT_TEMPLATE = `[TASK]
You are an expert Podcast Script Architect. Your goal is to transform the provided source text into a {duration}-minute audio script.

[CONFIG]
Name: {podcastName}
Tone: {tone}
Language: {language} (Output strictly in this language)
Pacing: {pacing}
Balance: {speakerBalance}
Vocab: {vocabularyLevel}

[SPEAKERS]
Speaker 1 (Host): **[{speaker1NameUpper}]** ({speaker1Gender})
Speaker 2 (Guest): **[{speaker2NameUpper}]** ({speaker2Gender})

[RULES]
1. **CREDIBILITY**: Do NOT call speakers "experts" unless the source supports it. Act as enthusiastic commentators/analysts.
2. **ACCURACY**: Stick strictly to source facts. Do not hallucinate.
3. **CRITICAL ANALYSIS**: {criticalAnalysisText}
4. **FORMAT**: Use \`---\` for segment breaks. Use \`[ACTION: ...]\` for non-verbal sounds.

[STRUCTURE]
{showNotesSection}
2. Intro: Start with [ACTION: Theme music fades in] and "Welcome to {podcastName}...".
3. Breaks: Insert [ACTION: {musicGenre} Jingle] at segment transitions.
4. Outro: End with {conclusionStyle}.
{viralClipSection}

[OUTPUT_FORMAT]
Strictly use these speaker tags at the start of every turn:
**[{speaker1NameUpper}]**
**[{speaker2NameUpper}]**

{userOverride}`;

// Single Responsibility: System prompt builder
export const buildSystemPrompt = async (config: PodcastConfig): Promise<string> => {
    const template = PromptTemplate.fromTemplate(SYSTEM_PROMPT_TEMPLATE);
    
    return formatTemplate(template, {
        duration: String(config.duration),
        podcastName: config.podcastName,
        tone: config.tone,
        language: config.language,
        pacing: config.pacing,
        speakerBalance: config.speakerBalance,
        vocabularyLevel: config.vocabularyLevel,
        speaker1NameUpper: config.speaker1Name.toUpperCase(),
        speaker1Gender: config.speaker1Gender,
        speaker2NameUpper: config.speaker2Name.toUpperCase(),
        speaker2Gender: config.speaker2Gender,
        criticalAnalysisText: config.criticalAnalysis 
            ? "Enabled. Actively point out logical fallacies or gaps in the source." 
            : "Disabled. Maintain a constructive flow.",
        showNotesSection: buildConditionalSection(
            config.generateShowNotes,
            "1. Start with '### SHOW NOTES' (Title, Summary, Takeaways)."
        ),
        musicGenre: config.musicGenre,
        conclusionStyle: config.conclusionStyle,
        viralClipSection: buildConditionalSection(
            config.generateViralClip,
            "5. Append '### VIRAL CLIP SCRIPT' (60s standalone hook) at the very end."
        ),
        userOverride: buildConditionalSection(
            !!config.customPrompt,
            `[USER_OVERRIDE]\n${config.customPrompt}`
        )
    });
};

// Naming prompt template
const NAMING_PROMPT_TEMPLATE = `[TASK]
Generate a creative podcast name.

[CONFIG]
Tone: {tone}
Audience: {audience}
Language: {language}

[CONSTRAINTS]
- Max 5 words.
- No quotation marks.
- Return ONLY the name.

[CONTEXT]
{scriptContext}`;

const MAX_SCRIPT_CONTEXT_LENGTH = 1000;

// Single Responsibility: Naming prompt builder
export const buildNamingPrompt = async (script: string, config: PodcastConfig): Promise<string> => {
    const template = PromptTemplate.fromTemplate(NAMING_PROMPT_TEMPLATE);
    
    return formatTemplate(template, {
        tone: config.tone,
        audience: config.audience,
        language: config.language,
        scriptContext: script.substring(0, MAX_SCRIPT_CONTEXT_LENGTH)
    });
};

// Audio prompt template
const AUDIO_PROMPT_TEMPLATE = `[TASK]
Generate audio for the dialogue below.

[CONFIG]
Tone: {tone}
Language: {language} 
Pacing: {pacing}

[ROLES]
Speaker 1: {speaker1Name}
Speaker 2: {speaker2Name}

[DIALOGUE]
{chunkText}`;

// Single Responsibility: Audio prompt builder
export const buildAudioPrompt = async (chunkText: string, config: PodcastConfig): Promise<string> => {
    const template = PromptTemplate.fromTemplate(AUDIO_PROMPT_TEMPLATE);
    
    return formatTemplate(template, {
        tone: config.tone,
        language: config.language,
        pacing: config.pacing,
        speaker1Name: config.speaker1Name,
        speaker2Name: config.speaker2Name,
        chunkText
    });
};
