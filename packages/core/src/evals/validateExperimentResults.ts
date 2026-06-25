import type { ExperimentResultRow } from "langsmith/evaluation";

/** Keys returned by ALL_EVALUATORS — kept in sync with evaluator implementations. */
export const EXPECTED_EVALUATOR_KEYS = [
  "faithfulness",
  "format_compliance",
  "config_adherence",
  "safety",
] as const;

export interface EvalValidationFailure {
  exampleIndex: number;
  message: string;
}

/**
 * LangSmith `evaluate()` logs target/evaluator errors but does not throw.
 * CI must treat incomplete runs as a hard failure.
 */
export function validateExperimentResults(
  rows: ExperimentResultRow[],
  expectedExampleCount: number,
): EvalValidationFailure[] {
  const failures: EvalValidationFailure[] = [];

  if (rows.length < expectedExampleCount) {
    failures.push({
      exampleIndex: -1,
      message: `Expected ${expectedExampleCount} experiment rows, got ${rows.length}`,
    });
  }

  for (const [index, { run, evaluationResults }] of rows.entries()) {
    if (run.error) {
      failures.push({
        exampleIndex: index,
        message: `Target run failed: ${run.error}`,
      });
      continue;
    }

    const transcript = run.outputs?.transcript;
    if (typeof transcript !== "string" || transcript.trim().length === 0) {
      failures.push({
        exampleIndex: index,
        message: "Target run produced no transcript",
      });
      continue;
    }

    const scoredKeys = new Set(evaluationResults.results.map((r) => r.key));
    for (const key of EXPECTED_EVALUATOR_KEYS) {
      if (!scoredKeys.has(key)) {
        failures.push({
          exampleIndex: index,
          message: `Missing evaluator score "${key}" (evaluator likely errored)`,
        });
      }
    }
  }

  return failures;
}

export function formatEvalValidationFailures(failures: EvalValidationFailure[]): string {
  return failures
    .map((f) => (f.exampleIndex < 0 ? f.message : `Example ${f.exampleIndex + 1}: ${f.message}`))
    .join("\n");
}
