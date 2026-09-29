"use client";

import { useCallback, useState } from "react";

import { AudioPlayer, formatTime } from "@/components/listening/audio-player";
import { DictationExercise } from "@/components/listening/dictation-exercise";
import { TranscriptPanel } from "@/components/listening/transcript-panel";
import { Mascot } from "@/components/mascot/mascot";
import { NotebookPage } from "@/components/notebook/notebook-page";
import { LevelBadge } from "@/components/ui/level-badge";
import type { ListeningLesson } from "@/types/listening";

type ListeningLessonPanelProps = {
  lesson: ListeningLesson;
  nextSlug?: string | null;
};

export function ListeningLessonPanel({
  lesson,
  nextSlug,
}: ListeningLessonPanelProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [seekTo, setSeekTo] = useState<number | null>(null);

  const onTimeUpdate = useCallback((t: number) => setCurrentTime(t), []);
  const onSeekHandled = useCallback(() => setSeekTo(null), []);

  const activeLine =
    lesson.transcript.findIndex(
      (s) => currentTime >= s.start && currentTime < s.end,
    ) + 1;

  return (
    <NotebookPage
      withMargin
      withRings
      ringCount={14}
      withRules
      className="relative flex min-w-0 flex-1 flex-col gap-6 rounded-[6px_18px_18px_6px] py-9 pr-6 pl-[100px] md:pr-12"
    >
      <div className="absolute right-14 bottom-full mb-[-4px]">
        <Mascot pose="listen" size={72} alt="" />
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-muted">
          <span className="text-kick tracking-[0.14em] uppercase">
            {lesson.familyLabel}
          </span>
          <div className="flex-1" />
          <span>{lesson.speakers} speakers</span>
          <span>·</span>
          <span>{lesson.accent}</span>
          <span>·</span>
          <span>{lesson.blanks.length} blanks to fill</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-hand m-0 text-[clamp(1.75rem,4vw,2.75rem)] leading-none text-ink-2">
            {lesson.title}
          </h2>
          <LevelBadge level={lesson.level} className="px-2.5 py-1.5 text-sm" />
          <span className="text-sm font-bold text-muted">
            {formatTime(lesson.durationSeconds)}
          </span>
        </div>
      </header>

      <AudioPlayer
        src={lesson.audioSrc}
        title={lesson.title}
        fallbackDuration={lesson.durationSeconds}
        onTimeUpdate={onTimeUpdate}
        seekTo={seekTo}
        onSeekHandled={onSeekHandled}
      />

      {activeLine > 0 ? (
        <p className="m-0 text-xs font-semibold text-muted">
          Current line {activeLine} of {lesson.transcript.length}
        </p>
      ) : null}

      <TranscriptPanel
        open={showTranscript}
        onToggle={() => setShowTranscript((v) => !v)}
        sentences={lesson.transcript}
        currentTime={currentTime}
        onSeek={(t) => setSeekTo(t)}
      />

      <DictationExercise
        slug={lesson.slug}
        blanks={lesson.blanks}
        nextSlug={nextSlug}
      />
    </NotebookPage>
  );
}
