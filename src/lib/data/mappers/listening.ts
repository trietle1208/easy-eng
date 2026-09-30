import type { CefrLevel } from "@/types/cefr";
import type {
  DictationBlank,
  DictationBlankSecure,
  ListeningLesson,
  ListeningLessonSummary,
  ListeningTopic,
  TranscriptSentence,
} from "@/types/listening";

export type ListeningLessonRow = {
  slug: string;
  title: string;
  topic: string;
  level: string;
  durationSeconds: number;
  audioPath: string;
  speakers: number;
  accent: string;
  familyLabel: string;
};

export type TranscriptRow = {
  id: string;
  sortOrder: number;
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
};

export type DictationBlankRow = {
  id: string;
  sortOrder: number;
  promptBefore: string;
  promptAfter: string;
  answer: string;
  accept: string[] | null;
};

export function mapListeningLessonSummary(
  row: ListeningLessonRow,
  flags?: { completed?: boolean; inProgress?: boolean },
): ListeningLessonSummary {
  return {
    slug: row.slug,
    title: row.title,
    topic: row.topic as ListeningTopic,
    level: row.level as CefrLevel,
    durationSeconds: row.durationSeconds,
    completed: flags?.completed ?? false,
    inProgress: flags?.inProgress,
  };
}

/**
 * @param publicAudioUrl — storage driver public URL for audioPath
 */
export function mapListeningLesson(
  row: ListeningLessonRow,
  transcript: TranscriptRow[],
  blanks: DictationBlankRow[],
  publicAudioUrl: string,
  flags?: { completed?: boolean; inProgress?: boolean },
): ListeningLesson {
  const prefix = `${row.slug}:`;
  return {
    ...mapListeningLessonSummary(row, flags),
    audioSrc: publicAudioUrl,
    speakers: row.speakers,
    accent: row.accent,
    familyLabel: row.familyLabel,
    transcript: transcript
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(
        (s): TranscriptSentence => ({
          id: s.id.startsWith(prefix) ? s.id.slice(prefix.length) : s.id,
          speaker: s.speaker,
          text: s.text,
          start: s.startMs / 1000,
          end: s.endMs / 1000,
        }),
      ),
    blanks: blanks
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(
        (b): DictationBlank => ({
          id: b.id.startsWith(prefix) ? b.id.slice(prefix.length) : b.id,
          promptBefore: b.promptBefore,
          promptAfter: b.promptAfter,
        }),
      ),
  };
}

/** Map blanks with answer keys for server-side scoring only. */
export function mapDictationBlanksSecure(
  blanks: DictationBlankRow[],
  lessonSlug: string,
): DictationBlankSecure[] {
  const prefix = `${lessonSlug}:`;
  return blanks
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b) => ({
      id: b.id.startsWith(prefix) ? b.id.slice(prefix.length) : b.id,
      promptBefore: b.promptBefore,
      promptAfter: b.promptAfter,
      answer: b.answer,
      accept: b.accept ?? undefined,
    }));
}
