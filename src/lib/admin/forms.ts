/**
 * Admin form <-> entity mapping. Client-safe: the same field specs drive the
 * generic form component; `buildEntity` runs on the server inside actions.
 */
import { z } from "zod";

import { ActionError } from "@/lib/errors/action";
import {
  grammarLessonSchema,
  listeningLessonSchema,
  quizSchema,
  readingPassageSchema,
  wordSetBundleSchema,
  type ContentKind,
  type GrammarLessonEntity,
  type ListeningLessonEntity,
  type QuizEntity,
  type ReadingPassageEntity,
  type WordSetBundle,
} from "@/lib/admin/validate";

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "json"
  | "audio";

export type FieldSpec = {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  help?: string;
  required?: boolean;
  /** Read-only when editing an existing item (ids / slugs). */
  lockOnEdit?: boolean;
  rows?: number;
};

export type FormValues = Record<string, string>;

export type FormContext = {
  groups: { id: string; familyId: string; title: string; familyTitle: string }[];
};

const CEFR_OPTIONS = ["A1", "A2", "B1", "B2", "C1"].map((v) => ({
  value: v,
  label: v,
}));

export const QUIZ_TYPE_TAGS = [
  { id: "multiple_choice", label: "Multiple choice" },
  { id: "fill_blank", label: "Fill in" },
  { id: "correct_sentence", label: "Sentence" },
];

