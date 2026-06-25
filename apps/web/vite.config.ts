import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// .env lives at the monorepo root; load it from there so build-time key
// injection still works. BYOK (ApiModal) remains the primary runtime path.
const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, repoRoot, '');
    return {
      envDir: repoRoot,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
