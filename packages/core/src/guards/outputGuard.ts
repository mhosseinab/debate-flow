import { z } from "zod";
import { type GuardIssue, type GuardResult, summarize } from "./types";
import { isValidSpeaker } from "../lib/utils";
import type { PodcastConfig } from "../types";

const SPEAKER_TAG = /\*\*\[([^\]]+)\]\*\*/g;

// The contract downstream TTS parsing relies on: a non-empty speaker name.
const TagSchema = z.object({ speaker: z.string().trim().min(1) });

// Heuristics for the prompt's credibility rule (no fabricated experts/citations).
const FABRICATED_AUTHORITY: RegExp[] = [
  /\bDr\.\s+[A-Z][a-z]+/,
  /\bProfessor\s+[A-Z][a-z]+/,
  /according to (a|an|the) (study|report|paper)\b/i,
];

/** Validates the generated transcript against the format + safety contracts. */
export function checkOutput(transcript: string, config: PodcastConfig): GuardResult {
  const text = (transcript ?? "").trim();
  if (!text) {
    return { ok: false, issues: [{ code: "empty_output", message: "Transcript is empty.", severity: "error" }] };
  }

  const issues: GuardIssue[] = [];
  const tags = [...text.matchAll(SPEAKER_TAG)].map((m) => m[1].trim());
  const speakerTags = tags.filter((t) => isValidSpeaker(t));

  if (speakerTags.length === 0) {
    issues.push({ code: "no_speaker_tags", message: "No **[Speaker]** tags found.", severity: "error" });
  }

  const known = new Set([config.speaker1Name, config.speaker2Name].map((s) => s.toLowerCase()));
  for (const tag of speakerTags) {
    if (!TagSchema.safeParse({ speaker: tag }).success) {
      issues.push({ code: "bad_tag", message: `Malformed speaker tag: "${tag}".`, severity: "error" });
      continue;
    }
    if (!known.has(tag.toLowerCase())) {
      issues.push({
        code: "unknown_speaker",
        message: `Speaker "${tag}" is not a configured speaker.`,
        severity: "warn",
      });
    }
  }

  if (FABRICATED_AUTHORITY.some((re) => re.test(text))) {
    issues.push({
      code: "possible_fabricated_authority",
      message: "Possible fabricated expert/citation — verify the credibility rule.",
      severity: "warn",
    });
  }

  return summarize({ ok: true, issues });
}
