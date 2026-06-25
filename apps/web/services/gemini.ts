
import { HumanMessage } from "@langchain/core/messages";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { Runnable } from "@langchain/core/runnables";
import { BaseOutputParser } from "@langchain/core/output_parsers";
import {
    PodcastConfig, Logger, LogType,
    cleanTranscript, parseTranscriptToSegments, buildSafeChunks,
    generateSilence, decodeBase64Audio, concatenateBuffers,
    buildSystemPrompt, buildNamingPrompt, buildAudioPrompt,
    createChatModel, createTTSProvider, TTSProvider, runDebateGraph,
} from "@debateflow/core";
import { buildTracer } from "./observability";
import { getApiKey } from "./apiKey";

// Constants (orchestration-level; model/provider settings now live in config.llm / config.tts)
const DEFAULT_MAX_RETRIES = 3;
const CHUNK_SIZE = 600;
const MIN_TRANSCRIPT_LENGTH = 10;
const AUDIO_SAMPLE_RATE = 24000;
const SILENCE_DURATION = 0.5;
const RETRY_BACKOFF_MS = 1000;

// BYOK provider-key resolution lives in ./apiKey (localStorage, dev-env fallback).

// Single Responsibility: build a chat model through the provider seam, optionally
// binding callbacks. The concrete provider is chosen by config.llm — never hard-coded.
const buildChatModel = async (config: PodcastConfig, callbacks?: BaseCallbackHandler[]) => {
    const model = await createChatModel({ ...config.llm, apiKey: getApiKey() });
    return callbacks?.length ? model.withConfig({ callbacks }) : model;
};

// Single Responsibility: Output parsing for podcast names
class PodcastNameParser extends BaseOutputParser<string> {
    lc_namespace = ["custom", "podcast_name_parser"];
    private readonly MAX_WORDS = 5;
    private readonly DEFAULT_NAME = "Mind Matters";

    getFormatInstructions(): string {
        return "Return only the podcast name, max 5 words, no quotation marks.";
    }

    async parse(text: string): Promise<string> {
        const cleaned = text.trim().replace(/['"]/g, "");
        const words = cleaned.split(/\s+/).slice(0, this.MAX_WORDS);
        return words.join(" ") || this.DEFAULT_NAME;
    }
}

// Single Responsibility: Logging integration for LangChain
class LoggerCallbackHandler extends BaseCallbackHandler {
    name = "LoggerCallbackHandler";
    private readonly log?: Logger;
    private readonly logId?: string;
    private readonly prompt?: string;
    private readonly logType: LogType;

    constructor(log?: Logger, logId?: string, prompt?: string, logType: LogType = 'SCRIPT') {
        super();
        this.log = log;
        this.logId = logId;
        this.prompt = prompt;
        this.logType = logType;
    }

    async handleLLMStart(): Promise<void> {
        // Request already logged in calling function
    }

    async handleLLMEnd(output: any): Promise<void> {
        if (!this.shouldLog()) return;
        const content = output.generations?.[0]?.[0]?.text || output.text || "";
        this.log!('RESPONSE', this.logType, this.prompt!, content, this.logId);
    }

    async handleLLMError(err: Error): Promise<void> {
        if (!this.shouldLog()) return;
        this.log!('ERROR', this.logType, this.prompt!, `ERROR: ${err.message}`, this.logId);
    }

    private shouldLog(): boolean {
        return !!(this.log && this.logId && this.prompt);
    }
}

// Single Responsibility: Text transformation for TTS
class TTSFormatter extends Runnable<string, string> {
    lc_namespace = ["custom", "tts_formatter"];
    private readonly speaker1Name: string;
    private readonly speaker2Name: string;

    constructor(config: PodcastConfig) {
        super();
        this.speaker1Name = config.speaker1Name;
        this.speaker2Name = config.speaker2Name;
    }

    async invoke(input: string): Promise<string> {
        return this.formatSpeakerTags(input)
            .replace(/\*\*\[(.*?)(?:\]\*\*|\])/g, "$1:") // Remove markdown bolding
            .replace(/\n\n/g, "\n"); // Remove double newlines
    }

    private formatSpeakerTags(text: string): string {
        const patterns = [
            { regex: new RegExp(`\\*\\*\\[${this.speaker1Name}\\]\\*\\*`, 'gi'), replacement: `${this.speaker1Name}:` },
            { regex: new RegExp(`\\*\\*\\[${this.speaker2Name}\\]\\*\\*`, 'gi'), replacement: `${this.speaker2Name}:` }
        ];

        return patterns.reduce((formatted, { regex, replacement }) =>
            formatted.replace(regex, replacement), text
        );
    }
}

// DRY: Reusable error handler wrapper
const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    onError: (error: Error) => T,
    log?: Logger,
    logType?: LogType,
    prompt?: string,
    logId?: string
): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        if (log && prompt && logId) {
            log('ERROR', logType || 'SCRIPT', prompt, `ERROR: ${error.message}`, logId);
        }
        return onError(error);
    }
};

