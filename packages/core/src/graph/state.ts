import { Annotation } from "@langchain/langgraph/web";
import type { PodcastConfig } from "../types";
import type { GuardResult } from "../guards/types";

const replace = <T>() => ({ reducer: (_prev: T, next: T) => next });

// Debate graph state. inputScript/config are runtime inputs; the rest are produced
// by nodes. The BYOK apiKey is deliberately NOT a state channel: graph inputs are
// serialized by the LangSmith tracer, so the key is bound via closure in
// runDebateGraph (see debateGraph.ts) and never enters traced state.
export const DebateState = Annotation.Root({
  inputScript: Annotation<string>(),
  config: Annotation<PodcastConfig>(),
  transcript: Annotation<string>({ ...replace<string>(), default: () => "" }),
  guard: Annotation<GuardResult | undefined>({
    ...replace<GuardResult | undefined>(),
    default: () => undefined,
  }),
  repairAttempts: Annotation<number>({ ...replace<number>(), default: () => 0 }),
  error: Annotation<string | undefined>({
    ...replace<string | undefined>(),
    default: () => undefined,
  }),
});
