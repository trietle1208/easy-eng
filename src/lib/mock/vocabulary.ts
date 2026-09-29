import type { CefrLevel } from "@/types/cefr";
import type {
  NewWordInput,
  ReviewDue,
  Word,
  WordSet,
} from "@/types/vocabulary";

export const mockWordSets: WordSet[] = [
  {
    id: "at-the-airport",
    title: "At the airport",
    titleVi: "Ở sân bay",
    topic: "Travel",
    level: "A2",
    wordCount: 30,
    learnedCount: 14,
    status: "active",
  },
  {
    id: "morning-routines",
    title: "Morning routines",
    titleVi: "Thói quen buổi sáng",
    topic: "Daily life",
    level: "A1",
    wordCount: 24,
    learnedCount: 24,
    status: "done",
  },
  {
    id: "job-interviews",
    title: "Job interviews",
    titleVi: "Phỏng vấn xin việc",
    topic: "Work",
    level: "B1",
    wordCount: 40,
    learnedCount: 0,
    status: "new",
  },
  {
    id: "vietnamese-street-food",
    title: "Vietnamese street food",
    titleVi: "Ẩm thực đường phố",
    topic: "Food",
    level: "A2",
    wordCount: 28,
    learnedCount: 8,
    status: "active",
  },
  {
    id: "office-small-talk",
    title: "Office small talk",
    titleVi: "Trò chuyện nơi công sở",
    topic: "Work",
    level: "B2",
    wordCount: 35,
    learnedCount: 12,
    status: "active",
  },
  {
    id: "booking-a-hotel",
    title: "Booking a hotel",
    titleVi: "Đặt phòng khách sạn",
    topic: "Travel",
    level: "A2",
    wordCount: 26,
    learnedCount: 20,
    status: "active",
  },
  {
    id: "feelings-moods",
    title: "Feelings & moods",
    titleVi: "Cảm xúc và tâm trạng",
    topic: "Daily life",
    level: "B1",
    wordCount: 32,
    learnedCount: 0,
    status: "new",
  },
  {
    id: "in-the-kitchen",
    title: "In the kitchen",
    titleVi: "Trong nhà bếp",
    topic: "Food",
    level: "A1",
    wordCount: 22,
    learnedCount: 16,
    status: "active",
  },
  {
    id: "negotiating-a-deal",
    title: "Negotiating a deal",
    titleVi: "Đàm phán hợp đồng",
    topic: "Work",
    level: "C1",
    wordCount: 38,
    learnedCount: 0,
    status: "new",
  },
];

export const topicCounts = {
  all: 86,
  "Daily life": 18,
  Work: 14,
  Travel: 12,
  Food: 10,
  Health: 8,
  School: 7,
  Technology: 9,
  Feelings: 8,
} as const;

let words: Word[] = [
  {
    id: "w-itinerary",
    word: "itinerary",
    ipa: "/aɪˈtɪn.ər.ər.i/",
    partOfSpeech: "noun",
    level: "A2",
    meaningVi: "lịch trình (chuyến đi)",
    definitionEn: "a detailed plan of a journey, with places and times",
    examples: [
      {
        en: "Could you email me the itinerary for our trip?",
        vi: "Bạn gửi email cho mình lịch trình chuyến đi nhé?",
      },
      {
        en: "Our itinerary includes two days in Hội An.",
        vi: "Lịch trình của chúng tôi có hai ngày ở Hội An.",
      },
    ],
    wordSetId: "at-the-airport",
    collocations: [
      "travel itinerary",
      "a detailed itinerary",
      "plan an itinerary",
    ],
    createdAt: "2026-09-20T08:00:00.000Z",
  },
  {
    id: "w-boarding-pass",
    word: "boarding pass",
    ipa: "/ˈbɔː.dɪŋ ˌpɑːs/",
    partOfSpeech: "noun",
    level: "A2",
    meaningVi: "thẻ lên máy bay",
    definitionEn: "a document that lets you board a plane",
    examples: [
      {
        en: "Please show your boarding pass at the gate.",
        vi: "Vui lòng xuất trình thẻ lên máy bay tại cổng.",
      },
    ],
    wordSetId: "at-the-airport",
    createdAt: "2026-09-21T08:00:00.000Z",
  },
  {
    id: "w-gate",
    word: "gate",
    ipa: "/ɡeɪt/",
    partOfSpeech: "noun",
    level: "A1",
    meaningVi: "cổng (sân bay)",
    definitionEn: "the place where passengers board the plane",
    examples: [
      {
        en: "Our flight leaves from gate 12.",
        vi: "Chuyến bay của chúng ta khởi hành từ cổng 12.",
      },
    ],
    wordSetId: "at-the-airport",
    createdAt: "2026-09-22T08:00:00.000Z",
  },
];

let savedCount = 1284;
let todayWords: Word[] = [];

export function listMockWords(): Word[] {
  return words;
}

export function listAddedToday(): Word[] {
  return todayWords;
}

export function getSavedCount(): number {
  return savedCount;
}

export function getReviewDueWord(): ReviewDue {
  const word = words[0]!;
  const set = mockWordSets.find((s) => s.id === word.wordSetId)!;
  return {
    count: 18,
    word,
    setTitle: set.title,
    cardIndex: 7,
    cardTotal: set.wordCount,
  };
}

function bumpSetWordCount(setId: string) {
  const set = mockWordSets.find((s) => s.id === setId);
  if (set) {
    set.wordCount += 1;
    if (set.status === "new") set.status = "active";
  }
}

export function createMockWordSet(title: string, level: CefrLevel): WordSet {
  const id =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `set-${Date.now()}`;
  const set: WordSet = {
    id,
    title,
    titleVi: title,
    topic: "Daily life",
    level,
    wordCount: 0,
    learnedCount: 0,
    status: "new",
  };
  mockWordSets.unshift(set);
  return set;
}

export function insertMockWord(input: NewWordInput): Word {
  let setId = input.wordSetId;
  if (!setId && input.newWordSetTitle) {
    setId = createMockWordSet(input.newWordSetTitle, input.level).id;
  }
  if (!setId) {
    throw new Error("wordSetId or newWordSetTitle is required");
  }

  const word: Word = {
    id: `w-${Date.now()}`,
    word: input.word.trim(),
    ipa: input.ipa?.trim() ?? "",
    partOfSpeech: input.partOfSpeech,
    level: input.level,
    meaningVi: input.meaningVi.trim(),
    definitionEn: input.definitionEn?.trim() ?? "",
    examples: (input.examples ?? [])
      .map((en) => en.trim())
      .filter(Boolean)
      .map((en) => ({ en })),
    wordSetId: setId,
    notes: input.notes?.trim() || undefined,
    imageUrl: input.imageUrl?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  words = [word, ...words];
  todayWords = [word, ...todayWords];
  savedCount += 1;
  bumpSetWordCount(setId);
  return word;
}
