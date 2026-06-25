/*
 * Offline eval harness — WIRED BUT UNVERIFIED in this environment.
 *
 * It requires live keys and therefore is NOT run by `pnpm test`:
 *   GEMINI_API_KEY   — target (transcript generation) + LLM judge
 *   LANGSMITH_API_KEY, LANGSMITH_TRACING=true — to record the experiment
 *   LANGSMITH_ENDPOINT (optional; defaults to EU), LANGSMITH_WORKSPACE_ID (org keys)
 *
 * Run with:  pnpm --filter @debateflow/core eval
 *
 * The evaluator *logic* (./evaluators) is fully unit-tested with a fake judge;
 * this file is only the thin LangSmith `evaluate()` glue around it.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseEnv } from "node:util";
import { evaluate } from "langsmith/evaluation";
import type { Run, Example } from "langsmith/schemas";
import { createLangSmithClient } from "../observability/client";
import { runDebateGraph } from "../graph/debateGraph";
import { createJudgeFromConfig } from "./judge";
import { ALL_EVALUATORS } from "./evaluators";
import {
  formatEvalValidationFailures,
  validateExperimentResults,
} from "./validateExperimentResults";
import type { PodcastConfig } from "../types";
import type { ProviderConfig, ChatProviderId } from "../providers/types";

const here = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(here, "datasets/seed.json"), "utf8")) as { source: string }[];
const repoEnvPath = join(here, "../../../../.env");

/**
 * Node eval runs via tsx (outside Vite), so root `.env` is not auto-loaded.
 * Load it explicitly so local `pnpm eval` behaves like the documented setup.
 */
