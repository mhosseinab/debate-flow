# Evaluation — offline suite + production (online) eval

DebateFlow scores transcripts on four dimensions, defined once in
`packages/core/src/evals/evaluators/` and reused by both the offline suite and the
online production evaluators:

| Dimension | Key | How |
|---|---|---|
| Faithfulness to source | `faithfulness` | LLM judge — claims grounded in the source |
| Format & tag compliance | `format_compliance` | Deterministic (reuses the output guard) |
| Config adherence | `config_adherence` | LLM judge (tone/lang/pacing) blended with a length signal |
| Safety | `safety` | Heuristic cap (fabricated authority) ∧ LLM judge |

The judge is built through the **provider seam** (`createJudgeFromConfig`), so it is
provider-agnostic and BYOK like the rest of the app. In unit tests a fake judge is
injected, so the evaluator logic is fully tested with no network
(`packages/core/src/evals/evaluators.test.ts`).

## Offline suite (CI / local)

Runs the debate graph over `src/evals/datasets/seed.json`, scores each result, and
records a LangSmith experiment.

```bash
export GEMINI_API_KEY=...        # target generation + judge
export LANGSMITH_API_KEY=...     # records the experiment
export LANGSMITH_TRACING=true
pnpm --filter @debateflow/core eval
```

The key never touches the browser here — this is the safe place to spend it.
`runEval.ts` is thin LangSmith `evaluate()` glue; the scoring logic it calls is the
same unit-tested evaluators.

## Production (online) eval — BYOK, in the user's own LangSmith

The app traces live runs to the user's **own** LangSmith project (browser → LangSmith
is CORS-open; the user supplies their LangSmith key in the API modal). To score that
live traffic:

1. In the app's API modal, expand **Production tracing (LangSmith)** and paste a
   LangSmith API key + project name. Debate runs now appear as traces in that project.
2. In LangSmith → the project → **Rules / Automations**, add a rule:
   - **Filter** the runs to score (e.g. the top-level debate run), set a **sampling rate**.
   - Attach **evaluators** for the four dimensions. Mirror the offline rubric (an
     LLM-as-judge evaluator per dimension, plus a code evaluator for
     `format_compliance`).
   - Optionally route low-scoring runs to an **annotation queue** or a **dataset** to
     grow the offline suite.

Because the evaluator definitions are shared code, the offline experiment and the
online rules score transcripts the same way.
