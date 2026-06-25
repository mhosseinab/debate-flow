import { describe, it, expect } from "vitest";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { runDebateGraph } from "./debateGraph";
import { sampleConfig } from "../test/fixtures";

// A fake chat model standing in for the seam — streams a valid tagged transcript.
function fakeModelFactory(chunks: string[]) {
  const model = {
    withConfig() {
      return model;
    },
    async stream() {
      async function* gen() {
        for (const c of chunks) yield { content: c };
      }
      return gen();
    },
  };
  return async () => model as never;
}

describe("debate graph wiring", () => {
  it("streams tokens to onToken and returns the accumulated transcript", async () => {
    const tokens: string[] = [];
    const { transcript } = await runDebateGraph(
      { inputScript: "Some source article about energy.", config: sampleConfig, apiKey: "k" },
      { onToken: (t) => tokens.push(t) },
      { createChatModel: fakeModelFactory(["**[Alex]** Hello ", "world"]) },
    );

    expect(tokens).toEqual(["**[Alex]** Hello ", "world"]);
    expect(transcript).toBe("**[Alex]** Hello world");
  });

  it("never exposes the BYOK apiKey to callbacks/tracers", async () => {
    // The LangSmith tracer serializes run inputs; the BYOK key must never reach it.
    // Capture every chain-start input the callbacks see and assert the key is absent.
    const seen: unknown[] = [];
    class InputCapturingHandler extends BaseCallbackHandler {
      name = "InputCapturingHandler";
      async handleChainStart(_chain: unknown, inputs: unknown) {
        seen.push(inputs);
      }
    }

    await runDebateGraph(
      { inputScript: "Some source article about energy.", config: sampleConfig, apiKey: "super-secret-key" },
      { callbacks: [new InputCapturingHandler()] },
      { createChatModel: fakeModelFactory(["**[Alex]** Hi.\n\n**[Sarah]** Hello."]) },
    );

    expect(JSON.stringify(seen)).not.toContain("super-secret-key");
  });

  it("aborts when the input guard fails (empty source)", async () => {
    const { transcript, error } = await runDebateGraph(
      { inputScript: "  ", config: sampleConfig, apiKey: "k" },
      {},
      { createChatModel: fakeModelFactory(["**[Alex]** should not run"]) },
    );
    expect(error).toBeTruthy();
    expect(transcript).toBe("");
  });
});

describe("output guard repair loop", () => {
  // First attempt produces tagless output (guard fails); the repair attempt fixes it.
  function repairingFactory() {
    let calls = 0;
    const model = {
      withConfig() {
        return model;
      },
      async stream() {
        calls += 1;
        const text = calls === 1 ? "no speaker tags here" : "**[Alex]** Hi.\n\n**[Sarah]** Hello.";
        async function* gen() {
          yield { content: text };
        }
        return gen();
      },
    };
    return async () => model as never;
  }

  it("repairs once then passes, resetting the stream on each attempt", async () => {
    let resetCount = 0;
    const { transcript, guard } = await runDebateGraph(
      { inputScript: "A valid source script about climate.", config: sampleConfig, apiKey: "k" },
      { onToken: () => {}, onReset: () => { resetCount += 1; } },
      { createChatModel: repairingFactory() },
    );

    expect(transcript).toContain("**[Alex]**");
    expect(guard?.ok).toBe(true);
    expect(resetCount).toBe(2); // initial attempt + one repair
  });
});
