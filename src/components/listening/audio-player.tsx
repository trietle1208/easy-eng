"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25] as const;

type AudioPlayerProps = {
  src: string;
  title: string;
  fallbackDuration: number;
  onTimeUpdate?: (time: number) => void;
  seekTo?: number | null;
  onSeekHandled?: () => void;
};

export function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function AudioPlayer({
  src,
  title,
  fallbackDuration,
  onTimeUpdate,
  seekTo,
  onSeekHandled,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration);
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function onLoaded() {
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    }
    function onTime() {
      if (!audio) return;
      setCurrent(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    }
    function onEnded() {
      setPlaying(false);
    }

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [onTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (seekTo == null || !audioRef.current) return;
    audioRef.current.currentTime = seekTo;
    setCurrent(seekTo);
    onSeekHandled?.();
  }, [seekTo, onSeekHandled]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      await audio.play();
      setPlaying(true);
    }
  }

  function rewind() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  }

  function onSeekBar(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrent(value);
    onTimeUpdate?.(value);
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="radius-sketch flex flex-col gap-3 border-2 border-line bg-surface p-4 text-ink">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.14em] text-kick uppercase">
        <span>side A</span>
        <div className="flex-1" />
        <span className="font-mono tracking-normal text-muted normal-case">
          {formatTime(current)}
        </span>
        <span className="text-muted">/</span>
        <span className="font-mono tracking-normal text-muted normal-case">
          {formatTime(duration || fallbackDuration)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Rewind 5 seconds"
          onClick={rewind}
          className="flex size-11 items-center justify-center rounded-full border-2 border-line bg-paper"
        >
          <RotateCcw className="size-4" aria-hidden />
          <span className="sr-only">5s</span>
        </button>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlay}
          className="flex size-14 items-center justify-center rounded-full border-2 border-line bg-primary text-on-primary"
        >
          {playing ? (
            <Pause className="size-6" fill="currentColor" />
          ) : (
            <Play className="size-6 translate-x-0.5" fill="currentColor" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-hand text-lg leading-none">{title}</div>
          <div className="mt-1 text-xs font-semibold text-muted">
            {playing
              ? `Playing… ${formatTime(current)}`
              : `Paused at ${formatTime(current)}`}
          </div>
        </div>
      </div>

      <label className="block">
        <span className="sr-only">Seek</span>
        <input
          type="range"
          min={0}
          max={duration || fallbackDuration}
          step={0.1}
          value={Math.min(current, duration || fallbackDuration)}
          onChange={(e) => onSeekBar(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-paper accent-[var(--kick)]"
          style={{
            background: `linear-gradient(90deg, var(--hatch-1) ${pct}%, var(--paper) ${pct}%)`,
          }}
        />
      </label>

      <div
        role="radiogroup"
        aria-label="Playback speed"
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">
          Speed
        </span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={speed === s}
            onClick={() => setSpeed(s)}
            className={cn(
              "h-8 rounded-[var(--radius-pill)] border-2 px-3 text-xs font-bold",
              speed === s
                ? "border-line bg-primary-soft"
                : "border-line/40 bg-paper",
            )}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
