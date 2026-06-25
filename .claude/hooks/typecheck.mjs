// Stop hook: typecheck the workspace once Claude finishes a turn.
// This is the only static safety net besides Vitest. Runs `tsc --noEmit` across
// every workspace package via `pnpm -r typecheck` and surfaces errors back to Claude.
import { execSync } from 'node:child_process';

try {
  execSync('pnpm -r typecheck', { stdio: 'pipe' });
  process.exit(0);
} catch (e) {
  const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  console.error('TypeScript check failed:\n' + out);
  process.exit(2); // exit 2 → feed errors back to Claude to fix
}
