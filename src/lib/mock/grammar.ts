import type {
  GrammarFamily,
  GrammarLesson,
  GrammarLessonSummary,
} from "@/types/grammar";
import type { CefrLevel } from "@/types/cefr";

function lesson(
  slug: string,
  title: string,
  level: CefrLevel,
  familyId: string,
  groupId: string,
): GrammarLessonSummary {
  return { slug, title, level, familyId, groupId };
}

const clauseLessons: GrammarLessonSummary[] = [
  lesson(
    "use-subject-verb-clauses",
    "Use subject + verb clauses",
    "A1",
    "sentence-foundations",
    "basic-clause-patterns",
  ),
  lesson(
    "use-subject-verb-object-clauses",
    "Use subject + verb + object clauses",
    "A1",
    "sentence-foundations",
    "basic-clause-patterns",
  ),
  lesson(
    "use-linking-verbs-with-complements",
    "Use linking verbs with complements",
    "A2",
    "sentence-foundations",
    "basic-clause-patterns",
  ),
  lesson(
    "use-verbs-with-two-objects",
    "Use verbs with two objects",
    "B1",
    "sentence-foundations",
    "basic-clause-patterns",
  ),
  lesson(
    "use-object-complements",
    "Use object complements",
    "B2",
    "sentence-foundations",
    "basic-clause-patterns",
  ),
];

const wordOrderLessons: GrammarLessonSummary[] = [
  lesson(
    "put-subjects-before-verbs",
    "Put subjects before verbs in statements",
    "A1",
    "sentence-foundations",
    "basic-word-order",
  ),
  lesson(
    "put-objects-after-transitive-verbs",
    "Put objects after transitive verbs",
    "A2",
    "sentence-foundations",
    "basic-word-order",
  ),
  lesson(
    "place-expressions-of-place-and-time",
    "Place expressions of place and time",
    "B1",
    "sentence-foundations",
    "basic-word-order",
  ),
  lesson(
    "order-manner-place-and-time",
    "Order manner, place and time adverbials",
    "B2",
    "sentence-foundations",
    "basic-word-order",
  ),
];

const beHaveDoLessons: GrammarLessonSummary[] = [
  lesson(
    "use-be-in-simple-sentences",
    "Use be in simple sentences",
    "A1",
    "sentence-foundations",
    "be-have-do",
  ),
  lesson(
    "use-have-for-possession",
    "Use have for possession",
    "A1",
    "sentence-foundations",
    "be-have-do",
  ),
  lesson(
    "use-do-for-emphasis",
    "Use do for emphasis",
    "A2",
    "sentence-foundations",
    "be-have-do",
  ),
  lesson(
    "choose-be-have-or-do",
    "Choose be, have or do",
    "A2",
    "sentence-foundations",
    "be-have-do",
  ),
];

const imperativeLessons: GrammarLessonSummary[] = [
  lesson(
    "give-simple-instructions",
    "Give simple instructions",
    "A1",
    "sentence-foundations",
    "imperatives",
  ),
  lesson(
    "make-polite-requests",
    "Make polite requests",
    "A2",
    "sentence-foundations",
    "imperatives",
  ),
  lesson(
    "use-negative-imperatives",
    "Use negative imperatives",
    "A2",
    "sentence-foundations",
    "imperatives",
  ),
  lesson(
    "soften-commands-with-please",
    "Soften commands with please",
    "B1",
    "sentence-foundations",
    "imperatives",
  ),
  lesson(
    "imperatives-for-directions",
    "Use imperatives for directions",
    "B1",
    "sentence-foundations",
    "imperatives",
  ),
];

const tenseLessons: GrammarLessonSummary[] = [
  lesson(
    "present-simple-habits",
    "Talk about habits with present simple",
    "A1",
    "tenses-time",
    "present-tenses",
  ),
  lesson(
    "present-continuous-now",
    "Describe actions happening now",
    "A1",
    "tenses-time",
    "present-tenses",
  ),
  lesson(
    "past-simple-finished",
    "Talk about finished past events",
    "A2",
    "tenses-time",
    "past-tenses",
  ),
  lesson(
    "present-perfect-vs-past-simple",
    "Present perfect vs. past simple",
    "B1",
    "tenses-time",
    "perfect-tenses",
  ),
  lesson(
    "future-plans-going-to",
    "Talk about plans with going to",
    "A2",
    "tenses-time",
    "future-forms",
  ),
];

