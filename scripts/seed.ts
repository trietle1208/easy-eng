/**
 * Idempotent content (+ optional demo user) seeder.
 *
 *   pnpm db:seed              # content only
 *   pnpm db:seed -- --content # content only
 *   pnpm db:seed -- --demo    # content + demo user "Linh"
 *   pnpm db:seed -- --admin   # promote/create admin from SEED_ADMIN_EMAIL
 *                             # (create needs SEED_ADMIN_PASSWORD; combine with --content)
 *   pnpm db:seed -- --content --only-new  # insert missing rows; never update
 *   pnpm db:seed -- --content --force     # allow --content when NODE_ENV=production
 */
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { hashPassword } from "better-auth/crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
  achievementsContentSchema,
  grammarContentSchema,
  listeningContentSchema,
  quizContentSchema,
  readingContentSchema,
  vocabularyContentSchema,
  type AchievementsContent,
  type GrammarContent,
  type ListeningContent,
  type QuizContent,
  type ReadingContent,
  type VocabularyContent,
} from "../content/schema";
import * as schema from "../src/db/schema";

type Db = NodePgDatabase<typeof schema>;

const CONTENT_DIR = path.join(process.cwd(), "content");
const SEED_CHUNK = 500;

function parseArgs(argv: string[]) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  // Default: content. --demo implies content + demo. Explicit --content alone = content only.
  const demo = flags.has("--demo");
  const admin = flags.has("--admin");
  const onlyNew = flags.has("--only-new");
  const force = flags.has("--force");
  // `--admin` alone must not re-seed content; no flags at all = content.
  // `--only-new` / `--force` alone still imply content.
  const content =
    demo ||
    flags.has("--content") ||
    onlyNew ||
    force ||
    flags.size === 0;
  return { content, demo, admin, onlyNew, force };
}

function chunked<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function loadJson<T>(
  filename: string,
  zodSchema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } },
): T {
  const file = path.join(CONTENT_DIR, filename);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`Failed to read ${filename}: ${(err as Error).message}`);
  }
  const parsed = zodSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    const where = issue.path.length ? issue.path.map(String).join(".") : "(root)";
    throw new Error(`Invalid ${filename} at ${where}: ${issue.message}`);
  }
  return parsed.data;
}

async function seedGrammar(db: Db, data: GrammarContent) {
  await db.transaction(async (tx) => {
    for (const f of data.families) {
      await tx
        .insert(schema.grammarFamilies)
        .values({
          id: f.id,
          title: f.title,
          sortOrder: f.sortOrder,
        })
        .onConflictDoUpdate({
          target: schema.grammarFamilies.id,
          set: {
            title: f.title,
            sortOrder: f.sortOrder,
            updatedAt: new Date(),
          },
        });
    }
    for (const g of data.groups) {
      await tx
        .insert(schema.grammarGroups)
        .values({
          id: g.id,
          familyId: g.familyId,
          title: g.title,
          sortOrder: g.sortOrder,
        })
        .onConflictDoUpdate({
          target: schema.grammarGroups.id,
          set: {
            familyId: g.familyId,
            title: g.title,
            sortOrder: g.sortOrder,
            updatedAt: new Date(),
          },
        });
    }
    for (const l of data.lessons) {
      await tx
        .insert(schema.grammarLessons)
        .values({
          id: l.id,
          slug: l.slug,
          title: l.title,
          level: l.level,
          familyId: l.familyId,
          groupId: l.groupId,
          sortOrder: l.sortOrder,
          readMinutes: l.readMinutes,
          introEn: l.introEn,
          introVi: l.introVi,
          useWhenEn: l.useWhenEn,
          useWhenVi: l.useWhenVi,
          structure: l.structure,
          examples: l.examples,
          mistakes: l.mistakes,
          practiceQuizSlug: l.practiceQuizSlug,
          practiceQuestionCount: l.practiceQuestionCount,
          practiceMinutes: l.practiceMinutes,
          status: "published",
        })
        .onConflictDoUpdate({
          target: schema.grammarLessons.id,
          set: {
            slug: l.slug,
            title: l.title,
            level: l.level,
            familyId: l.familyId,
            groupId: l.groupId,
            sortOrder: l.sortOrder,
            readMinutes: l.readMinutes,
            introEn: l.introEn,
            introVi: l.introVi,
            useWhenEn: l.useWhenEn,
            useWhenVi: l.useWhenVi,
            structure: l.structure,
            examples: l.examples,
            mistakes: l.mistakes,
            practiceQuizSlug: l.practiceQuizSlug,
            practiceQuestionCount: l.practiceQuestionCount,
            practiceMinutes: l.practiceMinutes,
            status: "published",
            updatedAt: new Date(),
          },
        });
    }
  });
  console.log(
    `[seed] grammar: ${data.families.length} families, ${data.groups.length} groups, ${data.lessons.length} lessons`,
  );
}