// Single Responsibility: Podcast name generation
export const generatePodcastName = async (
    inputScript: string,
    config: PodcastConfig,
    log?: Logger
): Promise<string> => {
    const prompt = await buildNamingPrompt(inputScript, config);
    const logId = log ? log('REQUEST', 'NAME', prompt) : undefined;
    const fallbackName = "The Daily Deep Dive";

    return withErrorHandling(
        async () => {
            const model = await buildChatModel(config);
            const parser = new PodcastNameParser();
            const response = await model.invoke([new HumanMessage(prompt)]);
            const text = await parser.parse(response.content?.toString() || "");
            if (log) log('RESPONSE', 'NAME', prompt, text, logId);
            return text;
        },
        () => fallbackName,
        log,
        'NAME',
        prompt,
        logId
    );
};

// Single Responsibility: Debate stream generation
export const generateDebateStream = async (
    inputScript: string,
    config: PodcastConfig,
    onChunk: (text: string) => void,
    log?: Logger,
    onReset?: () => void
): Promise<void> => {
    const systemPrompt = await buildSystemPrompt(config);
    const fullPrompt = `SYSTEM:\n${systemPrompt}\n\nUSER INPUT:\n${inputScript.substring(0, 500)}... [truncated]`;
    const logId = log ? log('REQUEST', 'SCRIPT', fullPrompt) : undefined;

    try {
        const callbackHandler = new LoggerCallbackHandler(log, logId, fullPrompt, 'SCRIPT');
        const callbacks: BaseCallbackHandler[] = [callbackHandler];
        const tracer = buildTracer(); // BYOK LangSmith tracing, when configured
        if (tracer) callbacks.push(tracer);

        const { transcript, error } = await runDebateGraph(
            { inputScript, config, apiKey: getApiKey() },
            { onToken: onChunk, onReset, callbacks },
        );

        // The input guard aborts by setting `error` rather than throwing.
        if (error) throw new Error(error);
        if (log) log('RESPONSE', 'SCRIPT', fullPrompt, transcript, logId);
    } catch (error: any) {
        if (log) log('ERROR', 'SCRIPT', fullPrompt, `ERROR: ${error.message}`, logId);
        throw error;
    }
};

// Single Responsibility: Audio chunk processing
const processAudioChunk = async (
    chunk: string,
    index: number,
    total: number,
    config: PodcastConfig,
    tts: TTSProvider,
    ctx: AudioContext,
    log?: Logger
): Promise<AudioBuffer | null> => {
    const ttsFormatter = new TTSFormatter(config);
    const ttsInput = await ttsFormatter.invoke(chunk);
    const prompt = await buildAudioPrompt(ttsInput, config);
    const logId = log ? log('REQUEST', 'AUDIO', `USER: ${prompt}`) : undefined;

    const maxAttempts = DEFAULT_MAX_RETRIES;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const base64 = await tts.synthesize({
                text: prompt,
                speakers: [
                    { speaker: config.speaker1Name, voiceName: config.speaker1Voice },
                    { speaker: config.speaker2Name, voiceName: config.speaker2Voice },
                ],
            });
            if (!base64) throw new Error("No audio data returned");

            const buffer = await decodeBase64Audio(base64, ctx);
            const sizeKB = Math.round(base64.length / 1024);
            if (log) log('RESPONSE', 'AUDIO', prompt, `(Chunk ${index}/${total}) Success [${sizeKB}KB]`, logId);
            return buffer;
        } catch (error: any) {
            if (log) log('ERROR', 'AUDIO', prompt, `(Chunk ${index}/${total}) Attempt ${attempt} Failed: ${error.message}`, logId);
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, RETRY_BACKOFF_MS * attempt));
            }
        }
    }
    return null;
};

// Single Responsibility: Audio buffer creation
const createAudioContext = (): AudioContext => {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    return new AudioContextClass({ sampleRate: AUDIO_SAMPLE_RATE });
};

// Single Responsibility: Podcast audio generation orchestration
export const generatePodcastAudio = async (
    transcript: string,
    config: PodcastConfig,
    onProgress?: (curr: number, total: number) => void,
    log?: Logger
): Promise<AudioBuffer> => {
    const cleaned = cleanTranscript(transcript);
    if (cleaned.length < MIN_TRANSCRIPT_LENGTH) {
        throw new Error("Transcript empty");
    }

    const tts = createTTSProvider({ ...config.tts, apiKey: getApiKey() });
    const ctx = createAudioContext();
    const buffers: AudioBuffer[] = [generateSilence(SILENCE_DURATION, ctx)];
    const segments = parseTranscriptToSegments(cleaned, config.speaker1Name.toUpperCase());
    const chunks = buildSafeChunks(segments, CHUNK_SIZE);

    let successCount = 0;

    for (let i = 0; i < chunks.length; i++) {
        onProgress?.(i + 1, chunks.length);

        const rawChunk = chunks[i].trim();
        if (rawChunk.length < 2) continue;

        const buffer = await processAudioChunk(rawChunk, i + 1, chunks.length, config, tts, ctx, log);
        if (buffer) {
            buffers.push(buffer);
            successCount++;
        }
    }

    if (successCount === 0) {
        throw new Error("Audio generation failed completely. Please try again with a shorter script or different tone.");
    }

    buffers.push(generateSilence(SILENCE_DURATION, ctx));
    return concatenateBuffers(buffers, ctx);
};
