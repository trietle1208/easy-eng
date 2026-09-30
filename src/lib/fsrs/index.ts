import "server-only";

import {
  createEmptyCard,
  fsrs,
  Rating,
  State,
  type Card,
  type Grade,
} from "ts-fsrs";

/** UI grades → FSRS ratings (confirm with product). */
export const UI_GRADE_TO_RATING = {
  still_learning: Rating.Again,
  know_it: Rating.Good,
} as const;

export type UiGrade = keyof typeof UI_GRADE_TO_RATING;

export type CardRow = {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  learningSteps: number;
  state: number;
  lastReview: Date | null;
};

const scheduler = fsrs();

export function ratingForUiGrade(grade: UiGrade): Grade {
  return UI_GRADE_TO_RATING[grade];
}

export function emptyCardRow(now: Date = new Date()): CardRow {
  const card = createEmptyCard(now);
  return cardToRow(card);
}

export function rowToCard(row: CardRow): Card {
  return {
    due: row.due,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsedDays,
    scheduled_days: row.scheduledDays,
    reps: row.reps,
    lapses: row.lapses,
    learning_steps: row.learningSteps,
    state: row.state as State,
    last_review: row.lastReview ?? undefined,
  };
}

export function cardToRow(card: Card): CardRow {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learningSteps: card.learning_steps,
    state: card.state,
    lastReview: card.last_review ?? null,
  };
}

export function gradeCard(
  row: CardRow,
  grade: UiGrade,
  now: Date = new Date(),
): {
  card: CardRow;
  rating: Grade;
  log: {
    rating: number;
    state: number;
    scheduledDays: number;
    elapsedDays: number;
    review: Date;
  };
} {
  const rating = ratingForUiGrade(grade);
  const result = scheduler.next(rowToCard(row), now, rating);
  return {
    card: cardToRow(result.card),
    rating,
    log: {
      rating: result.log.rating,
      state: result.log.state,
      scheduledDays: result.log.scheduled_days,
      elapsedDays: result.log.elapsed_days,
      review: result.log.review,
    },
  };
}

/** Fold Vietnamese/Latin accents for case-insensitive search. */
export function foldSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export { Rating, State };