export const mockGrammarFamilies: GrammarFamily[] = [
  {
    id: "sentence-foundations",
    title: "1. Sentence foundations",
    lessonCount: 18,
    groups: [
      {
        id: "basic-clause-patterns",
        title: "1.1 Basic clause patterns",
        lessons: clauseLessons,
      },
      {
        id: "basic-word-order",
        title: "1.2 Basic word order",
        lessons: wordOrderLessons,
      },
      {
        id: "be-have-do",
        title: "1.3 The verbs be, have and do",
        lessons: beHaveDoLessons,
      },
      {
        id: "imperatives",
        title: "1.4 Imperatives",
        lessons: imperativeLessons,
      },
    ],
  },
  {
    id: "tenses-time",
    title: "2. Tenses & time",
    lessonCount: 48,
    groups: [
      {
        id: "present-tenses",
        title: "2.1 Present tenses",
        lessons: tenseLessons.slice(0, 2),
      },
      {
        id: "past-tenses",
        title: "2.2 Past tenses",
        lessons: [tenseLessons[2]],
      },
      {
        id: "perfect-tenses",
        title: "2.3 Perfect tenses",
        lessons: [tenseLessons[3]],
      },
      {
        id: "future-forms",
        title: "2.4 Future forms",
        lessons: [tenseLessons[4]],
      },
    ],
  },
  {
    id: "questions-negatives",
    title: "3. Questions & negatives",
    lessonCount: 36,
    groups: [
      {
        id: "yes-no-questions",
        title: "3.1 Yes/no questions",
        lessons: [
          lesson(
            "form-yes-no-questions",
            "Form yes/no questions",
            "A1",
            "questions-negatives",
            "yes-no-questions",
          ),
          lesson(
            "answer-yes-no-short",
            "Give short yes/no answers",
            "A1",
            "questions-negatives",
            "yes-no-questions",
          ),
        ],
      },
    ],
  },
  {
    id: "modal-verbs",
    title: "4. Modal verbs",
    lessonCount: 41,
    groups: [
      {
        id: "ability-permission",
        title: "4.1 Ability & permission",
        lessons: [
          lesson(
            "can-for-ability",
            "Use can for ability",
            "A1",
            "modal-verbs",
            "ability-permission",
          ),
          lesson(
            "could-for-past-ability",
            "Use could for past ability",
            "A2",
            "modal-verbs",
            "ability-permission",
          ),
        ],
      },
    ],
  },
  {
    id: "nouns-determiners",
    title: "5. Nouns & determiners",
    lessonCount: 52,
    groups: [
      {
        id: "articles",
        title: "5.1 Articles",
        lessons: [
          lesson(
            "a-an-with-singular",
            "Use a/an with singular nouns",
            "A1",
            "nouns-determiners",
            "articles",
          ),
        ],
      },
    ],
  },
  {
    id: "adjectives-adverbs",
    title: "6. Adjectives & adverbs",
    lessonCount: 39,
    groups: [
      {
        id: "adjective-order",
        title: "6.1 Adjective order",
        lessons: [
          lesson(
            "order-opinion-fact-adjectives",
            "Order opinion and fact adjectives",
            "B1",
            "adjectives-adverbs",
            "adjective-order",
          ),
        ],
      },
    ],
  },
  {
    id: "clauses-linking",
    title: "7. Clauses & linking",
    lessonCount: 57,
    groups: [
      {
        id: "coordinating",
        title: "7.1 Coordinating conjunctions",
        lessons: [
          lesson(
            "link-ideas-with-and-but",
            "Link ideas with and / but",
            "A2",
            "clauses-linking",
            "coordinating",
          ),
        ],
      },
    ],
  },
];

/** Display counts matching the mockup sidebar chips (catalog totals). */
export const mockLevelCatalogCounts: Record<CefrLevel | "all", number> = {
  all: 474,
  A1: 30,
  A2: 56,
  B1: 126,
  B2: 149,
  C1: 113,
};

export const FIRST_GRAMMAR_LESSON_SLUG = "use-subject-verb-clauses";

