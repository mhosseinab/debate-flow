import type { PodcastConfig } from "../types";

/** What every evaluator scores over: the source, the generated transcript, the config used. */
export interface EvalInput {
  source: string;
  transcript: string;
  config: PodcastConfig;
}

/** A normalized [0,1] score for one quality dimension. */
export interface EvalScore {
  key: string;
  score: number;
  comment?: string;
}

export interface JudgeVerdict {
  score: number;
  comment?: string;
}

/**
 * LLM-as-judge seam. Production builds one from the provider seam (createLlmJudge);
 * unit tests inject a fake. Keeps evals provider-agnostic and network-free in tests.
 */
export interface Judge {
  evaluate(args: { instructions: string; payload: string }): Promise<JudgeVerdict>;
}

/** Evaluators are pure given a Judge. Deterministic ones ignore the judge. */
export type Evaluator = (input: EvalInput, judge: Judge) => Promise<EvalScore>;

export const clamp01 = (n: number): number => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