export function fieldsFor(kind: ContentKind, ctx: FormContext): FieldSpec[] {
  switch (kind) {
    case "grammar":
      return [
        { name: "slug", label: "Slug", type: "text", required: true, lockOnEdit: true, help: "URL id, e.g. present-perfect. Cannot change after creation." },
        { name: "title", label: "Title", type: "text", required: true },
        { name: "level", label: "Level", type: "select", options: CEFR_OPTIONS, required: true },
        {
          name: "groupId",
          label: "Family › Group",
          type: "select",
          required: true,
          options: ctx.groups.map((g) => ({
            value: g.id,
            label: `${g.familyTitle} › ${g.title}`,
          })),
        },
        { name: "sortOrder", label: "Sort order", type: "number", required: true },
        { name: "readMinutes", label: "Read minutes", type: "number", required: true },
        { name: "introEn", label: "Intro (EN)", type: "textarea", rows: 3 },
        { name: "introVi", label: "Intro (VI)", type: "textarea", rows: 3 },
        { name: "useWhenEn", label: "Use when (EN)", type: "textarea", rows: 2 },
        { name: "useWhenVi", label: "Use when (VI)", type: "textarea", rows: 2 },
        { name: "practiceQuizSlug", label: "Practice quiz slug", type: "text", help: "Optional, e.g. present-perfect-vs-past-simple" },
        { name: "practiceQuestionCount", label: "Practice questions", type: "number", required: true },
        { name: "practiceMinutes", label: "Practice minutes", type: "number", required: true },
        { name: "structure", label: "Structure (JSON)", type: "json", rows: 8, help: "[{ formula, explanation }]" },
        { name: "examples", label: "Examples (JSON)", type: "json", rows: 8, help: "[{ sentence, explanation }]" },
        { name: "mistakes", label: "Common mistakes (JSON)", type: "json", rows: 10, help: "[{ before, wrong, after, correct, noteEn, noteVi, missing? }]" },
      ];
    case "reading":
      return [
        { name: "slug", label: "Slug", type: "text", required: true, lockOnEdit: true },
        { name: "title", label: "Title", type: "text", required: true },
        { name: "topic", label: "Topic", type: "text", required: true, help: "e.g. Travel, Food, Daily life" },
        { name: "level", label: "Level", type: "select", options: CEFR_OPTIONS, required: true },
        { name: "minutes", label: "Minutes", type: "number", required: true },
        { name: "wordCount", label: "Word count", type: "number" },
        { name: "newWordCount", label: "New words", type: "number" },
        { name: "familyLabel", label: "Family label", type: "text", help: "Shown on cards, e.g. Present perfect" },
        { name: "sortOrder", label: "Sort order", type: "number", required: true },
        { name: "paragraphs", label: "Paragraphs (JSON)", type: "json", rows: 12, help: 'id / sortOrder optional. segments: {type:"text",text} | {type:"vocab",vocabId}' },
        { name: "vocabulary", label: "Vocabulary highlights (JSON)", type: "json", rows: 8, help: "[{ id, word, ipa, partOfSpeech, meaningVi, level }]" },
        { name: "questions", label: "Comprehension questions (JSON)", type: "json", rows: 10, help: "[{ prompt, choices[], correctIndex }]" },
      ];
    case "listening":
      return [
        { name: "slug", label: "Slug", type: "text", required: true, lockOnEdit: true },
        { name: "title", label: "Title", type: "text", required: true },
        { name: "topic", label: "Topic", type: "text", required: true },
        { name: "level", label: "Level", type: "select", options: CEFR_OPTIONS, required: true },
        { name: "durationSeconds", label: "Duration (seconds)", type: "number", required: true },
        { name: "audioPath", label: "Audio", type: "audio", required: true, help: "Storage key, e.g. listening/my-lesson.wav — upload below or type a key." },
        { name: "speakers", label: "Speakers", type: "number", required: true },
        { name: "accent", label: "Accent", type: "text" },
        { name: "familyLabel", label: "Family label", type: "text" },
        { name: "sortOrder", label: "Sort order", type: "number", required: true },
        { name: "transcript", label: "Transcript (JSON)", type: "json", rows: 12, help: "[{ speaker, text, startMs, endMs }]" },
        { name: "blanks", label: "Dictation blanks (JSON)", type: "json", rows: 8, help: "[{ promptBefore, promptAfter, answer, accept? }]" },
      ];
    case "quiz":
      return [
        { name: "slug", label: "Slug", type: "text", required: true, lockOnEdit: true },
        { name: "title", label: "Title", type: "text", required: true },
        { name: "level", label: "Level", type: "select", options: CEFR_OPTIONS, required: true },
        { name: "kickEn", label: "Kicker (EN)", type: "text" },
        { name: "kickVi", label: "Kicker (VI)", type: "text" },
        { name: "breadcrumb", label: "Breadcrumb", type: "text" },
        { name: "descriptionEn", label: "Description (EN)", type: "textarea", rows: 2 },
        { name: "descriptionVi", label: "Description (VI)", type: "textarea", rows: 2 },
        { name: "timeLimitSeconds", label: "Time limit (seconds)", type: "number", required: true },
        { name: "passScore", label: "Pass score", type: "number", required: true },
        { name: "lessonHref", label: "Lesson link", type: "text", help: "e.g. /grammar/present-perfect" },
        { name: "nextHref", label: "Next link", type: "text" },
        { name: "nextLabel", label: "Next label", type: "text" },
        { name: "encouragementEn", label: "Encouragement (EN)", type: "textarea", rows: 2 },
        { name: "encouragementVi", label: "Encouragement (VI)", type: "textarea", rows: 2 },
        { name: "questionTypes", label: "Question type tags (JSON)", type: "json", rows: 5, help: "[{ id, label }]" },
        { name: "questions", label: "Questions (JSON)", type: "json", rows: 16, help: "types: multiple_choice | fill_blank | correct_sentence — see payload shapes in the template" },
      ];
    case "vocabulary":
      return [
        { name: "id", label: "Set id (slug)", type: "text", required: true, lockOnEdit: true },
        { name: "title", label: "Title", type: "text", required: true },
        { name: "titleVi", label: "Title (VI)", type: "text" },
        { name: "topic", label: "Topic", type: "text", required: true, help: "Must match an id in content/topics.json" },
        { name: "level", label: "Level", type: "select", options: CEFR_OPTIONS, required: true },
        { name: "sortOrder", label: "Sort order", type: "number" },
        {
          name: "reviewSummary",
          label: "Review / source (read-only)",
          type: "text",
          lockOnEdit: true,
          help: "Aggregate of word reviewStatus + source — edit per word in the JSON below",
        },
        {
          name: "words",
          label: "Words (JSON)",
          type: "json",
          rows: 16,
          help: "[{ word, partOfSpeech, meaningVi, level, ipa?, definitionEn?, examples?, source?, sortOrder?, reviewStatus?, ipaStatus? }] — id / wordSetId optional",
        },
      ];
  }
}

