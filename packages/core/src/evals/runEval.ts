/*
 * Offline eval harness — WIRED BUT UNVERIFIED in this environment.
 *
 * It requires live keys and therefore is NOT run by `pnpm test`:
 *   GEMINI_API_KEY   — target (transcript generation) + LLM judge
 *   LANGSMITH_API_KEY, LANGSMITH_TRACING=true — to record the experiment
 *
 * Run with:  pnpm --filter @debateflow/core eval
 *
 * The evaluator *logic* (./evaluators) is fully unit-tested with a fake judge;
 * this file is only the thin LangSmith `evaluate()` glue around it.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "langsmith";
import { evaluate } from "langsmith/evaluation";
import type { Run, Example } from "langsmith/schemas";
import { runDebateGraph } from "../graph/debateGraph";
import { createJudgeFromConfig } from "./judge";
import { ALL_EVALUATORS } from "./evaluators";
import type { PodcastConfig } from "../types";
import type { ProviderConfig } from "../providers/types";

const here = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(here, "datasets/seed.json"), "utf8")) as { source: string }[];

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
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Set GEMINI_API_KEY to run the eval suite.");

  // Idempotently upload the seed dataset, then evaluate by name.
  const client = new Client();
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

  await evaluate(target, { data: DATASET_NAME, evaluators, experimentPrefix: "debateflow-offline" });
}

// Direct-run entrypoint (`tsx runEval.ts`).
runEvalSuite().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
