import { DEFAULT_LANGSMITH_ENDPOINT } from "@debateflow/core";
import { setLangSmith } from "./observability";

export interface LangSmithSettings {
    tracing: boolean;
    endpoint: string;
    apiKey: string;
    project: string;
}

export const DEFAULT_LANGSMITH_SETTINGS: LangSmithSettings = {
    tracing: true,
    endpoint: DEFAULT_LANGSMITH_ENDPOINT,
    apiKey: "",
    project: "debate-flow",
};

const STORAGE_KEY = "df_langsmith";

const readStored = (): Partial<LangSmithSettings> | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Partial<LangSmithSettings>) : null;
    } catch {
        return null;
    }
};

export const getLangSmithSettings = (): LangSmithSettings => ({
    ...DEFAULT_LANGSMITH_SETTINGS,
    ...readStored(),
});

export const setLangSmithSettings = (settings: LangSmithSettings): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applyLangSmithSettings(settings);
};

/** Apply persisted (or explicit) settings to the in-memory tracer builder. */
export const applyLangSmithSettings = (settings = getLangSmithSettings()): void => {
    setLangSmith({
        tracing: settings.tracing,
        apiKey: settings.apiKey,
        project: settings.project,
        endpoint: settings.endpoint,
    });
};