const j = (v: unknown) => JSON.stringify(v, null, 2);

/** Starter values for the "new" form. */
export function defaultValues(kind: ContentKind): FormValues {
  switch (kind) {
    case "grammar":
      return {
        slug: "", title: "", level: "A1", groupId: "", sortOrder: "1", readMinutes: "4",
        introEn: "", introVi: "", useWhenEn: "", useWhenVi: "",
        practiceQuizSlug: "", practiceQuestionCount: "10", practiceMinutes: "5",
        structure: j([{ formula: "Subject + verb", explanation: "Explain the pattern here." }]),
        examples: j([{ sentence: "Example sentence.", explanation: "Why it works." }]),
        mistakes: j([]),
      };
    case "reading":
      return {
        slug: "", title: "", topic: "Daily life", level: "A1", minutes: "3",
        wordCount: "0", newWordCount: "0", familyLabel: "", sortOrder: "1",
        paragraphs: j([
          { vi: "Bản dịch tiếng Việt.", segments: [{ type: "text", text: "First paragraph. " }, { type: "vocab", vocabId: "v1" }, { type: "text", text: " ends here." }] },
        ]),
        vocabulary: j([{ id: "v1", word: "example", ipa: "/ɪɡˈzɑːmpl/", partOfSpeech: "noun", meaningVi: "ví dụ", level: "A1" }]),
        questions: j([{ prompt: "What is the passage about?", choices: ["A", "B", "C"], correctIndex: 0 }]),
      };
    case "listening":
      return {
        slug: "", title: "", topic: "Daily life", level: "A1", durationSeconds: "60",
        audioPath: "", speakers: "2", accent: "", familyLabel: "", sortOrder: "1",
        transcript: j([{ speaker: "A", text: "Hello!", startMs: 0, endMs: 1500 }]),
        blanks: j([{ promptBefore: "Say", promptAfter: "to everyone.", answer: "hello", accept: null }]),
      };
    case "quiz":
      return {
        slug: "", title: "", level: "A1", kickEn: "", kickVi: "", breadcrumb: "",
        descriptionEn: "", descriptionVi: "", timeLimitSeconds: "600", passScore: "7",
        lessonHref: "", nextHref: "", nextLabel: "", encouragementEn: "", encouragementVi: "",
        questionTypes: j(QUIZ_TYPE_TAGS),
        questions: j([
          {
            type: "multiple_choice", instructionVi: "Chọn đáp án đúng", explanationEn: "", explanationVi: "",
            reviewBefore: "", reviewAfter: "",
            payload: { stemBefore: "I", stemAfter: "to school.", options: ["go", "goes"], correctIndex: 0 },
          },
        ]),
      };
    case "vocabulary":
      return {
        id: "", title: "", titleVi: "", topic: "Daily life", level: "A1",
        sortOrder: "0",
        reviewSummary: "",
        words: j([{
          word: "example", partOfSpeech: "noun", level: "A1", meaningVi: "ví dụ",
          ipa: "", definitionEn: "", examples: [], source: "admin",
          reviewStatus: "human_reviewed", sortOrder: 0,
        }]),
      };
  }
}

