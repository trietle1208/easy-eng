"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, MoreHorizontal, Plus } from "lucide-react";

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(set.title);
  const [titleVi, setTitleVi] = useState(set.titleVi);

  const empty = set.wordCount === 0;
  const addWordsHref = `/vocabulary/new?set=${encodeURIComponent(set.id)}`;
  const pct = empty ? 0 : Math.round((set.learnedCount / set.wordCount) * 100);

  const statusLabel = empty
    ? "Empty"
    : set.status === "done"
      ? "Done!"
      : set.status === "new"
        ? "New"
        : `${set.learnedCount}/${set.wordCount}`;
  const statusClass = empty
    ? "text-muted"
    : set.status === "done"
      ? "text-kick"
      : set.status === "new"
        ? "text-accent"
        : "text-ink";

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
        "relative flex items-center gap-3 rounded-[14px] bg-paper p-3.5 text-ink shadow-paper md:items-start md:gap-4 md:rounded-2xl md:p-5",
        set.status === "done" && "opacity-95",
      )}
    >
      {/* Mobile: whole row is the action (the desktop footer holds it on md+). */}
      {!editing ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => (empty ? router.push(addWordsHref) : startSet())}
          aria-label={`${empty ? "Add words to" : "Start"} ${set.title}`}
          className="absolute inset-0 rounded-[inherit] md:hidden"
        />
      ) : null}

      <LevelBadge
        level={set.level}
        className="size-9 rounded-md text-xs md:size-12 md:rounded-full md:text-base"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:gap-1">
        <span className="text-kick text-[11px] font-extrabold tracking-[0.14em] uppercase">
          {set.topic}
        </span>

        {editing ? (
          <div className="relative z-10 flex flex-col gap-2">
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
            <h3 className="m-0 text-base leading-snug font-extrabold md:text-xl">
              {set.title}
            </h3>
            <p className="m-0 text-sm text-muted">{set.titleVi}</p>
          </>
        )}

        <ProgressBar
          value={pct}
          aria-label={`${set.title} progress`}
          className="mt-2.5 hidden h-2 border-0 bg-line/20 md:block"
        />

        <div className="mt-1 hidden items-center text-sm md:flex">
          <span className="font-bold">{set.wordCount}</span>
          <span className="ml-1 text-muted">words</span>
          <span className="mx-1.5 text-muted">·</span>
          <span className={cn("font-semibold", statusClass)}>{statusLabel}</span>
          <div className="flex-1" />
          {empty ? (
            <Link
              href={addWordsHref}
              className="text-kick inline-flex items-center gap-1 font-extrabold hover:underline"
            >
              <Plus className="size-4" aria-hidden />
              Add words
            </Link>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={startSet}
              className="text-kick font-extrabold hover:underline disabled:opacity-50"
            >
              {set.status === "new" ? "Start set" : "Study set"} →
            </button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex shrink-0 items-center gap-1 md:hidden",
          set.owned && "pr-7",
        )}
      >
        <div className="flex flex-col items-end text-xs leading-tight">
          <span className="font-bold">
            {set.wordCount} words
          </span>
          <span className={cn("font-extrabold", statusClass)}>
            {statusLabel}
          </span>
        </div>
        <ChevronRight className="size-5 text-muted" aria-hidden />
      </div>

      {set.owned ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="absolute top-2 right-2 z-10 inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-line/15 md:top-3 md:right-3"
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
