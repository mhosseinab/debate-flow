import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { createLangSmithClient } from "./client";

export interface LangSmithOptions {
  /** BYOK: the user's own LangSmith API key. */
  apiKey: string;
  /** Project to record traces under; defaults to the LangSmith "default" project. */
  project?: string;
  /** Override the ingest endpoint (e.g. EU region). */
  endpoint?: string;
}

/**
 * Builds a LangSmith tracer callback. Browser-safe (BYOK): the LangSmith ingest
 * endpoint sends permissive CORS, so the user's browser can post traces directly to
 * their own LangSmith project, where online evaluators (Run Rules) score live traffic.
 */
export function createLangSmithTracer(opts: LangSmithOptions): BaseCallbackHandler {
  const client = createLangSmithClient({ apiKey: opts.apiKey, apiUrl: opts.endpoint });
  return new LangChainTracer({ client, projectName: opts.project });
}
