import { Client, type ClientConfig } from "langsmith";

/** Matches the web app's default LangSmith region (see langsmithSettings.ts). */
export const DEFAULT_LANGSMITH_ENDPOINT = "https://eu.api.smith.langchain.com";

/** Resolve LangSmith client config from explicit opts, then env, then EU default. */
export function resolveLangSmithClientConfig(overrides: ClientConfig = {}): ClientConfig {
  return {
    apiKey: overrides.apiKey ?? process.env.LANGSMITH_API_KEY,
    apiUrl: overrides.apiUrl ?? process.env.LANGSMITH_ENDPOINT ?? DEFAULT_LANGSMITH_ENDPOINT,
    workspaceId: overrides.workspaceId ?? process.env.LANGSMITH_WORKSPACE_ID,
  };
}

export function createLangSmithClient(config: ClientConfig = {}): Client {
  return new Client(resolveLangSmithClientConfig(config));
}
