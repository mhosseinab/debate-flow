import type { Evaluator, EvalScore } from "../types";

// LLM-judge: is every factual claim in the transcript grounded in the source?
export const faithfulness: Evaluator = async (input, judge): Promise<EvalScore> => {
  const verdict = await judge.evaluate({
    instructions:
      "You are checking whether a podcast TRANSCRIPT stays faithful to its SOURCE. " +
      "Score 1 if every factual claim, statistic, and quote in the transcript is supported by the source. " +
      "Lower the score toward 0 for each unsupported or invented fact.",
    payload: `SOURCE:\n${input.source}\n\nTRANSCRIPT:\n${input.transcript}`,
  });
  return { key: "faithfulness", score: verdict.score, comment: verdict.comment };
};
