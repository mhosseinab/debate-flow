import { type Evaluator, type EvalScore, clamp01 } from "../types";

const WORDS_PER_MINUTE = 150;

// Deterministic length signal: how close the transcript is to the target duration.
function lengthScore(transcript: string, durationMinutes: number): number {
  const expected = durationMinutes * WORDS_PER_MINUTE;
  if (expected <= 0) return 1;
  const actual = transcript.trim().split(/\s+/).filter(Boolean).length;
  return clamp01(1 - Math.abs(actual - expected) / expected);
}

// Blends a deterministic length signal with an LLM judgement of tone/language/pacing.
export const configAdherence: Evaluator = async (input, judge): Promise<EvalScore> => {
  const { config } = input;
  const verdict = await judge.evaluate({
    instructions:
      `Check whether the TRANSCRIPT matches the requested settings — tone: "${config.tone}", ` +
      `language: "${config.language}", pacing: "${config.pacing}", speaker balance: "${config.speakerBalance}". ` +
      "Score 1 if it matches all of them, lower for each mismatch.",
    payload: `TRANSCRIPT:\n${input.transcript}`,
  });
  const len = lengthScore(input.transcript, config.duration);
  const score = clamp01(0.6 * verdict.score + 0.4 * len);
  return {
    key: "config_adherence",
    score,
    comment: `tone/lang/pacing=${verdict.score.toFixed(2)}, length=${len.toFixed(2)}${verdict.comment ? ` — ${verdict.comment}` : ""}`,
  };
};
