import { describe, it, expect } from "vitest";
import { faithfulness, formatCompliance, configAdherence, safety } from "./evaluators";
import type { Judge } from "./types";
import { sampleConfig } from "../test/fixtures";

// Fake judge — returns a fixed score and records the criteria it was asked.
function fakeJudge(score: number): Judge & { lastInstructions?: string } {
  const j: Judge & { lastInstructions?: string } = {
    async evaluate({ instructions }) {
      j.lastInstructions = instructions;
      return { score, comment: "fake" };
    },
  };
  return j;
}

const source = "Solar and wind costs have fallen sharply over the last decade.";
const goodTranscript = "**[Alex]** Renewables got cheaper.\n\n---\n\n**[Sarah]** Costs fell a lot.";

describe("formatCompliance (deterministic)", () => {
  it("scores 1 for a well-formed transcript", async () => {
    const r = await formatCompliance({ source, transcript: goodTranscript, config: sampleConfig }, fakeJudge(0));
    expect(r.key).toBe("format_compliance");
    expect(r.score).toBe(1);
  });

  it("scores 0 when there are no speaker tags", async () => {
    const r = await formatCompliance({ source, transcript: "no tags here", config: sampleConfig }, fakeJudge(0));
    expect(r.score).toBe(0);
  });

  it("scores 0.5 for warn-level issues (unknown speaker)", async () => {
    const r = await formatCompliance(
      { source, transcript: "**[Mallory]** hi", config: sampleConfig },
      fakeJudge(0),
    );
    expect(r.score).toBe(0.5);
  });
});

describe("faithfulness (judge passthrough)", () => {
  it("maps the judge score through", async () => {
    const judge = fakeJudge(0.8);
    const r = await faithfulness({ source, transcript: goodTranscript, config: sampleConfig }, judge);
    expect(r.score).toBe(0.8);
    expect(judge.lastInstructions).toMatch(/faithful/i);
  });
});

describe("configAdherence (blend)", () => {
  it("blends judge tone score with a deterministic length signal", async () => {
    const r = await configAdherence({ source, transcript: goodTranscript, config: sampleConfig }, fakeJudge(1));
    // 0.6 * 1 + 0.4 * lengthScore; short transcript vs 5-min target -> length near 0.
    expect(r.score).toBeGreaterThanOrEqual(0.6);
    expect(r.score).toBeLessThanOrEqual(1);
  });
});

describe("safety (heuristic cap)", () => {
  it("passes a clean transcript through the judge score", async () => {
    const r = await safety({ source, transcript: goodTranscript, config: sampleConfig }, fakeJudge(0.9));
    expect(r.score).toBeCloseTo(0.9);
  });

  it("caps the score when fabricated authority is detected, even if the judge is lenient", async () => {
    const r = await safety(
      { source, transcript: "**[Alex]** According to a study by Dr. Smith, this is certain.", config: sampleConfig },
      fakeJudge(1),
    );
    expect(r.score).toBeLessThanOrEqual(0.3);
  });
});
