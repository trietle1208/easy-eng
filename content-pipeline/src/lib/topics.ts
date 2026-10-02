import { readFileSync } from "node:fs";

import { PATHS } from "../../config";

export type TopicEntry = {
  id: string;
  title: string;
  titleVi: string;
  scope: string;
};

export function loadTopics(filePath = PATHS.topicsJson): TopicEntry[] {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as {
    topics: TopicEntry[];
  };
  return raw.topics;
}

export function topicIdSet(topics: TopicEntry[]): Set<string> {
  return new Set(topics.map((t) => t.id));
}

export function topicsPromptBlock(topics: TopicEntry[]): string {
  return topics
    .map((t) => `- **${t.id}** — ${t.scope} (e.g. scope only)`)
    .join("\n");
}

export function topicSlug(topicId: string): string {
  return topicId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
