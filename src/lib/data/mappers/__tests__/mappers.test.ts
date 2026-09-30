import { describe, expect, it } from "vitest";

import { mapGrammarLesson, familyDisplayTitle } from "../grammar";
import { mapListeningLesson } from "../listening";
import { mapQuiz, mapQuizQuestion, toPublicQuiz } from "../quiz";
import { mapReadingPassage } from "../reading";
import {
  computeWordSetStatus,
  mapWord,
  mapWordSet,
} from "../vocabulary";
import { initialsFromName, mapUserProfile, mapUserSettings } from "../profile";

describe("grammar mappers", () => {
  it("maps a lesson with family/group metadata", () => {
    const lesson = mapGrammarLesson(
      {
        slug: "use-subject-verb-clauses",
        title: "Use subject + verb clauses",
        level: "A1",
        familyId: "sentence-foundations",
        groupId: "basic-clause-patterns",
        sortOrder: 0,
        readMinutes: 4,
        introEn: "Intro",
        introVi: "Giới thiệu",
        useWhenEn: "when speaking",
        useWhenVi: "khi nói",
        structure: [{ formula: "S+V", explanation: "simple" }],
        examples: [{ sentence: "I run.", explanation: "habit" }],
        mistakes: [
          {
            before: "She ",
            wrong: "go",
            after: ".",
            correct: "goes",
            noteEn: "needs -s",
            noteVi: "thêm -s",
          },
        ],
        practiceQuizSlug: "use-subject-verb-clauses",
        practiceQuestionCount: 10,
        practiceMinutes: 5,
      },
      { id: "sentence-foundations", title: "1. Sentence foundations" },
      { id: "basic-clause-patterns", title: "1.1 Basic clause patterns", familyId: "sentence-foundations" },
      [
        { slug: "use-subject-verb-clauses" },
        { slug: "use-subject-verb-object-clauses" },
      ],
    );

    expect(familyDisplayTitle("1. Sentence foundations")).toBe(
      "Sentence foundations",
    );
    expect(lesson.familyTitle).toBe("Sentence foundations");
    expect(lesson.groupIndex).toBe(1);
    expect(lesson.groupTotal).toBe(2);
    expect(lesson.structure).toHaveLength(1);
  });
});

describe("reading mappers", () => {
  it("strips passage prefixes and remaps vocab ids", () => {
    const passage = mapReadingPassage(
      {
        slug: "the-night-bus-to-da-lat",
        title: "The Night Bus",
        topic: "Travel",
        level: "B1",
        minutes: 4,
        wordCount: 212,
        newWordCount: 1,
        familyLabel: "Travel · Passage 3 of 7",
        sortOrder: 2,
      },
      [
        {
          id: "the-night-bus-to-da-lat:p1",
          sortOrder: 0,
          vi: "vi",
          segments: [
            { type: "text", text: "Hello " },
            { type: "vocab", vocabId: "the-night-bus-to-da-lat:winding" },
          ],
        },
      ],
      [
        {
          id: "the-night-bus-to-da-lat:winding",
          word: "winding",
          ipa: "/w/",
          partOfSpeech: "adj.",
          meaningVi: "quanh co",
          level: "B1",
        },
      ],
      [
        {
          id: "the-night-bus-to-da-lat:q1",
          sortOrder: 0,
          prompt: "Why?",
          choices: ["a", "b"],
          correctIndex: 1,
        },
      ],
      [
        { slug: "a-morning-at-ben-thanh-market" },
        { slug: "the-night-bus-to-da-lat" },
      ],
      { completed: false, inProgress: true },
    );

    expect(passage.paragraphs[0]!.id).toBe("p1");
    expect(passage.paragraphs[0]!.segments[1]).toEqual({
      type: "vocab",
      vocabId: "winding",
    });
    expect(passage.vocabulary[0]!.id).toBe("winding");
    expect(passage.questions[0]!.id).toBe("q1");
    expect(passage.indexInTopic).toBe(2);
    expect(passage.inProgress).toBe(true);
    // Public DTO strips answer keys
    expect(
      "correctIndex" in (passage.questions[0] as object),
    ).toBe(false);
  });
});

describe("listening mappers", () => {
  it("converts ms timestamps to seconds", () => {
    const lesson = mapListeningLesson(
      {
        slug: "checking-in-at-the-airport",
        title: "Checking in",
        topic: "Travel",
        level: "A2",
        durationSeconds: 160,
        audioPath: "listening/checking-in-at-the-airport.wav",
        speakers: 2,
        accent: "British accent",
        familyLabel: "Travel · Lesson 3 of 12",
      },
      [
        {
          id: "checking-in-at-the-airport:s1",
          sortOrder: 0,
          speaker: "Agent",
          text: "Hello",
          startMs: 0,
          endMs: 4000,
        },
      ],
      [
        {
          id: "checking-in-at-the-airport:b1",
          sortOrder: 0,
          promptBefore: "Your ",
          promptAfter: " please",
          answer: "passport",
          accept: null,
        },
      ],
      "/files/listening/checking-in-at-the-airport.wav",
    );

    expect(lesson.transcript[0]!.start).toBe(0);
    expect(lesson.transcript[0]!.end).toBe(4);
    expect(lesson.transcript[0]!.id).toBe("s1");
    expect(lesson.audioSrc).toBe(
      "/files/listening/checking-in-at-the-airport.wav",
    );
    expect("answer" in (lesson.blanks[0] as object)).toBe(false);
  });
});