export function entityToValues(
  kind: ContentKind,
  entity: unknown,
): FormValues {
  const out: FormValues = {};
  const e = entity as Record<string, unknown>;
  const spec = fieldsFor(kind, { groups: [] });
  if (kind === "vocabulary") {
    const b = entity as WordSetBundle;
    const reviewCounts = b.words.reduce<Record<string, number>>((acc, w) => {
      const key = `${w.reviewStatus ?? "human_reviewed"}/${w.source ?? "admin"}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const reviewSummary =
      Object.entries(reviewCounts)
        .map(([k, n]) => `${n}× ${k}`)
        .join(", ") || "no words";
    return {
      id: b.set.id,
      title: b.set.title,
      titleVi: b.set.titleVi,
      topic: b.set.topic,
      level: b.set.level,
      sortOrder: String(b.set.sortOrder ?? 0),
      reviewSummary,
      words: j(
        b.words.map((w) => ({
          id: w.id,
          word: w.word,
          ipa: w.ipa,
          partOfSpeech: w.partOfSpeech,
          level: w.level,
          meaningVi: w.meaningVi,
          definitionEn: w.definitionEn,
          examples: w.examples,
          collocations: w.collocations ?? null,
          notes: w.notes ?? null,
          source: w.source ?? "admin",
          sortOrder: w.sortOrder ?? 0,
          reviewStatus: w.reviewStatus ?? "human_reviewed",
          ipaStatus: w.ipaStatus ?? null,
        })),
      ),
    };
  }
  for (const f of spec) {
    const v = e[f.name];
    out[f.name] =
      f.type === "json"
        ? j(v ?? [])
        : v === null || v === undefined
          ? ""
          : String(v);
  }
  return out;
}

/* ── values → entity ─────────────────────────────────────────── */

export function zodToFieldErrors(err: z.ZodError): ActionError {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.map(String);
    const key = path[0] ?? "_form";
    const where = path.length > 1 ? `${path.slice(1).join(".")}: ` : "";
    (fieldErrors[key] ??= []).push(`${where}${issue.message}`);
  }
  const first = err.issues[0];
  const firstPath = first?.path.length ? `${first.path.join(".")}: ` : "";
  return new ActionError(`${firstPath}${first?.message ?? "Invalid input"}`, {
    code: "VALIDATION",
    fieldErrors,
  });
}

class FieldCollector {
  errors: Record<string, string[]> = {};
  constructor(private values: FormValues) {}

  str(name: string): string {
    return (this.values[name] ?? "").trim();
  }
  raw(name: string): string {
    return this.values[name] ?? "";
  }
  num(name: string): number {
    const s = this.str(name);
    const n = Number(s);
    if (s === "" || !Number.isFinite(n)) {
      (this.errors[name] ??= []).push("Must be a number");
      return 0;
    }
    return n;
  }
  json(name: string): unknown {
    const s = this.str(name);
    if (s === "") return [];
    try {
      return JSON.parse(s);
    } catch (err) {
      (this.errors[name] ??= []).push(`Invalid JSON: ${(err as Error).message}`);
      return [];
    }
  }
  throwIfAny() {
    const keys = Object.keys(this.errors);
    if (keys.length) {
      throw new ActionError(this.errors[keys[0]!]![0]!, {
        code: "VALIDATION",
        fieldErrors: this.errors,
      });
    }
  }
}

function fillChildren(
  raw: unknown,
  idPrefix: string,
  opts: { sortOrder?: boolean; defaults?: Record<string, unknown> } = {},
): unknown {
  if (!Array.isArray(raw)) return raw;
  return raw.map((item, i) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return item;
    }
    const obj: Record<string, unknown> = {
      ...(opts.defaults ?? {}),
      ...(item as Record<string, unknown>),
    };
    if (obj.id === undefined || obj.id === "") obj.id = `${idPrefix}${i + 1}`;
    if (opts.sortOrder !== false && obj.sortOrder === undefined) {
      obj.sortOrder = i + 1;
    }
    return obj;
  });
}


/**
 * Vocab ids are global primary keys. Short ids the admin types ("v1") are
 * namespaced as `<passageId>:v1` (and paragraph segments follow); ids that
 * already contain ":" are left alone so exports round-trip untouched.
 */
function namespaceVocabIds<T extends { vocabulary: unknown; paragraphs: unknown }>(
  draft: T,
  passageId: string,
): T {
  if (!Array.isArray(draft.vocabulary) || !Array.isArray(draft.paragraphs)) {
    return draft;
  }
  const map = new Map<string, string>();
  const vocabulary = draft.vocabulary.map((v) => {
    if (!v || typeof v !== "object") return v;
    const id = (v as { id?: unknown }).id;
    if (typeof id !== "string" || id.includes(":")) return v;
    const next = `${passageId}:${id}`;
    map.set(id, next);
    return { ...(v as object), id: next };
  });
  const paragraphs = draft.paragraphs.map((p) => {
    if (!p || typeof p !== "object") return p;
    const segments = (p as { segments?: unknown }).segments;
    if (!Array.isArray(segments)) return p;
    return {
      ...(p as object),
      segments: segments.map((seg) => {
        if (
          seg &&
          typeof seg === "object" &&
          (seg as { type?: unknown }).type === "vocab" &&
          map.has(String((seg as { vocabId?: unknown }).vocabId))
        ) {
          return {
            ...(seg as object),
            vocabId: map.get(String((seg as { vocabId?: unknown }).vocabId)),
          };
        }
        return seg;
      }),
    };
  });
  return { ...draft, vocabulary, paragraphs };
}

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const res = schema.safeParse(data);
  if (!res.success) throw zodToFieldErrors(res.error);
  return res.data;
}

export type BuildOptions = {
  /** Existing entity id when editing (keeps id + slug stable). */
  existingId?: string;
  groups: FormContext["groups"];
};

export function buildGrammarLesson(
  values: FormValues,
  opts: BuildOptions,
): GrammarLessonEntity {
  const c = new FieldCollector(values);
  const slug = c.str("slug");
  const groupId = c.str("groupId");
  const group = opts.groups.find((g) => g.id === groupId);
  if (!group) (c.errors.groupId ??= []).push("Choose a family / group");
  const draft = {
    id: opts.existingId ?? slug,
    slug,
    title: c.str("title"),
    level: c.str("level"),
    familyId: group?.familyId ?? "",
    groupId,
    sortOrder: c.num("sortOrder"),
    readMinutes: c.num("readMinutes"),
    introEn: c.raw("introEn"),
    introVi: c.raw("introVi"),
    useWhenEn: c.raw("useWhenEn"),
    useWhenVi: c.raw("useWhenVi"),
    structure: c.json("structure"),
    examples: c.json("examples"),
    mistakes: c.json("mistakes"),
    practiceQuizSlug: c.str("practiceQuizSlug") || null,
    practiceQuestionCount: c.num("practiceQuestionCount"),
    practiceMinutes: c.num("practiceMinutes"),
  };
  c.throwIfAny();
  return parse(grammarLessonSchema, draft);
}

export function buildReadingPassage(
  values: FormValues,
  opts: BuildOptions,
): ReadingPassageEntity {
  const c = new FieldCollector(values);
  const slug = c.str("slug");
  const id = opts.existingId ?? slug;
  const draft = {
    id,
    slug,
    title: c.str("title"),
    topic: c.str("topic"),
    level: c.str("level"),
    minutes: c.num("minutes"),
    wordCount: c.str("wordCount") === "" ? 0 : c.num("wordCount"),
    newWordCount: c.str("newWordCount") === "" ? 0 : c.num("newWordCount"),
    familyLabel: c.raw("familyLabel"),
    sortOrder: c.num("sortOrder"),
    paragraphs: fillChildren(c.json("paragraphs"), `${id}:p`),
    vocabulary: fillChildren(c.json("vocabulary"), `${id}:v`, {
      sortOrder: false,
      defaults: { ipa: "" },
    }),
    questions: fillChildren(c.json("questions"), `${id}:q`),
  };
  c.throwIfAny();
  return parse(readingPassageSchema, namespaceVocabIds(draft, id));
}

export function buildListeningLesson(
  values: FormValues,
  opts: BuildOptions,
): ListeningLessonEntity {
  const c = new FieldCollector(values);
  const slug = c.str("slug");
  const id = opts.existingId ?? slug;
  const draft = {
    id,
    slug,
    title: c.str("title"),
    topic: c.str("topic"),
    level: c.str("level"),
    durationSeconds: c.num("durationSeconds"),
    audioPath: c.str("audioPath"),
    speakers: c.num("speakers"),
    accent: c.raw("accent"),
    familyLabel: c.raw("familyLabel"),
    sortOrder: c.num("sortOrder"),
    transcript: fillChildren(c.json("transcript"), `${id}:s`),
    blanks: fillChildren(c.json("blanks"), `${id}:b`),
  };
  c.throwIfAny();
  return parse(listeningLessonSchema, draft);
}

export function buildQuiz(values: FormValues, opts: BuildOptions): QuizEntity {
  const c = new FieldCollector(values);
  const slug = c.str("slug");
  const id = opts.existingId ?? slug;
  const draft = {
    id,
    slug,
    title: c.str("title"),
    kickEn: c.raw("kickEn"),
    kickVi: c.raw("kickVi"),
    breadcrumb: c.raw("breadcrumb"),
    level: c.str("level"),
    descriptionEn: c.raw("descriptionEn"),
    descriptionVi: c.raw("descriptionVi"),
    timeLimitSeconds: c.num("timeLimitSeconds"),
    passScore: c.num("passScore"),
    questionTypes: c.json("questionTypes"),
    lessonHref: c.raw("lessonHref"),
    nextHref: c.raw("nextHref"),
    nextLabel: c.raw("nextLabel"),
    encouragementEn: c.raw("encouragementEn"),
    encouragementVi: c.raw("encouragementVi"),
    questions: fillChildren(c.json("questions"), `${slug}:q`, {
      defaults: { reviewBefore: "", reviewAfter: "" },
    }),
  };
  c.throwIfAny();
  return parse(quizSchema, draft);
}

export function buildWordSetBundle(
  values: FormValues,
  opts: BuildOptions,
): WordSetBundle {
  const c = new FieldCollector(values);
  const id = opts.existingId ?? c.str("id");
  const rawWords = c.json("words");
  const words = fillChildren(rawWords, `${id}:w`, {
    sortOrder: false,
    defaults: { ipa: "", definitionEn: "", examples: [], wordSetId: id },
  });
  const sortRaw = c.raw("sortOrder");
  const draft = {
    set: {
      id,
      title: c.str("title"),
      titleVi: c.raw("titleVi"),
      topic: c.str("topic"),
      level: c.str("level"),
      sortOrder: sortRaw === "" ? 0 : Number(sortRaw),
    },
    words: Array.isArray(words)
      ? words.map((w) =>
          w && typeof w === "object"
            ? { ...(w as object), wordSetId: id, source: (w as { source?: string }).source ?? "admin" }
            : w,
        )
      : words,
  };
  c.throwIfAny();
  return parse(wordSetBundleSchema, draft);
}

export function buildEntity(
  kind: ContentKind,
  values: FormValues,
  opts: BuildOptions,
) {
  switch (kind) {
    case "grammar":
      return buildGrammarLesson(values, opts);
    case "reading":
      return buildReadingPassage(values, opts);
    case "listening":
      return buildListeningLesson(values, opts);
    case "quiz":
      return buildQuiz(values, opts);
    case "vocabulary":
      return buildWordSetBundle(values, opts);
  }
}
