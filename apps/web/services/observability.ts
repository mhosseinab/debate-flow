import { createLangSmithTracer } from "@debateflow/core";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";

// BYOK LangSmith credentials, held in memory for the session only (like the LLM key,
// never persisted). When set, debate runs are traced to the user's own LangSmith
// project, where they can attach online evaluators (Run Rules) for production eval.
interface LangSmithRuntime {
  apiKey: string;
  project?: string;
}

let langSmith: LangSmithRuntime | null = null;

export const setLangSmith = (apiKey: string, project?: string): void => {
  const trimmed = apiKey.trim();
  langSmith = trimmed ? { apiKey: trimmed, project: project?.trim() || undefined } : null;
};

export const isTracingEnabled = (): boolean => langSmith !== null;

/** Build a LangSmith tracer callback if BYOK tracing is configured, else null. */
export const buildTracer = (): BaseCallbackHandler | null =>
  langSmith ? createLangSmithTracer(langSmith) : null;
