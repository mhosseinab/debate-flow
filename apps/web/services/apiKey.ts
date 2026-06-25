// BYOK provider-key resolution + persistence.
//
// Resolution order:
//   1. Key the user pasted into ApiModal, persisted in the browser (localStorage).
//   2. Dev-only env fallback (import.meta.env.VITE_GEMINI_API_KEY) for local testing.
//
// The env fallback is gated on import.meta.env.DEV so the secret is NEVER inlined
// into a production build: in a prod build `import.meta.env.DEV` is the literal
// `false`, the ternary folds to `undefined`, and the VITE_GEMINI_API_KEY reference
// is dropped entirely. The production bundle therefore contains no key.
const STORAGE_KEY = "df_api_key";

const devEnvKey = (): string | undefined =>
    import.meta.env.DEV ? import.meta.env.VITE_GEMINI_API_KEY : undefined;

const storedKey = (): string | null => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null; // localStorage may be unavailable (private mode / SSR)
    }
};

export const getApiKey = (): string => {
    const key = storedKey() || devEnvKey();
    if (!key) throw new Error("API Key missing");
    return key;
};

export const setApiKey = (key: string): void => {
    try {
        localStorage.setItem(STORAGE_KEY, key);
    } catch {
        // Quota exceeded or storage disabled (Safari private mode). Surface a clear
        // error so the caller can keep the modal open instead of falsely reporting
        // the key as saved — the old in-memory assignment could never throw.
        throw new Error(
            "Couldn't save your API key — browser storage is unavailable (private mode or full).",
        );
    }
};

export const hasApiKey = (): boolean => Boolean(storedKey() || devEnvKey());

/** For pre-filling editable UI fields with the currently resolved key. */
export const getInitialApiKeyValue = (): string => storedKey() || devEnvKey() || "";
