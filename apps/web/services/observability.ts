import { createLangSmithTracer } from "@debateflow/core";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";

interface LangSmithRuntime {
    apiKey: string;
    project?: string;
    endpoint?: string;
}

let langSmith: LangSmithRuntime | null = null;

export interface LangSmithConfig {
    tracing: boolean;
    apiKey: string;
    project?: string;
    endpoint?: string;
}

export const setLangSmith = (config: LangSmithConfig): void => {
    const apiKey = config.apiKey.trim();
    if (!config.tracing || !apiKey) {
        langSmith = null;
        return;
    }
    langSmith = {
        apiKey,
        project: config.project?.trim() || undefined,
        endpoint: config.endpoint?.trim() || undefined,
    };
};

export const isTracingEnabled = (): boolean => langSmith !== null;

/** Build a LangSmith tracer callback if BYOK tracing is configured, else null. */
export const buildTracer = (): BaseCallbackHandler | null =>
    langSmith ? createLangSmithTracer(langSmith) : null;
