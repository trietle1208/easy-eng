import { z } from "zod";

export const cefrSchema = z.enum(["A1", "A2", "B1", "B2", "C1"]);

const structureItemSchema = z.object({
  formula: z.string(),
  explanation: z.string(),
});

const exampleSchema = z.object({
  sentence: z.string(),
  explanation: z.string(),
});

const mistakeSchema = z.object({
  before: z.string(),
  wrong: z.string(),
  after: z.string(),
  correct: z.string(),
  noteEn: z.string(),
  noteVi: z.string(),
  missing: z.boolean().optional(),
});

export const grammarContentSchema = z.object({
  families: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      sortOrder: z.number().int(),
    }),
  ),
  groups: z.array(
    z.object({
      id: z.string().min(1),
      familyId: z.string().min(1),
      title: z.string().min(1),
      sortOrder: z.number().int(),
    }),
  ),
  lessons: z.array(
    z.object({
      id: z.string().min(1),
      slug: z.string().min(1),
      title: z.string().min(1),
      level: cefrSchema,
      familyId: z.string().min(1),
      groupId: z.string().min(1),
      sortOrder: z.number().int(),
      readMinutes: z.number().int().positive(),
      introEn: z.string(),
      introVi: z.string(),
      useWhenEn: z.string(),
      useWhenVi: z.string(),
      structure: z.array(structureItemSchema),
      examples: z.array(exampleSchema),
      mistakes: z.array(mistakeSchema),
      practiceQuizSlug: z.string().nullable(),
      practiceQuestionCount: z.number().int(),
      practiceMinutes: z.number().int(),
    }),
  ),
});

const passageSegmentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("vocab"), vocabId: z.string() }),
]);

export const readingContentSchema = z.object({
  passages: z.array(
    z.object({
      id: z.string().min(1),
      slug: z.string().min(1),
      title: z.string().min(1),
      topic: z.string().min(1),
      level: cefrSchema,
      minutes: z.number().int().positive(),
      wordCount: z.number().int().nonnegative(),
      newWordCount: z.number().int().nonnegative(),
      familyLabel: z.string(),
      sortOrder: z.number().int(),
      paragraphs: z.array(
        z.object({
          id: z.string().min(1),
          sortOrder: z.number().int(),
          vi: z.string(),
          segments: z.array(passageSegmentSchema),
        }),
      ),
      vocabulary: z.array(
        z.object({
          id: z.string().min(1),
          word: z.string().min(1),
          ipa: z.string(),
          partOfSpeech: z.string(),
          meaningVi: z.string(),
          level: cefrSchema,
        }),
      ),
      questions: z.array(
        z.object({
          id: z.string().min(1),
          sortOrder: z.number().int(),
          prompt: z.string(),
          choices: z.array(z.string()).min(2),
          correctIndex: z.number().int().nonnegative(),
        }),
      ),
    }),
  ),
});

export const listeningContentSchema = z.object({
  lessons: z.array(
    z.object({
      id: z.string().min(1),
      slug: z.string().min(1),
      title: z.string().min(1),
      topic: z.string().min(1),
      level: cefrSchema,
      durationSeconds: z.number().int().positive(),
      audioPath: z.string().min(1),
      speakers: z.number().int().positive(),
      accent: z.string(),
      familyLabel: z.string(),
      sortOrder: z.number().int(),
      transcript: z.array(
        z.object({
          id: z.string().min(1),
          sortOrder: z.number().int(),
          speaker: z.string(),
          text: z.string(),
          startMs: z.number().int().nonnegative(),
          endMs: z.number().int().nonnegative(),
        }),
      ),
      blanks: z.array(
        z.object({
          id: z.string().min(1),
          sortOrder: z.number().int(),
          promptBefore: z.string(),
          promptAfter: z.string(),
          answer: z.string().min(1),
          accept: z.array(z.string()).nullable().optional(),
        }),
      ),
    }),
  ),
});

const quizQuestionSchema = z.object({
  id: z.string().min(1),
  sortOrder: z.number().int(),
  type: z.enum(["multiple_choice", "fill_blank", "correct_sentence"]),
  instructionVi: z.string(),
  promptVi: z.string().optional(),
  hintEn: z.string().optional(),
  explanationEn: z.string(),
  explanationVi: z.string(),
  reviewBefore: z.string(),
  reviewAfter: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export const quizContentSchema = z.object({
  quizzes: z.array(
    z.object({
      id: z.string().min(1),
      slug: z.string().min(1),
      title: z.string().min(1),
      kickEn: z.string(),
      kickVi: z.string(),
      breadcrumb: z.string(),
      level: cefrSchema,
      descriptionEn: z.string(),
      descriptionVi: z.string(),
      timeLimitSeconds: z.number().int().positive(),
      passScore: z.number().int().positive(),
      questionTypes: z.array(
        z.object({ id: z.string(), label: z.string() }),
      ),
      lessonHref: z.string(),
      nextHref: z.string(),
      nextLabel: z.string(),
      encouragementEn: z.string(),
      encouragementVi: z.string(),
      questions: z.array(quizQuestionSchema).min(1),
    }),
  ),
});

export const vocabularyContentSchema = z.object({
  sets: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      titleVi: z.string(),
      topic: z.string().min(1),
      level: cefrSchema,
    }),
  ),
  words: z.array(
    z.object({
      id: z.string().min(1),
      wordSetId: z.string().min(1),
      word: z.string().min(1),
      ipa: z.string(),
      partOfSpeech: z.string(),
      level: cefrSchema,
      meaningVi: z.string(),
      definitionEn: z.string(),
      examples: z.array(
        z.object({
          en: z.string(),
          vi: z.string().optional(),
        }),
      ),
      collocations: z.array(z.string()).nullable().optional(),
      notes: z.string().nullable().optional(),
      imagePath: z.string().nullable().optional(),
      createdAt: z.string().datetime().optional(),
    }),
  ),
});

export const achievementsContentSchema = z.object({
  achievements: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      subtitleTemplate: z.string(),
      icon: z.string(),
      shape: z.enum(["round", "square"]),
      color: z.enum(["green", "orange", "blue", "purple", "gold"]),
      sortOrder: z.number().int(),
      rule: z.record(z.string(), z.unknown()),
    }),
  ),
});

export type GrammarContent = z.infer<typeof grammarContentSchema>;
export type ReadingContent = z.infer<typeof readingContentSchema>;
export type ListeningContent = z.infer<typeof listeningContentSchema>;
export type QuizContent = z.infer<typeof quizContentSchema>;
export type VocabularyContent = z.infer<typeof vocabularyContentSchema>;
export type AchievementsContent = z.infer<typeof achievementsContentSchema>;
