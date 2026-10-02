import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { topicsContentSchema } from "../../../../content/schema";
import { TOPIC_ENTRIES, WORD_SET_TOPICS } from "@/types/vocabulary";

const LEGACY_TOPICS = [
  "Daily life",
  "Work",
  "Travel",
  "Food",
  "Health",
  "School",
  "Technology",
  "Feelings",
] as const;

describe("content/topics.json", () => {
  it("validates and keeps the original 8 topic ids", () => {
    const raw = JSON.parse(
      readFileSync(path.join(process.cwd(), "content/topics.json"), "utf8"),
    );
    const parsed = topicsContentSchema.parse(raw);
    expect(parsed.topics).toHaveLength(18);
    expect(WORD_SET_TOPICS).toEqual(parsed.topics.map((t) => t.id));
    expect(TOPIC_ENTRIES).toHaveLength(18);
    for (const id of LEGACY_TOPICS) {
      expect(WORD_SET_TOPICS).toContain(id);
    }
  });
});
