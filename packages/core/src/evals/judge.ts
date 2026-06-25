import { HumanMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createChatModel } from "../providers/chatModel";
import type { ProviderConfig } from "../providers/types";
import { type Judge, type JudgeVerdict, clamp01 } from "./types";

const RUBRIC =
  'Respond with ONLY a JSON object of the form {"score": <number between 0 and 1>, "comment": "<one short sentence>"}. ' +
  "1 means fully satisfies the criteria, 0 means fails completely.";

function parseVerdict(raw: string): JudgeVerdict {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { score: 0, comment: `Unparseable judge output: ${raw.slice(0, 80)}` };
  try {
    const parsed = JSON.parse(match[0]) as { score?: unknown; comment?: unknown };
    return {
      score: clamp01(typeof parsed.score === "number" ? parsed.score : Number(parsed.score)),
      comment: typeof parsed.comment === "string" ? parsed.comment : undefined,
    };
  } catch {
    return { score: 0, comment: `Invalid judge JSON: ${raw.slice(0, 80)}` };
  }
}

/** Wrap any chat model as an LLM judge. */
export function createLlmJudge(model: BaseChatModel): Judge {
  return {
    async evaluate({ instructions, payload }) {
      const prompt = `${instructions}\n\n${RUBRIC}\n\n${payload}`;
      const res = await model.invoke([new HumanMessage(prompt)]);
      return parseVerdict(res.content?.toString() ?? "");
    },
  };
}

/** Build a judge from a provider config (BYOK) via the seam — used by runEval. */
export async function createJudgeFromConfig(cfg: ProviderConfig): Promise<Judge> {
  return createLlmJudge(await createChatModel(cfg));
}