describe("quiz mappers", () => {
  it("rebuilds typed questions from payload", () => {
    const q = mapQuizQuestion(
      {
        id: "present-perfect-vs-past-simple:q1",
        sortOrder: 0,
        type: "multiple_choice",
        instructionVi: "Chọn",
        promptVi: "prompt",
        hintEn: "hint",
        explanationEn: "en",
        explanationVi: "vi",
        reviewBefore: "I ",
        reviewAfter: " it.",
        payload: {
          stemBefore: "I",
          stemAfter: "it.",
          options: ["a", "b"],
          correctIndex: 1,
        },
      },
      "present-perfect-vs-past-simple",
    );
    expect(q.id).toBe("q1");
    expect(q.type).toBe("multiple_choice");
    if (q.type === "multiple_choice") {
      expect(q.correctIndex).toBe(1);
      expect(q.options).toEqual(["a", "b"]);
    }

    const quiz = mapQuiz(
      {
        slug: "present-perfect-vs-past-simple",
        title: "Present perfect",
        kickEn: "Quiz",
        kickVi: "KT",
        breadcrumb: "Grammar",
        level: "B1",
        descriptionEn: "desc",
        descriptionVi: "mô tả",
        timeLimitSeconds: 480,
        passScore: 7,
        questionTypes: [{ id: "multiple_choice", label: "MC" }],
        lessonHref: "/grammar/x",
        nextHref: "/grammar/y",
        nextLabel: "Next",
        encouragementEn: "Go",
        encouragementVi: "Cố lên",
      },
      [
        {
          id: "present-perfect-vs-past-simple:q1",
          sortOrder: 0,
          type: "multiple_choice",
          instructionVi: "Chọn",
          promptVi: null,
          hintEn: null,
          explanationEn: "en",
          explanationVi: "vi",
          reviewBefore: "",
          reviewAfter: "",
          payload: {
            stemBefore: "I",
            stemAfter: "",
            options: ["a"],
            correctIndex: 0,
          },
        },
      ],
    );
    expect(quiz.questions).toHaveLength(1);
    const pub = toPublicQuiz(quiz);
    expect("correctIndex" in (pub.questions[0] as object)).toBe(false);
  });
});

describe("vocabulary mappers", () => {
  it("computes set status from learned counts", () => {
    expect(computeWordSetStatus(30, 0)).toBe("new");
    expect(computeWordSetStatus(30, 14)).toBe("active");
    expect(computeWordSetStatus(24, 24)).toBe("done");

    const set = mapWordSet(
      {
        id: "at-the-airport",
        title: "At the airport",
        titleVi: "Ở sân bay",
        topic: "Travel",
        level: "A2",
      },
      3,
      2,
    );
    expect(set.status).toBe("active");
    expect(set.wordCount).toBe(3);

    const word = mapWord({
      id: "w-itinerary",
      wordSetId: "at-the-airport",
      word: "itinerary",
      ipa: "/i/",
      partOfSpeech: "noun",
      level: "A2",
      meaningVi: "lịch trình",
      definitionEn: "plan",
      examples: [{ en: "Send the itinerary." }],
      collocations: ["travel itinerary"],
      notes: null,
      imagePath: null,
      createdAt: new Date("2026-09-20T08:00:00.000Z"),
    });
    expect(word.createdAt).toBe("2026-09-20T08:00:00.000Z");
    expect(word.collocations).toEqual(["travel itinerary"]);
  });
});

describe("profile mappers", () => {
  it("builds initials and settings", () => {
    expect(initialsFromName("Linh Trần")).toBe("LT");
    const profile = mapUserProfile({
      id: "user-linh",
      name: "Linh Trần",
      cefrLevel: "B1",
      goalText: "IELTS 6.5",
      createdAt: new Date("2026-03-15T00:00:00.000Z"),
    });
    expect(profile.initials).toBe("LT");
    expect(profile.goalLabel).toBe("Goal: IELTS 6.5");
    expect(profile.memberSinceLabel).toContain("2026");

    const settings = mapUserSettings({
      wordsPerDay: 20,
      grammarPerDay: 2,
      dailyReminder: true,
      reminderTime: "20:30",
      reminderDays: ["mon", "tue"],
      streakRescue: true,
      interfaceLanguage: "en",
      showVietnameseHints: true,
      autoPlayPronunciation: false,
      theme: "default",
    });
    expect(settings.wordsPerDay).toBe(20);
    expect(settings.theme).toBe("default");
  });
});
