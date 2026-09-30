"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";

import { LevelBadge } from "@/components/ui/level-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteWordSetAction,
  startWordSetAction,
  updateWordSetAction,
} from "@/lib/actions/vocabulary";
import { cn } from "@/lib/utils";
import type { WordSet } from "@/types/vocabulary";

type WordSetCardProps = {
  set: WordSet;
  onChanged?: () => void;
};

export function WordSetCard({ set, onChanged }: WordSetCardProps) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(set.title);
  const [titleVi, setTitleVi] = useState(set.titleVi);

  const pct =
    set.wordCount === 0
      ? 0
      : Math.round((set.learnedCount / set.wordCount) * 100);

  function startSet() {
    startTransition(async () => {
      await startWordSetAction(set.id);
      onChanged?.();
    });
  }

  function saveEdit() {
    startTransition(async () => {
      await updateWordSetAction({
        id: set.id,
        title,
        titleVi,
      });
      setEditing(false);
      onChanged?.();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteWordSetAction(set.id);
      setConfirmDelete(false);
      onChanged?.();
    });
  }

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-[6px_14px_8px_12px] bg-paper p-4 text-ink shadow-[var(--paper-shadow)]",
        set.status === "done" && "opacity-95",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-kick text-xs font-extrabold tracking-[0.14em] uppercase">
          {set.topic}
        </span>
        <div className="flex-1" />
        <LevelBadge level={set.level} />
        {set.owned ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-full border border-line/40"
                aria-label={`${set.title} actions`}
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setTitle(set.title);
                  setTitleVi(set.titleVi);
                  setEditing(true);
                }}
              >
                Edit set
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-danger"
                onSelect={() => setConfirmDelete(true)}
              >
                Delete set
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            className="rounded-lg border-2 border-line bg-surface px-3 py-2 text-sm font-bold"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Set title"
          />
          <input
            className="rounded-lg border-2 border-line bg-surface px-3 py-2 text-sm"
            value={titleVi}
            onChange={(e) => setTitleVi(e.target.value)}
            aria-label="Vietnamese title"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending || !title.trim()}
              onClick={saveEdit}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="m-0 text-lg leading-snug font-extrabold">
            {set.title}
          </h3>
          <p className="m-0 text-sm text-muted">{set.titleVi}</p>
        </>
      )}

      <div className="flex items-baseline text-sm font-bold">
        <span>{set.wordCount}</span>
        <span className="ml-1 font-semibold text-muted">words</span>
        <div className="flex-1" />
        {set.status === "done" ? (
          <span className="font-hand text-lg text-kick">Done!</span>
        ) : set.status === "new" ? (
          <span className="font-hand text-lg text-accent">New</span>
        ) : (
          <span>
            {set.learnedCount}/{set.wordCount}
          </span>
        )}
      </div>
      <ProgressBar value={pct} aria-label={`${set.title} progress`} />

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending || set.wordCount === 0}
        onClick={startSet}
      >
        {set.status === "new" ? "Start set" : "Study set"}
      </Button>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{set.title}”?</DialogTitle>
            <DialogDescription>
              This removes the set and all of your words in it. System content
              is never deleted this way.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={remove}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
