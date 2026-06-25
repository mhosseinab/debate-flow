import { StateGraph, START, END } from "@langchain/langgraph/web";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { RunnableConfig } from "@langchain/core/runnables";
import { DebateState } from "./state";
import { buildSystemPrompt } from "../prompts";
import { createChatModel as defaultCreateChatModel } from "../providers/chatModel";
import type { ProviderConfig } from "../providers/types";
import type { PodcastConfig } from "../types";
import { checkInput } from "../guards/inputGuard";
import { checkOutput } from "../guards/outputGuard";
import type { GuardResult } from "../guards/types";

const MAX_REPAIRS = 1;

// Dependency seam for the graph: tests inject a fake model factory; production uses
// the provider seam.
export interface DebateGraphDeps {
  createChatModel?: (cfg: ProviderConfig) => Promise<BaseChatModel>;
}

export interface RunDebateOptions {
  /** Called with each streamed token, preserving the live-transcript UX. */
  onToken?: (token: string) => void;
  /** Called at the start of each (re)generation attempt so the UI can clear before re-streaming. */
  onReset?: () => void;
  /** LangChain callbacks (e.g. the request/response logger). */
  callbacks?: BaseCallbackHandler[];
}

interface Configurable {
  onToken?: (token: string) => void;
  onReset?: () => void;
}

export function buildDebateGraph(deps: DebateGraphDeps = {}) {
  const createModel = deps.createChatModel ?? defaultCreateChatModel;

  // Guard: validate the source before spending a generation.
  const inputGuard = (state: typeof DebateState.State) => {
    const result = checkInput(state.inputScript);
    if (!result.ok) {
      const message = result.issues.find((i) => i.severity === "error")?.message ?? "Invalid input.";
      return { error: message };
    }
    return {};
  };

  const generateTranscript = async (
    state: typeof DebateState.State,
    config?: RunnableConfig,
  ) => {
    const { onToken, onReset } = (config?.configurable ?? {}) as Configurable;
    onReset?.();

    const model = await createModel({ ...state.config.llm, apiKey: state.apiKey });

    let system = await buildSystemPrompt(state.config);
    if (state.repairAttempts > 0 && state.guard) {
      const problems = state.guard.issues.map((i) => i.message).join("; ");
      system += `\n\n[FORMAT CORRECTION] The previous draft had these problems: ${problems}. Regenerate it correctly. Use **[SpeakerName]** tags exactly, with only the configured speakers.`;
    }

    let transcript = "";
    // Pass the node's config so callbacks (logger + LangSmith tracer) propagate to the model.
    const stream = await model.stream(
      [new SystemMessage(system), new HumanMessage(state.inputScript)],
      config,
    );
    for await (const chunk of stream) {
      const content = chunk.content?.toString();
      if (content) {
        transcript += content;
        onToken?.(content);
      }
    }
    return { transcript };
  };

  const outputGuard = (state: typeof DebateState.State) => ({
    guard: checkOutput(state.transcript, state.config),
  });

  const repair = (state: typeof DebateState.State) => ({
    repairAttempts: state.repairAttempts + 1,
  });

  const routeAfterInput = (state: typeof DebateState.State) => (state.error ? "abort" : "generate");

  const routeAfterOutput = (state: typeof DebateState.State) => {
    if (state.guard?.ok) return "ok";
    if (state.repairAttempts >= MAX_REPAIRS) return "giveup";
    return "repair";
  };

  return new StateGraph(DebateState)
    .addNode("inputGuard", inputGuard)
    .addNode("generateTranscript", generateTranscript)
    .addNode("outputGuard", outputGuard)
    .addNode("repair", repair)
    .addEdge(START, "inputGuard")
    .addConditionalEdges("inputGuard", routeAfterInput, { generate: "generateTranscript", abort: END })
    .addEdge("generateTranscript", "outputGuard")
    .addConditionalEdges("outputGuard", routeAfterOutput, { ok: END, repair: "repair", giveup: END })
    .addEdge("repair", "generateTranscript")
    .compile();
}

export async function runDebateGraph(
  input: { inputScript: string; config: PodcastConfig; apiKey: string },
  options: RunDebateOptions = {},
  deps?: DebateGraphDeps,
): Promise<{ transcript: string; guard?: GuardResult; error?: string }> {
  const graph = buildDebateGraph(deps);
  const result = await graph.invoke(input, {
    // Top-level callbacks trace the whole graph run and propagate to the model.
    callbacks: options.callbacks,
    configurable: {
      onToken: options.onToken,
      onReset: options.onReset,
    },
  });
  return { transcript: result.transcript, guard: result.guard, error: result.error };
}
