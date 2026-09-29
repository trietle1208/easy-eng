import type {
  ReadingPassage,
  ReadingPassageSummary,
  VocabHighlight,
} from "@/types/reading";

const nightBusVocab: VocabHighlight[] = [
  {
    id: "winding",
    word: "winding",
    ipa: "/ˈwaɪn.dɪŋ/",
    partOfSpeech: "adj.",
    meaningVi: "quanh co, uốn lượn",
    level: "B1",
  },
  {
    id: "drowsy",
    word: "drowsy",
    ipa: "/ˈdraʊ.zi/",
    partOfSpeech: "adj.",
    meaningVi: "buồn ngủ, uể oải",
    level: "B1",
  },
  {
    id: "scenery",
    word: "scenery",
    ipa: "/ˈsiː.nər.i/",
    partOfSpeech: "noun",
    meaningVi: "phong cảnh, cảnh vật",
    level: "A2",
  },
  {
    id: "reluctantly",
    word: "reluctantly",
    ipa: "/rɪˈlʌk.tənt.li/",
    partOfSpeech: "adv.",
    meaningVi: "miễn cưỡng, bất đắc dĩ",
    level: "B1",
  },
  {
    id: "vendor",
    word: "vendor",
    ipa: "/ˈven.dər/",
    partOfSpeech: "noun",
    meaningVi: "người bán hàng (rong)",
    level: "B1",
  },
  {
    id: "breathtaking",
    word: "breathtaking",
    ipa: "/ˈbreθˌteɪ.kɪŋ/",
    partOfSpeech: "adj.",
    meaningVi: "đẹp đến nghẹt thở, ngoạn mục",
    level: "B2",
  },
];

const nightBus: ReadingPassage = {
  slug: "the-night-bus-to-da-lat",
  title: "The Night Bus to Đà Lạt",
  topic: "Travel",
  level: "B1",
  minutes: 4,
  completed: false,
  inProgress: true,
  wordCount: 212,
  newWordCount: 6,
  familyLabel: "Travel · Passage 3 of 7",
  indexInTopic: 3,
  topicTotal: 7,
  vocabulary: nightBusVocab,
  paragraphs: [
    {
      id: "p1",
      segments: [
        {
          type: "text",
          text: "Last December, Minh decided to visit Đà Lạt for the first time. Flights were expensive during the holidays, so he booked a seat on the night bus from Saigon. The bus left at ten o’clock, and most passengers fell asleep before it reached the edge of the city.",
        },
      ],
      vi: "Tháng Mười Hai năm ngoái, Minh quyết định đến Đà Lạt lần đầu. Vé máy bay dịp lễ rất đắt nên anh đặt một chỗ trên xe khách đêm từ Sài Gòn. Xe chạy lúc mười giờ, và hầu hết hành khách đã ngủ trước khi ra khỏi thành phố.",
    },
    {
      id: "p2",
      segments: [
        { type: "text", text: "Around midnight the road became " },
        { type: "vocab", vocabId: "winding" },
        {
          type: "text",
          text: " as the bus began to climb into the mountains. He felt a little ",
        },
        { type: "vocab", vocabId: "drowsy" },
        { type: "text", text: ", but the sharp turns kept waking him up." },
      ],
      vi: "Khoảng nửa đêm đường trở nên quanh co khi xe bắt đầu leo núi. Anh hơi buồn ngủ, nhưng những khúc cua gắt liên tục đánh thức anh.",
    },
    {
      id: "p3",
      segments: [
        { type: "text", text: "When the sun came up, the " },
        { type: "vocab", vocabId: "scenery" },
        {
          type: "text",
          text: " outside had completely changed. Instead of rice fields, there were pine forests covered in thin mist. The air coming through the window was cool — almost cold. Minh ",
        },
        { type: "vocab", vocabId: "reluctantly" },
        {
          type: "text",
          text: " put on the jacket his mother had packed for him.",
        },
      ],
      vi: "Khi mặt trời lên, cảnh vật bên ngoài đã hoàn toàn thay đổi. Thay cho ruộng lúa là những rừng thông phủ sương mỏng. Không khí lùa qua cửa sổ mát lạnh — gần như lạnh. Minh miễn cưỡng mặc chiếc áo khoác mà mẹ đã xếp cho anh.",
    },
    {
      id: "p4",
      segments: [
        { type: "text", text: "The bus arrived at seven. A street " },
        { type: "vocab", vocabId: "vendor" },
        {
          type: "text",
          text: " near the station was selling hot soy milk and grilled rice paper. Minh bought both, sat on a small plastic stool, and looked at the hills. The trip had been long, but the view was ",
        },
        { type: "vocab", vocabId: "breathtaking" },
        { type: "text", text: "." },
      ],
      vi: "Xe đến nơi lúc bảy giờ. Một người bán hàng rong gần bến xe đang bán sữa đậu nành nóng và bánh tráng nướng. Minh mua cả hai, ngồi trên chiếc ghế nhựa nhỏ và ngắm đồi núi. Chuyến đi thật dài, nhưng khung cảnh thì đẹp đến ngỡ ngàng.",
    },
  ],
  questions: [
    {
      id: "q1",
      prompt: "Why did Minh take the night bus?",
      choices: [
        "He wanted to sleep on the way",
        "Flights were expensive during the holidays",
        "His mother booked the ticket",
        "There were no flights to Đà Lạt",
      ],
      correctIndex: 1,
    },
    {
      id: "q2",
      prompt: "What kept waking Minh up?",
      choices: [
        "The podcast he was listening to",
        "The lights of the small towns",
        "The sharp turns on the mountain road",
        "The cold air from the window",
      ],
      correctIndex: 2,
    },
    {
      id: "q3",
      prompt: "“Minh reluctantly put on the jacket” means he put it on…",
      choices: [
        "happily",
        "very quickly",
        "without really wanting to",
        "because it was new",
      ],
      correctIndex: 2,
    },
    {
      id: "q4",
      prompt: "What did Minh do when he arrived?",
      choices: [
        "He went straight to his hotel",
        "He had breakfast from a street vendor",
        "He took photos of the station",
        "He called his mother",
      ],
      correctIndex: 1,
    },
  ],
};

