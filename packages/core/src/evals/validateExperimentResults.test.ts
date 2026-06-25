import { describe, expect, it } from "vitest";
import type { Example, Run } from "langsmith/schemas";
import type { ExperimentResultRow } from "langsmith/evaluation";
import { validateExperimentResults } from "./validateExperimentResults";

const example: Example = {
  id: "ex",
  dataset_id: "d",
  inputs: { source: "test" },
  created_at: "2026-01-01T00:00:00.000Z",
  runs: [],
};

function row(run: Run, evaluationResults: ExperimentResultRow["evaluationResults"]): ExperimentResultRow {
  return { run, example, evaluationResults };
}

describe("validateExperimentResults", () => {
  it("passes when every example has a transcript and all evaluator keys", () => {
    const rows = [
      row(
        {
          id: "r1",
          name: "target",
          run_type: "chain",
          inputs: {},
          outputs: { transcript: "**[Alex]** Hello" },
        },
        {
          results: [
            { key: "faithfulness", score: 1 },
            { key: "format_compliance", score: 1 },
            { key: "config_adherence", score: 1 },
            { key: "safety", score: 1 },
          ],
        },
      ),
    ];

    expect(validateExperimentResults(rows, 1)).toEqual([]);
  });

  it("fails when row count is below the dataset size", () => {
    expect(validateExperimentResults([], 3)).toEqual([
      { exampleIndex: -1, message: "Expected 3 experiment rows, got 0" },
    ]);
  });

  it("fails when the target run recorded an error", () => {
    const failures = validateExperimentResults(
      [
        row(
          {
            id: "r1",
            name: "target",
            run_type: "chain",
            inputs: {},
            error: "429 Too Many Requests",
          },
          { results: [] },
        ),
      ],
      1,
    );

    expect(failures).toEqual([{ exampleIndex: 0, message: "Target run failed: 429 Too Many Requests" }]);
  });

  it("fails when evaluator scores are missing", () => {
    const failures = validateExperimentResults(
      [
        row(
          {
            id: "r1",
            name: "target",
            run_type: "chain",
            inputs: {},
            outputs: { transcript: "**[Alex]** Hello" },
          },
          { results: [{ key: "format_compliance", score: 1 }] },
        ),
      ],
      1,
    );

    expect(failures.map((f) => f.message)).toEqual([
      'Missing evaluator score "faithfulness" (evaluator likely errored)',
      'Missing evaluator score "config_adherence" (evaluator likely errored)',
      'Missing evaluator score "safety" (evaluator likely errored)',
    ]);
  });
});