async function seedReading(db: Db, data: ReadingContent) {
  await db.transaction(async (tx) => {
    for (const p of data.passages) {
      await tx
        .insert(schema.readingPassages)
        .values({
          id: p.id,
          slug: p.slug,
          title: p.title,
          topic: p.topic,
          level: p.level,
          minutes: p.minutes,
          wordCount: p.wordCount,
          newWordCount: p.newWordCount,
          familyLabel: p.familyLabel,
          sortOrder: p.sortOrder,
          status: "published",
        })
        .onConflictDoUpdate({
          target: schema.readingPassages.id,
          set: {
            slug: p.slug,
            title: p.title,
            topic: p.topic,
            level: p.level,
            minutes: p.minutes,
            wordCount: p.wordCount,
            newWordCount: p.newWordCount,
            familyLabel: p.familyLabel,
            sortOrder: p.sortOrder,
            status: "published",
            updatedAt: new Date(),
          },
        });

      // Replace children for stable re-seed (ids are stable, upsert is fine).
      for (const para of p.paragraphs) {
        await tx
          .insert(schema.readingParagraphs)
          .values({
            id: para.id,
            passageId: p.id,
            sortOrder: para.sortOrder,
            vi: para.vi,
            segments: para.segments,
          })
          .onConflictDoUpdate({
            target: schema.readingParagraphs.id,
            set: {
              passageId: p.id,
              sortOrder: para.sortOrder,
              vi: para.vi,
              segments: para.segments,
            },
          });
      }
      for (const v of p.vocabulary) {
        await tx
          .insert(schema.readingVocabHighlights)
          .values({
            id: v.id,
            passageId: p.id,
            word: v.word,
            ipa: v.ipa,
            partOfSpeech: v.partOfSpeech,
            meaningVi: v.meaningVi,
            level: v.level,
          })
          .onConflictDoUpdate({
            target: schema.readingVocabHighlights.id,
            set: {
              passageId: p.id,
              word: v.word,
              ipa: v.ipa,
              partOfSpeech: v.partOfSpeech,
              meaningVi: v.meaningVi,
              level: v.level,
            },
          });
      }
      for (const q of p.questions) {
        await tx
          .insert(schema.readingQuestions)
          .values({
            id: q.id,
            passageId: p.id,
            sortOrder: q.sortOrder,
            prompt: q.prompt,
            choices: q.choices,
            correctIndex: q.correctIndex,
          })
          .onConflictDoUpdate({
            target: schema.readingQuestions.id,
            set: {
              passageId: p.id,
              sortOrder: q.sortOrder,
              prompt: q.prompt,
              choices: q.choices,
              correctIndex: q.correctIndex,
            },
          });
      }
    }
  });
  console.log(`[seed] reading: ${data.passages.length} passages`);
}

