import { type GuardIssue, type GuardResult, summarize } from "./types";

const MIN_LENGTH = 10;
const MAX_LENGTH = 100_000;

// Heuristic prompt-injection markers. Non-fatal (warn) — the system prompt is sent
// as a separate SystemMessage, so these are flagged, not blocked.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all )?previous instructions/i,
  /disregard (the )?(above|previous|system)/i,
  /reveal (the )?system prompt/i,
  /you are now\b/i,
];

/** Validates the raw source script before generation. */
export function checkInput(script: string): GuardResult {
  const issues: GuardIssue[] = [];
  const text = (script ?? "").trim();

  if (text.length === 0) {
    issues.push({ code: "empty", message: "Source script is empty.", severity: "error" });
  } else if (text.length < MIN_LENGTH) {
    issues.push({
      code: "too_short",
      message: `Source script must be at least ${MIN_LENGTH} characters.`,
      severity: "error",
    });
  }

  if (text.length > MAX_LENGTH) {
    issues.push({
      code: "too_long",
      message: `Source script exceeds ${MAX_LENGTH} characters.`,
      severity: "error",
    });
  }

  if (INJECTION_PATTERNS.some((re) => re.test(text))) {
    issues.push({
      code: "prompt_injection",
      message: "Source contains possible prompt-injection phrasing.",
      severity: "warn",
    });
  }

  return summarize({ ok: true, issues });
}
