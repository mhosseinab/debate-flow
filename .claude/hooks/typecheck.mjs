// Stop hook: typecheck the project once Claude finishes a turn.
// This is the only safety net — the project has no tests, linter, or build step
// in CI. Runs `tsc --noEmit` and surfaces any errors back to Claude.
import { execSync } from 'node:child_process';

try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  process.exit(0);
} catch (e) {
  const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  console.error('TypeScript check failed:\n' + out);
  process.exit(2); // exit 2 → feed errors back to Claude to fix
}
