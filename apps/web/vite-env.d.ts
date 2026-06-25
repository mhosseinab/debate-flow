// Typing for the Vite client env. tsconfig pins `types` to ["node"], so the
// import.meta.env shape is declared here rather than via "vite/client".
interface ImportMetaEnv {
    readonly DEV: boolean;
    readonly PROD: boolean;
    /** Dev-only convenience key for the web app. Never inlined into prod builds. */
    readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