function stubLesson(summary: GrammarLessonSummary): GrammarLesson {
  const family = mockGrammarFamilies.find((f) => f.id === summary.familyId)!;
  const group = family.groups.find((g) => g.id === summary.groupId)!;
  const index = group.lessons.findIndex((l) => l.slug === summary.slug) + 1;

  return {
    slug: summary.slug,
    title: summary.title,
    level: summary.level,
    familyId: family.id,
    familyTitle: family.title.replace(/^\d+\.\s*/, ""),
    groupId: group.id,
    groupTitle: group.title,
    groupIndex: index,
    groupTotal: group.lessons.length,
    readMinutes: 4,
    introEn: `${summary.title} helps you build clearer English sentences step by step.`,
    introVi: "Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.",
    useWhenEn: "you practise this pattern in everyday speaking and writing.",
    useWhenVi: "Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.",
    structure: [
      {
        formula: "Subject + Verb (+ …)",
        explanation:
          "Start with who or what, then the action. Add detail only when needed.",
      },
    ],
    examples: [
      {
        sentence: "I practise every day.",
        explanation: "A simple complete sentence. · Tôi luyện tập mỗi ngày.",
      },
      {
        sentence: "They arrived early.",
        explanation: "Subject + verb is enough. · Họ đã đến sớm.",
      },
    ],
    mistakes: [
      {
        before: "She ",
        wrong: "go",
        after: " home late.",
        correct: "goes",
        noteEn: "He / she / it needs -s!",
        noteVi: "Ngôi thứ 3 số ít: thêm -s / -es.",
      },
    ],
    practiceQuizSlug: summary.slug,
    practiceQuestionCount: 10,
    practiceMinutes: 5,
  };
}

const featuredLesson: GrammarLesson = {
  slug: "use-subject-verb-clauses",
  title: "Use subject + verb clauses",
  level: "A1",
  familyId: "sentence-foundations",
  familyTitle: "Sentence foundations",
  groupId: "basic-clause-patterns",
  groupTitle: "1.1 · Basic clause patterns",
  groupIndex: 1,
  groupTotal: 5,
  readMinutes: 4,
  introEn:
    "A subject + verb clause is the simplest complete sentence in English. It tells us who or what (the subject) and what they do (the verb). Some verbs need nothing after them: She smiled. The bus arrived.",
  introVi:
    "Câu đơn giản nhất = Ai / Cái gì + làm gì. Tiếng Anh luôn cần đủ cả hai phần.",
  useWhenEn: "you make simple statements about actions and events.",
  useWhenVi: "Dùng khi kể về hành động, sự việc đơn giản.",
  structure: [
    {
      formula: "Subject + Verb",
      explanation:
        "The subject is usually a noun or pronoun. The verb tells us the action or state.",
    },
    {
      formula: "He / She / It + Verb-s / -es",
      explanation:
        "In the present simple, add -s or -es after he, she, it and singular nouns. — Ngôi thứ ba số ít thêm -s/-es.",
    },
    {
      formula: "Subject + Verb + (place / time)",
      explanation:
        "You can add where or when — but the sentence is already complete without it.",
    },
  ],
  examples: [
    {
      sentence: "I run every morning.",
      explanation:
        'Subject “I” + verb “run” — a daily habit. · Tôi chạy bộ mỗi sáng.',
    },
    {
      sentence: "The baby cried.",
      explanation:
        'Subject “The baby” + verb “cried” — a finished action; nothing else is needed. · Em bé đã khóc.',
    },
    {
      sentence: "She works at a bakery.",
      explanation:
        'He / she / it → “works” with -s. · Cô ấy làm việc ở tiệm bánh.',
    },
    {
      sentence: "Prices went up last year.",
      explanation:
        'Subject “Prices” + verb “went up”; “last year” only adds time. · Giá cả đã tăng vào năm ngoái.',
    },
    {
      sentence: "We live near the river.",
      explanation:
        'Subject “We” + verb “live”; “near the river” adds place. · Chúng tôi sống gần sông.',
    },
  ],
  mistakes: [
    {
      before: "She ",
      wrong: "go",
      after: " to school by bus.",
      correct: "goes",
      noteEn: "He / she / it needs -s!",
      noteVi: "Ngôi thứ 3 số ít: thêm -s / -es.",
    },
    {
      before: "",
      wrong: "Rains",
      after: " a lot in Huế in October.",
      correct: "It rains",
      noteEn: "English always needs a subject — even for weather!",
      noteVi: "Không bỏ chủ ngữ: dùng “It”.",
    },
    {
      before: "The children ",
      wrong: "",
      after: " very happy today.",
      correct: "are",
      noteEn: "Adjectives aren't verbs — add be.",
      noteVi: "Tính từ cần “to be” đi kèm.",
      missing: true,
    },
  ],
  practiceQuizSlug: "use-subject-verb-clauses",
  practiceQuestionCount: 10,
  practiceMinutes: 5,
};

