export type GuardSeverity = "error" | "warn";

export interface GuardIssue {
  code: string;
  message: string;
  severity: GuardSeverity;
}

export interface GuardResult {
  /** ok = no error-severity issues (warnings are allowed). */
  ok: boolean;
  issues: GuardIssue[];
}

export function summarize(result: GuardResult): GuardResult {
  return { ok: !result.issues.some((i) => i.severity === "error"), issues: result.issues };
}
