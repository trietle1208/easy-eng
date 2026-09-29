"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { QuizQuestions } from "@/components/quiz/quiz-questions";
import { QuizResults } from "@/components/quiz/quiz-results";
import { QuizStart } from "@/components/quiz/quiz-start";
import { submitQuiz } from "@/lib/data/quiz";
import type {
  Quiz,
  QuizAnswerValue,
  QuizAnswersMap,
  QuizAttempt,
  QuizResult,
} from "@/types/quiz";

type Phase = "start" | "questions" | "results";

type PersistedState = {
  phase: Phase;
  answers: QuizAnswersMap;
  currentIndex: number;
  showVietnameseHints: boolean;
  showHint: boolean;
  startedAt: number | null;
  endsAt: number | null;
  result: QuizResult | null;
  /** When practising mistakes, only these question ids are in play */
  practiseIds: string[] | null;
};

type QuizViewProps = {
  quiz: Quiz;
  lastAttempt: QuizAttempt | null;
};

function storageKey(slug: string) {
  return `easy-english:quiz:${slug}`;
}

function loadState(slug: string): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(slug));
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function saveState(slug: string, state: PersistedState) {
  try {
    sessionStorage.setItem(storageKey(slug), JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function clearState(slug: string) {
  try {
    sessionStorage.removeItem(storageKey(slug));
  } catch {
    /* ignore */
  }
}

const initialState = (): PersistedState => ({
  phase: "start",
  answers: {},
  currentIndex: 0,
  showVietnameseHints: true,
  showHint: false,
  startedAt: null,
  endsAt: null,
  result: null,
  practiseIds: null,
});

export function QuizView({ quiz, lastAttempt }: QuizViewProps) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<PersistedState>(initialState);
  const [secondsLeft, setSecondsLeft] = useState(quiz.timeLimitSeconds);
  const submitting = useRef(false);

  const activeQuestions = state.practiseIds
    ? quiz.questions.filter((q) => state.practiseIds!.includes(q.id))
    : quiz.questions;

  const activeQuiz: Quiz = {
    ...quiz,
    questions: activeQuestions.length ? activeQuestions : quiz.questions,
  };

  useEffect(() => {
    const saved = loadState(quiz.slug);
    if (saved) {
      setState(saved);
      if (saved.phase === "questions" && saved.endsAt) {
        setSecondsLeft(
          Math.max(0, Math.ceil((saved.endsAt - Date.now()) / 1000)),
        );
      }
    }
    setHydrated(true);
  }, [quiz.slug]);

  useEffect(() => {
    if (!hydrated) return;
    saveState(quiz.slug, state);
  }, [hydrated, quiz.slug, state]);

  const finish = useCallback(
    async (answers: QuizAnswersMap, startedAt: number | null) => {
      if (submitting.current) return;
      submitting.current = true;
      const used = startedAt
        ? Math.round((Date.now() - startedAt) / 1000)
        : quiz.timeLimitSeconds;
      const result = await submitQuiz(quiz.slug, answers, used, {
        questionIds: state.practiseIds ?? undefined,
      });
      submitting.current = false;
      if (!result) return;
      setState((prev) => ({
        ...prev,
        phase: "results",
        result,
        endsAt: null,
        showHint: false,
      }));
    },
    [quiz.slug, quiz.timeLimitSeconds, state.practiseIds],
  );

  useEffect(() => {
    if (!hydrated || state.phase !== "questions" || !state.endsAt) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((state.endsAt! - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        void finish(state.answers, state.startedAt);
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [
    hydrated,
    state.phase,
    state.endsAt,
    state.answers,
    state.startedAt,
    finish,
  ]);

  function startQuiz(practiseIds: string[] | null = null) {
    const now = Date.now();
    const questions = practiseIds
      ? quiz.questions.filter((q) => practiseIds.includes(q.id))
      : quiz.questions;
    const limit = practiseIds
      ? Math.max(60, Math.round(quiz.timeLimitSeconds * (questions.length / quiz.questions.length)))
      : quiz.timeLimitSeconds;

    setSecondsLeft(limit);
    setState({
      phase: "questions",
      answers: {},
      currentIndex: 0,
      showVietnameseHints: state.showVietnameseHints,
      showHint: false,
      startedAt: now,
      endsAt: now + limit * 1000,
      result: null,
      practiseIds,
    });
  }

  function resetToStart() {
    clearState(quiz.slug);
    setState({
      ...initialState(),
      showVietnameseHints: state.showVietnameseHints,
    });
    setSecondsLeft(quiz.timeLimitSeconds);
  }

  function onChangeAnswer(questionId: string, value: QuizAnswerValue) {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  }

  function goNext() {
    setState((prev) => {
      const last = prev.currentIndex >= activeQuiz.questions.length - 1;
      if (last) return prev;
      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
        showHint: false,
      };
    });
  }

  function onCheck() {
    const last = state.currentIndex >= activeQuiz.questions.length - 1;
    if (last) {
      void finish(state.answers, state.startedAt);
      return;
    }
    goNext();
  }

  function onSkip() {
    const q = activeQuiz.questions[state.currentIndex];
    if (q) {
      setState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [q.id]: null },
        showHint: false,
      }));
    }
    const last = state.currentIndex >= activeQuiz.questions.length - 1;
    if (last) {
      void finish(
        { ...state.answers, [q!.id]: null },
        state.startedAt,
      );
      return;
    }
    goNext();
  }

  function onPractiseMistakes() {
    const ids =
      state.result?.review.filter((r) => !r.isCorrect).map((r) => r.questionId) ??
      [];
    if (!ids.length) {
      resetToStart();
      return;
    }
    startQuiz(ids);
  }

  if (!hydrated) {
    return (
      <div className="text-on-glass-2" aria-busy="true">
        Loading quiz…
      </div>
    );
  }

  if (state.phase === "start") {
    return (
      <QuizStart
        quiz={quiz}
        lastAttempt={lastAttempt}
        showVietnameseHints={state.showVietnameseHints}
        onToggleHints={(on) =>
          setState((prev) => ({ ...prev, showVietnameseHints: on }))
        }
        onStart={() => startQuiz(null)}
      />
    );
  }

  if (state.phase === "results" && state.result) {
    return (
      <QuizResults
        quiz={quiz}
        result={state.result}
        onTryAgain={resetToStart}
        onPractiseMistakes={onPractiseMistakes}
      />
    );
  }

  return (
    <QuizQuestions
      quiz={activeQuiz}
      currentIndex={state.currentIndex}
      answers={state.answers}
      secondsLeft={secondsLeft}
      showVietnamese={state.showVietnameseHints}
      showHint={state.showHint}
      onQuit={resetToStart}
      onSelectIndex={(index) =>
        setState((prev) => ({ ...prev, currentIndex: index, showHint: false }))
      }
      onChangeAnswer={onChangeAnswer}
      onToggleHint={() =>
        setState((prev) => ({ ...prev, showHint: !prev.showHint }))
      }
      onSkip={onSkip}
      onCheck={onCheck}
      isLast={state.currentIndex >= activeQuiz.questions.length - 1}
    />
  );
}