function stubPassage(
  summary: ReadingPassageSummary,
  extras?: Partial<ReadingPassage>,
): ReadingPassage {
  return {
    ...summary,
    wordCount: 180,
    newWordCount: 4,
    familyLabel: `${summary.topic} · Passage`,
    indexInTopic: 1,
    topicTotal: 5,
    vocabulary: [],
    paragraphs: [
      {
        id: "p1",
        segments: [
          {
            type: "text",
            text: `${summary.title} — open this card to practise everyday English reading. Full story content is available for The Night Bus to Đà Lạt.`,
          },
        ],
        vi: "Bản dịch tiếng Việt sẽ hiện khi bạn bật nút dịch.",
      },
    ],
    questions: [
      {
        id: "q1",
        prompt: "What is this passage mainly about?",
        choices: [
          summary.title,
          "A cooking recipe",
          "A grammar rule",
          "A listening tip",
        ],
        correctIndex: 0,
      },
    ],
    ...extras,
  };
}

const summaries: ReadingPassageSummary[] = [
  {
    slug: "a-morning-at-ben-thanh-market",
    title: "A Morning at Bến Thành Market",
    topic: "Travel",
    level: "A2",
    minutes: 3,
    completed: true,
  },
  {
    slug: "why-cats-sleep-so-much",
    title: "Why Cats Sleep So Much",
    topic: "Science",
    level: "A2",
    minutes: 3,
    completed: true,
  },
  {
    slug: "the-night-bus-to-da-lat",
    title: "The Night Bus to Đà Lạt",
    topic: "Travel",
    level: "B1",
    minutes: 4,
    completed: false,
    inProgress: true,
  },
  {
    slug: "working-from-a-cafe",
    title: "Working From a Café",
    topic: "Work",
    level: "B1",
    minutes: 4,
    completed: false,
  },
  {
    slug: "the-rice-terraces-of-sa-pa",
    title: "The Rice Terraces of Sa Pa",
    topic: "Culture",
    level: "B2",
    minutes: 5,
    completed: false,
  },
  {
    slug: "how-podcasts-changed-radio",
    title: "How Podcasts Changed Radio",
    topic: "Culture",
    level: "B2",
    minutes: 5,
    completed: false,
  },
  {
    slug: "the-economics-of-street-food",
    title: "The Economics of Street Food",
    topic: "Business",
    level: "C1",
    minutes: 6,
    completed: false,
  },
];

export const FIRST_READING_SLUG = "the-night-bus-to-da-lat";

export const mockPassages: ReadingPassage[] = summaries.map((s) =>
  s.slug === nightBus.slug ? nightBus : stubPassage(s),
);

export const readingProgress = {
  done: 3,
  total: 5,
};
