import { Annotation } from "@langchain/langgraph/web";
import type { PodcastConfig } from "../types";
import type { GuardResult } from "../guards/types";

const replace = <T>() => ({ reducer: (_prev: T, next: T) => next });

// Debate graph state. inputScript/config/apiKey are runtime inputs; the rest are
// produced by nodes. apiKey is transient (BYOK) and never persisted.
export const DebateState = Annotation.Root({
  inputScript: Annotation<string>(),
  config: Annotation<PodcastConfig>(),
  apiKey: Annotation<string>(),
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
