import type { CefrLevel } from "@/types/cefr";
import type {
  ComprehensionQuestion,
  ComprehensionQuestionSecure,
  Paragraph,
  PassageSegment,
  ReadingPassage,
  ReadingPassageSummary,
  ReadingTopic,
  VocabHighlight,
} from "@/types/reading";

export type ReadingPassageRow = {
  slug: string;
  title: string;
  topic: string;
  level: string;
  minutes: number;
  wordCount: number;
  newWordCount: number;
  familyLabel: string;
  sortOrder: number;
};

export type ReadingParagraphRow = {
  id: string;
  sortOrder: number;
  vi: string;
  segments: PassageSegment[];
};

export type ReadingVocabRow = {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaningVi: string;
  level: string;
};

export type ReadingQuestionRow = {
  id: string;
  sortOrder: number;
  prompt: string;
  choices: string[];
  correctIndex: number;
};

/** Strip passage slug prefix from stable seed ids for UI (optional). */
export function displayVocabId(id: string, passageSlug: string): string {
  const prefix = `${passageSlug}:`;
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

export function mapReadingPassageSummary(
  row: ReadingPassageRow,
  flags?: { completed?: boolean; inProgress?: boolean },
): ReadingPassageSummary {
  return {
    slug: row.slug,
    title: row.title,
    topic: row.topic as ReadingTopic,
    level: row.level as CefrLevel,
    minutes: row.minutes,
    completed: flags?.completed ?? false,
    inProgress: flags?.inProgress,
  };
}

export function mapReadingPassage(
  row: ReadingPassageRow,
  paragraphs: ReadingParagraphRow[],
  vocabulary: ReadingVocabRow[],
  questions: ReadingQuestionRow[],
  topicPassages: { slug: string }[],
  flags?: { completed?: boolean; inProgress?: boolean },
): ReadingPassage {
  const indexInTopic =
    topicPassages.findIndex((p) => p.slug === row.slug) + 1 || 1;

  const prefix = `${row.slug}:`;
  const vocabIdMap = new Map(
    vocabulary.map((v) => [v.id, displayVocabId(v.id, row.slug)]),
  );

  return {
    ...mapReadingPassageSummary(row, flags),
    wordCount: row.wordCount,
    newWordCount: row.newWordCount,
    familyLabel: row.familyLabel,
    indexInTopic,
    topicTotal: topicPassages.length || 1,
    paragraphs: paragraphs
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p): Paragraph => {
        const localId = p.id.startsWith(prefix)
          ? p.id.slice(prefix.length)
          : p.id;
        return {
          id: localId,
          vi: p.vi,
          segments: p.segments.map((seg) => {
            if (seg.type === "vocab") {
              const mapped = vocabIdMap.get(seg.vocabId) ?? seg.vocabId;
              return { type: "vocab", vocabId: mapped };
            }
            return seg;
          }),
        };
      }),
    vocabulary: vocabulary.map(
      (v): VocabHighlight => ({
        id: displayVocabId(v.id, row.slug),
        word: v.word,
        ipa: v.ipa,
        partOfSpeech: v.partOfSpeech,
        meaningVi: v.meaningVi,
        level: v.level as CefrLevel,
      }),
    ),
    questions: questions
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(
        (q): ComprehensionQuestion => ({
          id: q.id.startsWith(prefix) ? q.id.slice(prefix.length) : q.id,
          prompt: q.prompt,
          choices: q.choices,
        }),
      ),
  };
}

/** Map questions with answer keys for server-side scoring only. */
export function mapReadingQuestionsSecure(
  questions: ReadingQuestionRow[],
  passageSlug: string,
): ComprehensionQuestionSecure[] {
  const prefix = `${passageSlug}:`;
  return questions
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((q) => ({
      id: q.id.startsWith(prefix) ? q.id.slice(prefix.length) : q.id,
      prompt: q.prompt,
      choices: q.choices,
      correctIndex: q.correctIndex,
    }));
}