async function seedListening(db: Db, data: ListeningContent) {
  await db.transaction(async (tx) => {
    for (const l of data.lessons) {
      await tx
        .insert(schema.listeningLessons)
        .values({
          id: l.id,
          slug: l.slug,
          title: l.title,
          topic: l.topic,
          level: l.level,
          durationSeconds: l.durationSeconds,
          audioPath: l.audioPath,
          speakers: l.speakers,
          accent: l.accent,
          familyLabel: l.familyLabel,
          sortOrder: l.sortOrder,
          status: "published",
        })
        .onConflictDoUpdate({
          target: schema.listeningLessons.id,
          set: {
            slug: l.slug,
            title: l.title,
            topic: l.topic,
            level: l.level,
            durationSeconds: l.durationSeconds,
            audioPath: l.audioPath,
            speakers: l.speakers,
            accent: l.accent,
            familyLabel: l.familyLabel,
            sortOrder: l.sortOrder,
            status: "published",
            updatedAt: new Date(),
          },
        });

      for (const s of l.transcript) {
        await tx
          .insert(schema.listeningTranscriptSentences)
          .values({
            id: s.id,
            lessonId: l.id,
            sortOrder: s.sortOrder,
            speaker: s.speaker,
            text: s.text,
            startMs: s.startMs,
            endMs: s.endMs,
          })
          .onConflictDoUpdate({
            target: schema.listeningTranscriptSentences.id,
            set: {
              lessonId: l.id,
              sortOrder: s.sortOrder,
              speaker: s.speaker,
              text: s.text,
              startMs: s.startMs,
              endMs: s.endMs,
            },
          });
      }
      for (const b of l.blanks) {
        await tx
          .insert(schema.listeningDictationBlanks)
          .values({
            id: b.id,
            lessonId: l.id,
            sortOrder: b.sortOrder,
            promptBefore: b.promptBefore,
            promptAfter: b.promptAfter,
            answer: b.answer,
            accept: b.accept ?? null,
          })
          .onConflictDoUpdate({
            target: schema.listeningDictationBlanks.id,
            set: {
              lessonId: l.id,
              sortOrder: b.sortOrder,
              promptBefore: b.promptBefore,
              promptAfter: b.promptAfter,
              answer: b.answer,
              accept: b.accept ?? null,
            },
          });
      }
    }
  });
  console.log(`[seed] listening: ${data.lessons.length} lessons`);
}

async function seedQuiz(db: Db, data: QuizContent) {
  await db.transaction(async (tx) => {
    for (const q of data.quizzes) {
      await tx
        .insert(schema.quizzes)
        .values({
          id: q.id,
          slug: q.slug,
          title: q.title,
          kickEn: q.kickEn,
          kickVi: q.kickVi,
          breadcrumb: q.breadcrumb,
          level: q.level,
          descriptionEn: q.descriptionEn,
          descriptionVi: q.descriptionVi,
          timeLimitSeconds: q.timeLimitSeconds,
          passScore: q.passScore,
          questionTypes: q.questionTypes,
          lessonHref: q.lessonHref,
          nextHref: q.nextHref,
          nextLabel: q.nextLabel,
          encouragementEn: q.encouragementEn,
          encouragementVi: q.encouragementVi,
          status: "published",
        })
        .onConflictDoUpdate({
          target: schema.quizzes.id,
          set: {
            slug: q.slug,
            title: q.title,
            kickEn: q.kickEn,
            kickVi: q.kickVi,
            breadcrumb: q.breadcrumb,
            level: q.level,
            descriptionEn: q.descriptionEn,
            descriptionVi: q.descriptionVi,
            timeLimitSeconds: q.timeLimitSeconds,
            passScore: q.passScore,
            questionTypes: q.questionTypes,
            lessonHref: q.lessonHref,
            nextHref: q.nextHref,
            nextLabel: q.nextLabel,
            encouragementEn: q.encouragementEn,
            encouragementVi: q.encouragementVi,
            status: "published",
            updatedAt: new Date(),
          },
        });

      for (const question of q.questions) {
        await tx
          .insert(schema.quizQuestions)
          .values({
            id: question.id,
            quizId: q.id,
            sortOrder: question.sortOrder,
            type: question.type,
            instructionVi: question.instructionVi,
            promptVi: question.promptVi ?? null,
            hintEn: question.hintEn ?? null,
            explanationEn: question.explanationEn,
            explanationVi: question.explanationVi,
            reviewBefore: question.reviewBefore,
            reviewAfter: question.reviewAfter,
            payload: question.payload,
          })
          .onConflictDoUpdate({
            target: schema.quizQuestions.id,
            set: {
              quizId: q.id,
              sortOrder: question.sortOrder,
              type: question.type,
              instructionVi: question.instructionVi,
              promptVi: question.promptVi ?? null,
              hintEn: question.hintEn ?? null,
              explanationEn: question.explanationEn,
              explanationVi: question.explanationVi,
              reviewBefore: question.reviewBefore,
              reviewAfter: question.reviewAfter,
              payload: question.payload,
            },
          });
      }
    }
  });
  console.log(`[seed] quiz: ${data.quizzes.length} quizzes`);
}

