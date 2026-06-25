import type { Evaluator, EvalScore } from "../types";
import { checkOutput } from "../../guards/outputGuard";

// Deterministic: reuses the output guard. Errors -> 0, warnings -> 0.5, clean -> 1.
export const formatCompliance: Evaluator = async ({ transcript, config }): Promise<EvalScore> => {
  const result = checkOutput(transcript, config);
  const hasError = result.issues.some((i) => i.severity === "error");
  const hasWarn = result.issues.some((i) => i.severity === "warn");
  const score = hasError ? 0 : hasWarn ? 0.5 : 1;
  return {
    key: "format_compliance",
    score,
    comment: result.issues.length ? result.issues.map((i) => i.message).join("; ") : "Well-formed.",
  };
};
