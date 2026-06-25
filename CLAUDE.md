# DebateFlow — Podcast Script Builder

Browser app that turns a raw text script into a paced, two-speaker podcast debate
transcript and then renders it to multi-speaker audio, using Google Gemini.

## Stack

- React 19 + TypeScript, bundled with **Vite** (`vite.config.ts`, dev server on port 3000).
- Two Gemini SDKs, used for different jobs:
  - **`@langchain/google-genai`** (`ChatGoogleGenerativeAI`) — streaming **text** generation
    (transcript + podcast name). Model: `gemini-2.5-flash`.
  - **`@google/genai`** (`GoogleGenAI`) — **multi-speaker TTS**. Model:
    `gemini-2.5-flash-preview-tts`, via `responseModalities: ['AUDIO']`.
- Tailwind via CDN (`index.html`) — no local Tailwind build. Accent color `#D0F224`.
- No test runner, linter, or formatter is configured.

## Commands

```bash
npm run dev      # Vite dev server on http://localhost:3000
npm run build    # production build
npm run preview  # preview the build
```

There is **no `npm test` / `npm run lint`**. The only static check is `npx tsc --noEmit`
(run automatically by the Stop hook — see `.claude/hooks/`).

## API key handling

- The key lives in `.env` as `GEMINI_API_KEY` (gitignored; `env.example` is the template).
- `vite.config.ts` injects it at build time into **both** `process.env.API_KEY` and
  `process.env.GEMINI_API_KEY` via `define`.
- Runtime reads `process.env.API_KEY` — see `validateApiKey()` in `services/gemini.ts`.
- If no key is present at load, `ApiModal` (`components/modals/ApiModal.tsx`) lets the user
  paste one, which sets `process.env.API_KEY` in-memory for the session.
- **Never edit `.env` directly** — a PreToolUse hook blocks it. Change `env.example` instead.

## Architecture

- `App.tsx` — root: holds `script`, `transcript`, `config` state; wires the sidebar
  (Source / Config tabs) to `TranscriptViewer`.
- `services/gemini.ts` — all Gemini calls. Public entry points:
  - `generateDebateStream()` — streams the transcript chunk-by-chunk into the UI.
  - `generatePodcastName()` — one-shot name generation (with `PodcastNameParser`).
  - `generatePodcastAudio()` — segments the transcript, builds safe chunks, and renders
    each via TTS with retry/backoff, concatenating `AudioBuffer`s.
- `services/prompts.ts` — `buildSystemPrompt` / `buildNamingPrompt` / `buildAudioPrompt`.
- `lib/utils.ts` — transcript cleaning, parsing to segments, chunking (`CHUNK_SIZE = 600`).
- `lib/audioUtils.ts` — base64 audio decode, silence generation, buffer concatenation
  (`AUDIO_SAMPLE_RATE = 24000`).
- `hooks/useLocalStorage.ts` — persists `PodcastConfig` under the `df_config` key.
- `hooks/useLogger.ts` + `DebugModal` — in-memory request/response/error log (the bug icon
  in the header opens it). Every Gemini call is logged via the `Logger` callback.
- `constants.ts` — `DEFAULT_CONFIG`, `VOICE_PROFILES` (Gemini prebuilt voices), dropdown `OPTIONS`.
- `types.ts` — shared types; `PodcastConfig` is the central config shape.

## Conventions

- Import alias `@/*` maps to the repo root (`tsconfig.json` + `vite.config.ts`).
- `services/gemini.ts` deliberately uses small single-responsibility helpers/classes
  (`PodcastNameParser`, `TTSFormatter`, `LoggerCallbackHandler`, `withErrorHandling`).
  Match that style when extending it.
- Speaker tags in transcripts use `**[Name]**`; `TTSFormatter` rewrites them to `Name:`
  before TTS. Keep that contract if you touch prompts or parsing.