async function seedVocabulary(
  db: Db,
  data: VocabularyContent,
  opts: { onlyNew: boolean },
) {
  await db.transaction(async (tx) => {
    const setRows = data.sets.map((s, i) => ({
      id: s.id,
      title: s.title,
      titleVi: s.titleVi,
      topic: s.topic,
      level: s.level,
      ownerId: null as string | null,
      status: (s.status ?? "published") as "draft" | "published",
      sortOrder: s.sortOrder ?? i,
    }));

    for (const batch of chunked(setRows, SEED_CHUNK)) {
      if (opts.onlyNew) {
        await tx
          .insert(schema.wordSets)
          .values(batch)
          .onConflictDoNothing({ target: schema.wordSets.id });
      } else {
        await tx
          .insert(schema.wordSets)
          .values(batch)
          .onConflictDoUpdate({
            target: schema.wordSets.id,
            set: {
              title: sql`excluded.title`,
              titleVi: sql`excluded.title_vi`,
              topic: sql`excluded.topic`,
              level: sql`excluded.level`,
              ownerId: null,
              status: sql`excluded.status`,
              sortOrder: sql`excluded.sort_order`,
            },
          });
      }
    }

    const wordRows = data.words.map((w, i) => ({
      id: w.id,
      wordSetId: w.wordSetId,
      ownerId: null as string | null,
      word: w.word,
      ipa: w.ipa,
      partOfSpeech: w.partOfSpeech,
      level: w.level,
      meaningVi: w.meaningVi,
      definitionEn: w.definitionEn,
      examples: w.examples,
      collocations: w.collocations ?? null,
      notes: w.notes ?? null,
      imagePath: w.imagePath ?? null,
      source: w.source ?? "manual",
      sortOrder: w.sortOrder ?? i,
      reviewStatus: (w.reviewStatus ?? "human_reviewed") as
        | "ai_generated"
        | "ai_checked"
        | "human_reviewed",
      ipaStatus: w.ipaStatus ?? null,
      createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
    }));

    for (const batch of chunked(wordRows, SEED_CHUNK)) {
      if (opts.onlyNew) {
        await tx
          .insert(schema.words)
          .values(batch)
          .onConflictDoNothing({ target: schema.words.id });
        continue;
      }

      // Upsert, but never overwrite admin-owned system rows.
      const ids = batch.map((w) => w.id);
      const existing = await tx
        .select({ id: schema.words.id, source: schema.words.source })
        .from(schema.words)
        .where(inArray(schema.words.id, ids));
      const protectedIds = new Set(
        existing.filter((r) => r.source === "admin").map((r) => r.id),
      );

      const writable = batch.filter((w) => !protectedIds.has(w.id));
      if (writable.length === 0) continue;

      await tx
        .insert(schema.words)
        .values(writable)
        .onConflictDoUpdate({
          target: schema.words.id,
          set: {
            wordSetId: sql`excluded.word_set_id`,
            ownerId: null,
            word: sql`excluded.word`,
            ipa: sql`excluded.ipa`,
            partOfSpeech: sql`excluded.part_of_speech`,
            level: sql`excluded.level`,
            meaningVi: sql`excluded.meaning_vi`,
            definitionEn: sql`excluded.definition_en`,
            examples: sql`excluded.examples`,
            collocations: sql`excluded.collocations`,
            notes: sql`excluded.notes`,
            imagePath: sql`excluded.image_path`,
            source: sql`excluded.source`,
            sortOrder: sql`excluded.sort_order`,
            reviewStatus: sql`excluded.review_status`,
            ipaStatus: sql`excluded.ipa_status`,
          },
        });
    }
  });
  console.log(
    `[seed] vocabulary: ${data.sets.length} sets, ${data.words.length} words` +
      (opts.onlyNew ? " (--only-new)" : ""),
  );
}

async function seedAchievements(db: Db, data: AchievementsContent) {
  await db.transaction(async (tx) => {
    for (const a of data.achievements) {
      await tx
        .insert(schema.achievementDefinitions)
        .values({
          id: a.id,
          title: a.title,
          subtitleTemplate: a.subtitleTemplate,
          icon: a.icon,
          shape: a.shape,
          color: a.color,
          sortOrder: a.sortOrder,
          rule: a.rule,
        })
        .onConflictDoUpdate({
          target: schema.achievementDefinitions.id,
          set: {
            title: a.title,
            subtitleTemplate: a.subtitleTemplate,
            icon: a.icon,
            shape: a.shape,
            color: a.color,
            sortOrder: a.sortOrder,
            rule: a.rule,
          },
        });
    }
  });
  console.log(`[seed] achievements: ${data.achievements.length} definitions`);
}

