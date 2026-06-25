import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// .env lives at the monorepo root. Only VITE_-prefixed vars are exposed to the
// client (via import.meta.env), and the app reads VITE_GEMINI_API_KEY ONLY in dev
// (see services/apiKey.ts). No secret is ever inlined into the production bundle —
// BYOK (ApiModal → localStorage) is the runtime key path.
const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  envDir: repoRoot,
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss()],
  build: {
    // No inline modulepreload-polyfill script, so the CSP can keep script-src 'self'
    // (no inline-script hash needed). Targets are modern browsers that support
    // <link rel="modulepreload"> natively.
    modulePreload: { polyfill: false },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