function loadRepoEnvIfPresent(): void {
  if (!existsSync(repoEnvPath)) return;
  // Force `.env` to win over any pre-existing shell export of the same var.
  // This intentionally inverts standard dotenv precedence (where a real env
  // var beats `.env`): when a local `.env` is present it is the source of
  // truth, so a stale `export GEMINI_API_KEY=...` in the user's shell can't
  // silently shadow it. CI has no `.env`, so the early return above leaves its
  // injected env vars untouched.
  const parsed = parseEnv(readFileSync(repoEnvPath, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string") process.env[key] = value;
  }
}

/** Local debug: confirm a secret loaded without printing it in full. */
function maskSecret(value: string): string {
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}…${value.slice(-4)} (${value.length} chars)`;
}

// Per-provider defaults + the env var that carries each provider's key.
const PROVIDER_DEFAULTS: Record<ChatProviderId, { model: string; keyEnv: string }> = {
  "google-genai": { model: "gemini-2.5-flash", keyEnv: "GEMINI_API_KEY" },
  openai: { model: "gpt-4o-mini", keyEnv: "OPENAI_API_KEY" },
  deepseek: { model: "deepseek-chat", keyEnv: "DEEPSEEK_API_KEY" },
};

/**
 * Resolve the eval's chat provider from env (default Gemini). `EVAL_PROVIDER`
 * picks the provider, `EVAL_MODEL` overrides its default model, `EVAL_BASE_URL`
 * targets a custom OpenAI-compatible endpoint. Lets the suite run on DeepSeek/
 * OpenAI when the Gemini free-tier quota is exhausted.
 */
function resolveLlm(): { llm: ProviderConfig; apiKey: string | undefined; keySource: string } {
  // Unset GitHub Actions `vars`/`secrets` expand to "" (not undefined), so treat
  // empty strings as unset — otherwise `?? default` is skipped and e.g. an empty
  // EVAL_BASE_URL would override a provider's default endpoint.
  const env = (name: string): string | undefined => {
    const v = process.env[name];
    return v && v.length > 0 ? v : undefined;
  };
  const provider = (env("EVAL_PROVIDER") ?? "google-genai") as ChatProviderId;
  const defaults = PROVIDER_DEFAULTS[provider];
  if (!defaults) throw new Error(`Unknown EVAL_PROVIDER "${provider}". Known: ${Object.keys(PROVIDER_DEFAULTS).join(", ")}`);
  // Gemini keeps its historical API_KEY fallback; others read only their own var.
  const apiKey = env(defaults.keyEnv) ?? (provider === "google-genai" ? env("API_KEY") : undefined);
  const llm: ProviderConfig = {
    provider,
    model: env("EVAL_MODEL") ?? defaults.model,
    baseURL: env("EVAL_BASE_URL"),
    temperature: 0.8,
    maxOutputTokens: 8192,
    maxRetries: 3,
  };
  return { llm, apiKey, keySource: apiKey ? defaults.keyEnv : "(none)" };
}

// Canonical config used for the eval target (matches the app defaults).
const evalConfig: PodcastConfig = {
  podcastName: "Mind Matters", duration: 5, tone: "Neutral & Balanced",
  format: "Standard Debate (2 Sides)", audience: "General Public", language: "English",
  introStyle: "Standard Welcome", pacing: "Conversational (Default)",
  speaker1Name: "Alex", speaker1Gender: "Male", speaker1Voice: "Puck",
  speaker2Name: "Sarah", speaker2Gender: "Female", speaker2Voice: "Kore",
  speakerBalance: "Balanced (50/50)", soundDesign: "Standard (Transitions)",
  musicGenre: "Lo-Fi / Chill", vocabularyLevel: "Accessible",
  conclusionStyle: "Thought Provoking Question",
  generateShowNotes: false, generateViralClip: false, criticalAnalysis: false, customPrompt: "",
  llm: { provider: "google-genai", model: "gemini-2.5-flash", temperature: 0.8, maxOutputTokens: 8192, maxRetries: 3 },
  tts: { provider: "google-genai", model: "gemini-2.5-flash-preview-tts" },
};

const DATASET_NAME = "debateflow-seed";

export async function runEvalSuite(): Promise<void> {
  loadRepoEnvIfPresent();

  const { llm, apiKey, keySource } = resolveLlm();
  evalConfig.llm = llm;

  console.log("[eval] env", {
    dotenv: existsSync(repoEnvPath) ? repoEnvPath : "(missing)",
    provider: llm.provider,
    model: llm.model,
    baseURL: llm.baseURL ?? "(provider default)",
    apiKey: apiKey ? maskSecret(apiKey) : "(unset)",
    apiKeySource: keySource,
    langsmithApiKey: process.env.LANGSMITH_API_KEY ? maskSecret(process.env.LANGSMITH_API_KEY) : "(unset)",
    langsmithEndpoint: process.env.LANGSMITH_ENDPOINT ?? "(default EU)",
    langsmithWorkspaceId: process.env.LANGSMITH_WORKSPACE_ID ?? "(unset)",
  });

  if (!apiKey) {
    throw new Error(`Set ${PROVIDER_DEFAULTS[llm.provider].keyEnv} to run the eval suite with provider "${llm.provider}".`);
  }

  // Idempotently upload the seed dataset, then evaluate by name.
  const client = createLangSmithClient();
  if (!(await client.hasDataset({ datasetName: DATASET_NAME }))) {
    await client.createDataset(DATASET_NAME, { description: "DebateFlow offline eval sources" });
    await client.createExamples(
      seed.map((s) => ({ inputs: { source: s.source }, dataset_name: DATASET_NAME })),
    );
  }

  const judgeConfig: ProviderConfig = { ...evalConfig.llm, apiKey };
  const judge = await createJudgeFromConfig(judgeConfig);

  const target = async (inputs: { source: string }) => {
    const { transcript } = await runDebateGraph({ inputScript: inputs.source, config: evalConfig, apiKey });
    return { transcript };
  };

  const evaluators = ALL_EVALUATORS.map((ev) => async (run: Run, example?: Example) => {
    const input = {
      source: String(example?.inputs?.source ?? ""),
      transcript: String(run.outputs?.transcript ?? ""),
      config: evalConfig,
    };
    return ev(input, judge);
  });

  const experiment = await evaluate(target, {
    data: DATASET_NAME,
    evaluators,
    experimentPrefix: "debateflow-offline",
    client,
  });

  const rows = [...experiment.results];
  const failures = validateExperimentResults(rows, seed.length);
  if (failures.length > 0) {
    throw new Error(
      `Eval suite incomplete (${failures.length} issue${failures.length === 1 ? "" : "s"}):\n${formatEvalValidationFailures(failures)}`,
    );
  }

  console.log(`[eval] passed — ${rows.length} examples, experiment "${experiment.experimentName}"`);
}

// Direct-run entrypoint (`tsx runEval.ts`).
runEvalSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