function copySeedAudio(listening: ListeningContent) {
  const storageRoot = path.resolve(
    process.env.STORAGE_DIR ?? "./storage",
  );
  const paths = new Set(listening.lessons.map((l) => l.audioPath));
  for (const audioPath of paths) {
    const src = path.join(CONTENT_DIR, "audio", audioPath);
    const dest = path.join(storageRoot, audioPath);
    if (!existsSync(src)) {
      console.warn(`[seed] missing audio source: ${src}`);
      continue;
    }
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }
  console.log(`[seed] audio → ${storageRoot} (${paths.size} file(s))`);
}

/** Stable id from parts (idempotent demo rows). */
function stableId(...parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 24);
}

async function seedDemoUser(db: Db) {
  const email = process.env.SEED_DEMO_EMAIL ?? "linh@example.com";
  const password = process.env.SEED_DEMO_PASSWORD ?? "password123";
  const userId = "user-linh";

  await db.transaction(async (tx) => {
    const existing = await tx.query.user.findFirst({
      where: eq(schema.user.email, email),
    });
    const id = existing?.id ?? userId;

    await tx
      .insert(schema.user)
      .values({
        id,
        name: "Linh Trần",
        email,
        emailVerified: true,
        cefrLevel: "B1",
        timezone: "Asia/Ho_Chi_Minh",
        goalText: "IELTS 6.5",
      })
      .onConflictDoUpdate({
        target: schema.user.id,
        set: {
          name: "Linh Trần",
          email,
          emailVerified: true,
          cefrLevel: "B1",
          timezone: "Asia/Ho_Chi_Minh",
          goalText: "IELTS 6.5",
          updatedAt: new Date(),
        },
      });

    const hashed = await hashPassword(password);
    const accountId = stableId("account", id, "credential");
    await tx
      .insert(schema.account)
      .values({
        id: accountId,
        accountId: id,
        providerId: "credential",
        userId: id,
        password: hashed,
      })
      .onConflictDoUpdate({
        target: schema.account.id,
        set: {
          password: hashed,
          updatedAt: new Date(),
        },
      });

    await tx
      .insert(schema.userSettings)
      .values({
        userId: id,
        wordsPerDay: 20,
        grammarPerDay: 2,
        dailyReminder: true,
        reminderTime: "20:30",
        reminderDays: ["mon", "tue", "wed", "thu", "fri", "sun"],
        streakRescue: true,
        interfaceLanguage: "en",
        showVietnameseHints: true,
        autoPlayPronunciation: false,
        theme: "default",
      })
      .onConflictDoUpdate({
        target: schema.userSettings.userId,
        set: {
          wordsPerDay: 20,
          grammarPerDay: 2,
          dailyReminder: true,
          reminderTime: "20:30",
          reminderDays: ["mon", "tue", "wed", "thu", "fri", "sun"],
          streakRescue: true,
          interfaceLanguage: "en",
          showVietnameseHints: true,
          autoPlayPronunciation: false,
          theme: "default",
          updatedAt: new Date(),
        },
      });

    const progressRows = [
      {
        contentKind: "grammar" as const,
        contentId: "present-perfect-vs-past-simple",
        status: "in_progress" as const,
        progressPercent: 60,
        lastPosition: { section: "mistakes" },
      },
      {
        contentKind: "vocabulary_set" as const,
        contentId: "at-the-airport",
        status: "in_progress" as const,
        progressPercent: 47,
        lastPosition: null,
      },
      {
        contentKind: "grammar" as const,
        contentId: "use-linking-verbs-with-complements",
        status: "in_progress" as const,
        progressPercent: 35,
        lastPosition: { section: "examples" },
      },
      {
        contentKind: "reading" as const,
        contentId: "the-night-bus-to-da-lat",
        status: "in_progress" as const,
        progressPercent: 40,
        lastPosition: null,
      },
      {
        contentKind: "listening" as const,
        contentId: "checking-in-at-the-airport",
        status: "in_progress" as const,
        progressPercent: 50,
        lastPosition: { blankIndex: 2 },
      },
      {
        contentKind: "reading" as const,
        contentId: "a-morning-at-ben-thanh-market",
        status: "completed" as const,
        progressPercent: 100,
        lastPosition: null,
      },
      {
        contentKind: "reading" as const,
        contentId: "why-cats-sleep-so-much",
        status: "completed" as const,
        progressPercent: 100,
        lastPosition: null,
      },
      {
        contentKind: "listening" as const,
        contentId: "ordering-a-coffee",
        status: "completed" as const,
        progressPercent: 100,
        lastPosition: null,
      },
      {
        contentKind: "listening" as const,
        contentId: "asking-for-directions-in-ha-noi",
        status: "completed" as const,
        progressPercent: 100,
        lastPosition: null,
      },
    ];

    for (const row of progressRows) {
      const pid = stableId("progress", id, row.contentKind, row.contentId);
      await tx
        .insert(schema.userLessonProgress)
        .values({
          id: pid,
          userId: id,
          contentKind: row.contentKind,
          contentId: row.contentId,
          status: row.status,
          progressPercent: row.progressPercent,
          lastPosition: row.lastPosition,
        })
        .onConflictDoUpdate({
          target: [
            schema.userLessonProgress.userId,
            schema.userLessonProgress.contentKind,
            schema.userLessonProgress.contentId,
          ],
          set: {
            status: row.status,
            progressPercent: row.progressPercent,
            lastPosition: row.lastPosition,
            updatedAt: new Date(),
          },
        });
    }

    const quizId = "present-perfect-vs-past-simple";
    const attemptId = stableId("attempt", id, quizId, "seed");
    const completedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await tx
      .insert(schema.quizAttempts)
      .values({
        id: attemptId,
        userId: id,
        quizId,
        score: 6,
        total: 10,
        passed: false,
        timeUsedSeconds: 7 * 60,
        accuracy: 60,
        answers: {},
        rawAnswers: {},
        isFullRun: true,
        completedAt,
      })
      .onConflictDoUpdate({
        target: schema.quizAttempts.id,
        set: {
          score: 6,
          total: 10,
          passed: false,
          timeUsedSeconds: 7 * 60,
          accuracy: 60,
          answers: {},
          rawAnswers: {},
          isFullRun: true,
          completedAt,
        },
      });

    // FSRS-ish cards for the 3 seed words (learnedCount on airport set).
    const wordIds = ["w-itinerary", "w-boarding-pass", "w-gate"];
    for (const [i, wordId] of wordIds.entries()) {
      const cardId = stableId("card", id, wordId);
      const due = new Date();
      due.setDate(due.getDate() + (i === 0 ? 0 : i + 1));
      await tx
        .insert(schema.userWordCards)
        .values({
          id: cardId,
          userId: id,
          wordId,
          due,
          stability: 2 + i,
          difficulty: 5,
          elapsedDays: i,
          scheduledDays: i + 1,
          reps: i + 1,
          lapses: 0,
          state: i === 0 ? 1 : 2, // Learning / Review
          lastReview: new Date(Date.now() - (i + 1) * 86400000),
        })
        .onConflictDoUpdate({
          target: [schema.userWordCards.userId, schema.userWordCards.wordId],
          set: {
            due,
            stability: 2 + i,
            difficulty: 5,
            elapsedDays: i,
            scheduledDays: i + 1,
            reps: i + 1,
            lapses: 0,
            state: i === 0 ? 1 : 2,
            lastReview: new Date(Date.now() - (i + 1) * 86400000),
          },
        });
    }

    // Activity: recent study days so heatmap / streak have signal.
    const today = new Date();
    for (let d = 0; d < 14; d++) {
      const occurred = new Date(today);
      occurred.setDate(today.getDate() - d);
      occurred.setHours(10, 0, 0, 0);
      const localDate = occurred.toISOString().slice(0, 10);
      const eventId = stableId("activity", id, localDate, "study");
      await tx
        .insert(schema.activityEvents)
        .values({
          id: eventId,
          userId: id,
          occurredAt: occurred,
          localDate,
          kind: "study_session",
          durationSeconds: 15 * 60 + d * 30,
          payload: { source: "seed" },
        })
        .onConflictDoUpdate({
          target: schema.activityEvents.id,
          set: {
            occurredAt: occurred,
            localDate,
            kind: "study_session",
            durationSeconds: 15 * 60 + d * 30,
            payload: { source: "seed" },
          },
        });
    }

    const earned = [
      "first-page",
      "streak-7",
      "word-collector",
      "grammar-geek",
      "early-bird",
    ];
    for (const achievementId of earned) {
      await tx
        .insert(schema.userAchievements)
        .values({
          userId: id,
          achievementId,
          earnedAt: new Date("2026-09-04T08:00:00.000Z"),
          progress: null,
        })
        .onConflictDoUpdate({
          target: [
            schema.userAchievements.userId,
            schema.userAchievements.achievementId,
          ],
          set: {
            earnedAt: new Date("2026-09-04T08:00:00.000Z"),
            progress: null,
          },
        });
    }
  });

  console.log(`[seed] demo user: ${email} (password from SEED_DEMO_PASSWORD)`);
}

