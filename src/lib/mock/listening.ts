import type {
  ListeningLesson,
  ListeningLessonSummary,
} from "@/types/listening";

const airportTranscript = [
  {
    id: "s1",
    speaker: "Agent",
    text: "Good morning. Where are you flying to today?",
    start: 0,
    end: 4,
  },
  {
    id: "s2",
    speaker: "Lan",
    text: "Hi, I’m flying to Singapore.",
    start: 4,
    end: 7,
  },
  {
    id: "s3",
    speaker: "Agent",
    text: "Can I see your passport and booking reference, please?",
    start: 7,
    end: 12,
  },
  {
    id: "s4",
    speaker: "Lan",
    text: "Sure, here you are.",
    start: 12,
    end: 15,
  },
  {
    id: "s5",
    speaker: "Agent",
    text: "Thank you. Are you checking in any bags?",
    start: 15,
    end: 19,
  },
  {
    id: "s6",
    speaker: "Lan",
    text: "Just one suitcase. Is there a weight limit?",
    start: 19,
    end: 23,
  },
  {
    id: "s7",
    speaker: "Agent",
    text: "Yes, it’s twenty-three kilos. Could you put it on the scale?",
    start: 23,
    end: 29,
  },
  {
    id: "s8",
    speaker: "Agent",
    text: "Would you prefer a window or an aisle seat?",
    start: 29,
    end: 33,
  },
  {
    id: "s9",
    speaker: "Lan",
    text: "A window seat, please.",
    start: 33,
    end: 36,
  },
  {
    id: "s10",
    speaker: "Agent",
    text: "Here’s your boarding pass. Boarding starts at gate twelve at nine forty.",
    start: 36,
    end: 42,
  },
];

const airport: ListeningLesson = {
  slug: "checking-in-at-the-airport",
  title: "Checking in at the airport",
  topic: "Travel",
  level: "A2",
  durationSeconds: 160,
  completed: false,
  inProgress: true,
  audioSrc: "/audio/checking-in-at-the-airport.wav",
  speakers: 2,
  accent: "British accent",
  familyLabel: "Travel · Lesson 3 of 12",
  transcript: airportTranscript,
  blanks: [
    {
      id: "b1",
      promptBefore: "Can I see your ",
      promptAfter: " and booking reference, please?",
      answer: "passport",
    },
    {
      id: "b2",
      promptBefore: "Thank you. Are you checking in any ",
      promptAfter: "?",
      answer: "bags",
    },
    {
      id: "b3",
      promptBefore: "Just one suitcase. Is there a weight ",
      promptAfter: "?",
      answer: "limit",
    },
    {
      id: "b4",
      promptBefore: "Would you prefer a window or an ",
      promptAfter: " seat?",
      answer: "aisle",
    },
    {
      id: "b5",
      promptBefore: "Boarding starts at ",
      promptAfter: " twelve at nine forty.",
      answer: "gate",
    },
  ],
};

function stub(
  summary: ListeningLessonSummary,
  extras?: Partial<ListeningLesson>,
): ListeningLesson {
  return {
    ...summary,
    audioSrc: "/audio/checking-in-at-the-airport.wav",
    speakers: 2,
    accent: "Neutral accent",
    familyLabel: `${summary.topic} · Lesson`,
    transcript: [
      {
        id: "s1",
        speaker: "Speaker",
        text: `${summary.title} — open the featured airport lesson for the full exercise.`,
        start: 0,
        end: 5,
      },
    ],
    blanks: [
      {
        id: "b1",
        promptBefore: "This is a ",
        promptAfter: " placeholder.",
        answer: "listening",
      },
    ],
    ...extras,
  };
}

const summaries: ListeningLessonSummary[] = [
  {
    slug: "ordering-a-coffee",
    title: "Ordering a coffee",
    topic: "Daily life",
    level: "A1",
    durationSeconds: 84,
    completed: true,
  },
  {
    slug: "asking-for-directions-in-ha-noi",
    title: "Asking for directions in Hà Nội",
    topic: "Travel",
    level: "A2",
    durationSeconds: 125,
    completed: true,
  },
  {
    slug: "checking-in-at-the-airport",
    title: "Checking in at the airport",
    topic: "Travel",
    level: "A2",
    durationSeconds: 160,
    completed: false,
    inProgress: true,
  },
  {
    slug: "a-voicemail-from-your-landlord",
    title: "A voicemail from your landlord",
    topic: "Daily life",
    level: "B1",
    durationSeconds: 118,
    completed: false,
  },
  {
    slug: "team-meeting-project-update",
    title: "Team meeting: project update",
    topic: "Work",
    level: "B1",
    durationSeconds: 192,
    completed: false,
  },
  {
    slug: "podcast-the-joy-of-slow-travel",
    title: "Podcast: the joy of slow travel",
    topic: "Culture",
    level: "B2",
    durationSeconds: 270,
    completed: false,
  },
  {
    slug: "rice-prices-and-the-weather",
    title: "Rice prices and the weather",
    topic: "News",
    level: "C1",
    durationSeconds: 225,
    completed: false,
  },
];

export const FIRST_LISTENING_SLUG = "checking-in-at-the-airport";

export const mockListeningLessons: ListeningLesson[] = summaries.map((s) =>
  s.slug === airport.slug ? airport : stub(s),
);
