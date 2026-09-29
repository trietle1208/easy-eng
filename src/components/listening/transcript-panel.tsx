"use client";

import { useEffect, useRef } from "react";

import { formatTime } from "@/components/listening/audio-player";
import { StickyNote } from "@/components/notebook/sticky-note";
import { cn } from "@/lib/utils";
import type { TranscriptSentence } from "@/types/listening";

type TranscriptPanelProps = {
  open: boolean;
  onToggle: () => void;
  sentences: TranscriptSentence[];
  currentTime: number;
  onSeek: (time: number) => void;
};

export function TranscriptPanel({
  open,
  onToggle,
  sentences,
  currentTime,
  onSeek,
}: TranscriptPanelProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const activeId =
    sentences.find((s) => currentTime >= s.start && currentTime < s.end)?.id ??
    sentences.find((s) => currentTime >= s.start)?.id;

  useEffect(() => {
    if (!open) return;
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId, open]);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h3 className="font-hand m-0 text-[27px] tracking-[0.04em] text-ink-2 uppercase">
          Transcript
        </h3>
        <small className="text-[15px] font-semibold text-muted">
          · Lời thoại
        </small>
      </div>

      {!open ? (
        <StickyNote color="yellow" rotate={-1.4} className="gap-2 text-ink">
          <button
            type="button"
            onClick={onToggle}
            className="font-hand text-left text-2xl leading-tight text-kick"
          >
            Show transcript
          </button>
          <p className="m-0 text-sm font-semibold">
            Try listening twice first!
          </p>
          <p className="m-0 text-sm text-muted">Nghe 2 lần trước nhé.</p>
        </StickyNote>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="font-hand self-start text-lg text-kick"
          >
            Hide transcript
          </button>
          <ol className="m-0 flex max-h-[320px] list-none flex-col gap-1 overflow-y-auto rounded-[8px_14px_10px_12px] border-2 border-line/20 bg-paper p-3">
            {sentences.map((s) => {
              const active = s.id === activeId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    ref={active ? activeRef : undefined}
                    onClick={() => onSeek(s.start)}
                    className={cn(
                      "grid w-full grid-cols-[52px_72px_minmax(0,1fr)] gap-2 rounded-lg px-2 py-2 text-left text-sm",
                      active
                        ? "bg-primary-soft font-bold"
                        : "hover:bg-surface",
                    )}
                  >
                    <span className="font-mono text-xs text-muted">
                      {formatTime(s.start)}
                    </span>
                    <span className="text-kick text-xs font-extrabold">
                      {s.speaker}
                    </span>
                    <span className="leading-snug">{s.text}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