/**
 * Promote (or create) the admin account named by SEED_ADMIN_EMAIL.
 * - existing user: role → admin (password untouched)
 * - missing user: created (verified) — requires SEED_ADMIN_PASSWORD (≥ 8 chars)
 */
async function seedAdminUser(db: Db) {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    throw new Error("--admin requires SEED_ADMIN_EMAIL to be set");
  }

  const existing = await db.query.user.findFirst({
    where: eq(schema.user.email, email),
  });

  if (existing) {
    await db
      .update(schema.user)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(schema.user.id, existing.id));
    console.log(`[seed] admin: promoted existing user ${email}`);
    return;
  }

  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (password.length < 8) {
    throw new Error(
      `No user ${email} yet — sign up first, or set SEED_ADMIN_PASSWORD (≥ 8 chars) to create it`,
    );
  }
  const id = `user-admin-${stableId("admin", email).slice(0, 12)}`;
  const hashed = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx.insert(schema.user).values({
      id,
      name: process.env.SEED_ADMIN_NAME?.trim() || "Admin",
      email,
      emailVerified: true,
      role: "admin",
    });
    await tx.insert(schema.account).values({
      id: stableId("account", id, "credential"),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: hashed,
    });
    await tx
      .insert(schema.userSettings)
      .values({
        userId: id,
        reminderDays: ["mon", "tue", "wed", "thu", "fri", "sun"],
      })
      .onConflictDoNothing();
  });
  console.log(`[seed] admin: created ${email} (role=admin)`);
}

