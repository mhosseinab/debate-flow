
import { GoogleGenAI, Modality } from "@google/genai";
import { PodcastConfig, Logger } from "../types";
import { cleanTranscript, parseTranscriptToSegments, buildSafeChunks } from "../lib/utils";
import { generateSilence, decodeBase64Audio, concatenateBuffers } from "../lib/audioUtils";
import { buildSystemPrompt, buildNamingPrompt, buildAudioPrompt, buildAudioSystemPrompt } from "./prompts";

const getAI = () => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to convert internal markdown format (**[ALEX]**) to clean TTS format (Alex:)
const formatForTTS = (text: string, config: PodcastConfig): string => {
    let formatted = text;

    // 1. Replace internal specific speaker tags with "Name:" format
    // Case insensitive regex for Speaker 1
    const s1Reg = new RegExp(`\\*\\*\\[${config.speaker1Name}\\]\\*\\*`, 'gi');
    formatted = formatted.replace(s1Reg, `${config.speaker1Name}:`);

    // Case insensitive regex for Speaker 2
    const s2Reg = new RegExp(`\\*\\*\\[${config.speaker2Name}\\]\\*\\*`, 'gi');
    formatted = formatted.replace(s2Reg, `${config.speaker2Name}:`);

    // 2. Catch-all: Remove any remaining markdown bolding on brackets **[NAME]** -> Name:
    formatted = formatted.replace(/\*\*\[(.*?)(?:\]\*\*|\])/g, "$1:");

    // 3. Remove double newlines to keep flow tight
    formatted = formatted.replace(/\n\n/g, "\n");

    return formatted;
};

export const generatePodcastName = async (inputScript: string, config: PodcastConfig, log?: Logger): Promise<string> => {
    const prompt = buildNamingPrompt(inputScript, config);
    const logId = log ? log('REQUEST', 'NAME', prompt) : undefined;
    
    try {
        const res = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }]
        });
        const text = res.text?.trim().replace(/['"]/g, "") || "Mind Matters";
        if (log) log('RESPONSE', 'NAME', prompt, text, logId);
        return text;
    } catch (e: any) { 
        if (log) log('ERROR', 'NAME', prompt, `ERROR: ${e.message}`, logId);
        return "The Daily Deep Dive"; 
    }
};

export const generateDebateStream = async (inputScript: string, config: PodcastConfig, onChunk: (text: string) => void, log?: Logger) => {
    const systemPrompt = buildSystemPrompt(config);
    const fullPrompt = `SYSTEM:\n${systemPrompt}\n\nUSER INPUT:\n${inputScript.substring(0, 500)}... [truncated]`;
    let fullResponse = "";

    const logId = log ? log('REQUEST', 'SCRIPT', fullPrompt) : undefined;

    try {
        const stream = await getAI().models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: inputScript }] }],
            config: { systemInstruction: systemPrompt, temperature: 0.8, maxOutputTokens: 8192 }
        });

        for await (const chunk of stream) {
            if (chunk.text) {
                onChunk(chunk.text);
                fullResponse += chunk.text;
            }
        }
        if (log) log('RESPONSE', 'SCRIPT', fullPrompt, fullResponse, logId);
    } catch (e: any) {
        if (log) log('ERROR', 'SCRIPT', fullPrompt, `ERROR: ${e.message}`, logId);
        throw e;
    }
};

export const generatePodcastAudio = async (
  transcript: string, 
  config: PodcastConfig, 
  onProgress?: (curr: number, total: number) => void,
  log?: Logger
): Promise<AudioBuffer> => {
    const cleaned = cleanTranscript(transcript);
    if (cleaned.length < 10) throw new Error("Transcript empty");

    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    const ctx = new AudioContextClass({ sampleRate: 24000 });
    const buffers: AudioBuffer[] = [generateSilence(0.5, ctx)];

    const segments = parseTranscriptToSegments(cleaned, config.speaker1Name.toUpperCase());
    
    // Chunk size reduced slightly to ensure reliability
    const chunks = buildSafeChunks(segments, 2000);

    // Generate the Acting Guide System Prompt
    const audioSystemPrompt = buildAudioSystemPrompt(config);

    for (let i = 0; i < chunks.length; i++) {
        if (onProgress) onProgress(i + 1, chunks.length);
        
        // 1. Get raw chunk with **[SPEAKER]** tags
        const rawChunk = chunks[i].trim();
        if (rawChunk.length < 2) continue;

        // 2. Format for TTS: Convert **[ALEX]** -> Alex: for better model recognition
        const ttsInput = formatForTTS(rawChunk, config);

        // 3. Build simplified prompt
        const prompt = buildAudioPrompt(ttsInput, config);
        const logId = log ? log('REQUEST', 'AUDIO', `SYSTEM: ${audioSystemPrompt}\n\nUSER: ${prompt}`) : undefined;

        try {
            const res = await getAI().models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: audioSystemPrompt,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        multiSpeakerVoiceConfig: {
                            speakerVoiceConfigs: [
                                { speaker: config.speaker1Name, voiceConfig: { prebuiltVoiceConfig: { voiceName: config.speaker1Voice } } },
                                { speaker: config.speaker2Name, voiceConfig: { prebuiltVoiceConfig: { voiceName: config.speaker2Voice } } }
                            ]
                        }
                    }
                }
            });

            const base64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64) {
                buffers.push(await decodeBase64Audio(base64, ctx));
                if (log) log('RESPONSE', 'AUDIO', prompt, `(Chunk ${i+1}/${chunks.length}) Success [${Math.round(base64.length/1024)}KB]`, logId);
            } else {
                if (log) log('ERROR', 'AUDIO', prompt, `(Chunk ${i+1}/${chunks.length}) Failed - No audio data`, logId);
            }
        } catch (e: any) { 
            if (log) log('ERROR', 'AUDIO', prompt, `(Chunk ${i+1}/${chunks.length}) ERROR: ${e.message}`, logId);
        }
    }

    buffers.push(generateSilence(0.5, ctx));
    return concatenateBuffers(buffers, ctx);
};