const svoLesson: GrammarLesson = {
  ...stubLesson(clauseLessons[1]),
  title: "Use subject + verb + object clauses",
  introEn:
    "Many verbs need an object — someone or something that receives the action. Pattern: Subject + Verb + Object.",
  introVi: "Nhiều động từ cần tân ngữ — ai/cái gì nhận hành động.",
  structure: [
    {
      formula: "Subject + Verb + Object",
      explanation: "The object answers “who?” or “what?” after the verb.",
    },
    {
      formula: "Subject + Verb + someone / something",
      explanation: "Objects are usually nouns, pronouns, or noun phrases.",
    },
  ],
  examples: [
    {
      sentence: "I read a book.",
      explanation: "“a book” is the object. · Tôi đọc một cuốn sách.",
    },
    {
      sentence: "She called her friend.",
      explanation: "“her friend” receives the action. · Cô ấy gọi bạn.",
    },
  ],
};

const linkingLesson: GrammarLesson = {
  ...stubLesson(clauseLessons[2]),
  title: "Use linking verbs with complements",
  introEn:
    "Linking verbs connect the subject to a description: be, seem, feel, look, become.",
  introVi: "Động từ nối liên kết chủ ngữ với phần mô tả.",
  structure: [
    {
      formula: "Subject + Linking verb + Complement",
      explanation: "The complement describes or renames the subject.",
    },
  ],
  examples: [
    {
      sentence: "The soup tastes great.",
      explanation: "“tastes” links subject to the adjective. · Súp rất ngon.",
    },
  ],
};

const presentPerfectLesson: GrammarLesson = {
  ...stubLesson(tenseLessons[3]),
  title: "Present perfect vs. past simple",
  level: "B1",
  introEn:
    "Use present perfect for experience or results that connect to now; past simple for finished time.",
  introVi:
    "Present perfect nối với hiện tại; past simple cho thời điểm đã kết thúc.",
  structure: [
    {
      formula: "have / has + past participle",
      explanation: "Present perfect focuses on the result or experience.",
    },
    {
      formula: "Verb-ed / irregular past",
      explanation: "Past simple needs a finished time (yesterday, in 2019…).",
    },
  ],
  examples: [
    {
      sentence: "I have visited Đà Nẵng.",
      explanation: "Experience — time not specified. · Tôi đã từng đến Đà Nẵng.",
    },
    {
      sentence: "I visited Đà Nẵng last year.",
      explanation: "Finished time with “last year”. · Tôi đến Đà Nẵng năm ngoái.",
    },
  ],
  mistakes: [
    {
      before: "I ",
      wrong: "have seen",
      after: " her yesterday.",
      correct: "saw",
      noteEn: "Yesterday → past simple!",
      noteVi: "Có mốc thời gian cụ thể → dùng past simple.",
    },
  ],
};

const detailedBySlug: Record<string, GrammarLesson> = {
  [featuredLesson.slug]: featuredLesson,
  [svoLesson.slug]: svoLesson,
  [linkingLesson.slug]: linkingLesson,
  [presentPerfectLesson.slug]: presentPerfectLesson,
};

export function allLessonSummaries(): GrammarLessonSummary[] {
  return mockGrammarFamilies.flatMap((family) =>
    family.groups.flatMap((group) => group.lessons),
  );
}

export function getMockLesson(slug: string): GrammarLesson | null {
  if (detailedBySlug[slug]) return detailedBySlug[slug];
  const summary = allLessonSummaries().find((l) => l.slug === slug);
  return summary ? stubLesson(summary) : null;
}