async function contentFingerprint(db: Db) {
  const [g] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.grammarLessons);
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.readingPassages);
  const [l] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.listeningLessons);
  const [q] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.quizzes);
  const [w] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.words);
  const [a] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.achievementDefinitions);
  return {
    grammarLessons: g!.n,
    readingPassages: r!.n,
    listeningLessons: l!.n,
    quizzes: q!.n,
    words: w!.n,
    achievements: a!.n,
  };
}

async function main() {
  const { content, demo, admin, onlyNew, force } = parseArgs(
    process.argv.slice(2),
  );
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  if (content && process.env.NODE_ENV === "production" && !force) {
    throw new Error(
      "Refusing to seed --content when NODE_ENV=production (pass --force to override).",
    );
  }

  // Validate all JSON before writing anything.
  const grammar = loadJson("grammar.json", grammarContentSchema);
  const reading = loadJson("reading.json", readingContentSchema);
  const listening = loadJson("listening.json", listeningContentSchema);
  const quiz = loadJson("quiz.json", quizContentSchema);
  const vocabulary = loadJson("vocabulary.json", vocabularyContentSchema);
  const achievements = loadJson("achievements.json", achievementsContentSchema);

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  try {
    const before = await contentFingerprint(db);

    if (content) {
      // Quizzes before grammar (soft refs); achievements independent.
      await seedQuiz(db, quiz);
      await seedGrammar(db, grammar);
      await seedReading(db, reading);
      await seedListening(db, listening);
      await seedVocabulary(db, vocabulary, { onlyNew });
      await seedAchievements(db, achievements);
      copySeedAudio(listening);
      console.log(
        "[seed] content updated — restart the Next.js process (or wait up to 1h) so unstable_cache tags refresh:",
        "content:grammar, content:reading, content:listening, content:quiz",
      );
    }

    if (demo) {
      await seedDemoUser(db);
    }

    if (admin) {
      await seedAdminUser(db);
    }

    const after = await contentFingerprint(db);
    console.log("[seed] counts:", after);
    if (
      before.grammarLessons === after.grammarLessons &&
      before.words === after.words &&
      content
    ) {
      console.log("[seed] re-run looks idempotent (counts unchanged or first run)");
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
