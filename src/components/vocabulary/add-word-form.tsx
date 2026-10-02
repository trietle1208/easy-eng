"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";

import { Mascot } from "@/components/mascot/mascot";
import { Highlighter } from "@/components/marks/highlighter";
import { StickyNote } from "@/components/notebook/sticky-note";
import { LivePreview } from "@/components/vocabulary/live-preview";
import {
  UnderlineField,
  underlineInputClass,
} from "@/components/vocabulary/underline-field";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
import { createWordAction } from "@/lib/actions/create-word";
import {
  updateWordAction,
  uploadWordImageAction,
} from "@/lib/actions/vocabulary";
import {
  newWordSchema,
  type NewWordFormValues,
} from "@/lib/schemas/new-word";
import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/types/cefr";
import { CEFR_LEVELS } from "@/types/cefr";
import type { PartOfSpeech, Word, WordSet } from "@/types/vocabulary";
import { PARTS_OF_SPEECH } from "@/types/vocabulary";

type AddWordFormProps = {
  wordSets: WordSet[];
  savedCount: number;
  initialAddedToday: Word[];
  initialWord?: Word | null;
  /** Preselect this word set when adding (ignored while editing). */
  initialSetId?: string;
  mode?: "page" | "modal";
  onClose?: () => void;
};

export function AddWordForm({
  wordSets,
  savedCount: initialSaved,
  initialAddedToday,
  initialWord = null,
  initialSetId,
  mode = "page",
  onClose,
}: AddWordFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedCount, setSavedCount] = useState(initialSaved);
  const [addedToday, setAddedToday] = useState(initialAddedToday);
  const [lastSaved, setLastSaved] = useState<Word | null>(null);
  const [creatingNewSet, setCreatingNewSet] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const editing = Boolean(initialWord);

  const form = useForm<NewWordFormValues>({
    resolver: zodResolver(newWordSchema),
    defaultValues: {
      word: initialWord?.word ?? "",
      ipa: initialWord?.ipa ?? "",
      partOfSpeech: initialWord?.partOfSpeech ?? "noun",
      level: initialWord?.level ?? "A2",
      meaningVi: initialWord?.meaningVi ?? "",
      definitionEn: initialWord?.definitionEn ?? "",
      examples: initialWord?.examples?.length
        ? initialWord.examples.map((e) => e.en)
        : ["", ""],
      wordSetId:
        initialWord?.wordSetId ??
        wordSets.find((s) => s.id === initialSetId)?.id ??
        wordSets[0]?.id ??
        "",
      newWordSetTitle: "",
      notes: initialWord?.notes ?? "",
      imageUrl: initialWord?.imageUrl ?? "",
    },
    mode: "onSubmit",
  });

  const examples = form.watch("examples") ?? ["", ""];

  function addExample() {
    form.setValue("examples", [...examples, ""]);
  }

  function removeExample(index: number) {
    if (examples.length <= 1) return;
    form.setValue(
      "examples",
      examples.filter((_, i) => i !== index),
    );
  }

  const watched = form.watch();
  const selectedSet = useMemo(
    () => wordSets.find((s) => s.id === watched.wordSetId),
    [wordSets, watched.wordSetId],
  );
  const setTitle = creatingNewSet
    ? watched.newWordSetTitle || "New set"
    : selectedSet?.title || "";

  function close() {
    if (onClose) onClose();
    else router.push("/vocabulary");
  }

  function resetFormKeepSet() {
    const setId = form.getValues("wordSetId");
    const level = form.getValues("level");
    form.reset({
      word: "",
      ipa: "",
      partOfSpeech: "noun",
      level,
      meaningVi: "",
      definitionEn: "",
      examples: ["", ""],
      wordSetId: setId,
      newWordSetTitle: "",
      notes: "",
      imageUrl: "",
    });
    setCreatingNewSet(false);
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    setFormError(null);
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      try {
        const uploaded = await uploadWordImageAction(fd);
        form.setValue("imageUrl", uploaded.url, { shouldDirty: true });
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  async function save(values: NewWordFormValues, addAnother: boolean) {
    const examples = (values.examples ?? [])
      .map((s) => s.trim())
      .filter(Boolean);
    setFormError(null);

    startTransition(async () => {
      try {
        if (editing && initialWord) {
          const updated = await updateWordAction({
            id: initialWord.id,
            word: values.word,
            ipa: values.ipa,
            partOfSpeech: values.partOfSpeech as PartOfSpeech,
            level: values.level as CefrLevel,
            meaningVi: values.meaningVi,
            definitionEn: values.definitionEn,
            examples,
            notes: values.notes,
            imageUrl: values.imageUrl || null,
          });
          setLastSaved(updated);
          router.refresh();
          if (!addAnother) router.push("/vocabulary");
          return;
        }

        const created = await createWordAction({
          word: values.word,
          ipa: values.ipa,
          partOfSpeech: values.partOfSpeech as PartOfSpeech,
          level: values.level as CefrLevel,
          meaningVi: values.meaningVi,
          definitionEn: values.definitionEn,
          examples,
          wordSetId: creatingNewSet ? undefined : values.wordSetId || undefined,
          newWordSetTitle: creatingNewSet
            ? values.newWordSetTitle
            : undefined,
          notes: values.notes,
          imageUrl: values.imageUrl,
        });
        setLastSaved(created);
        setAddedToday((prev) => [created, ...prev]);
        setSavedCount((c) => c + 1);
        if (addAnother) resetFormKeepSet();
        router.refresh();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        mode === "modal" && "max-h-[min(90vh,920px)] overflow-y-auto p-1",
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-kick text-xs font-extrabold tracking-[0.14em] uppercase">
            Vocabulary · {editing ? "Edit word" : "New word"}
          </div>
          <h1 className="font-hand m-0 text-[clamp(2rem,5vw,2.75rem)] leading-none text-ink">
            {editing ? "Edit word" : "Add a new word"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {editing
              ? "Cập nhật từ trong sổ tay."
              : "Thêm từ mới vào sổ tay · Fields with "}
            {!editing ? (
              <>
                <span className="text-danger">*</span> are required.
              </>
            ) : null}
          </p>
        </div>
        <div className="text-right text-sm font-bold text-muted">
          Saved words: {savedCount.toLocaleString("en-US")} · Đã lưu
        </div>
      </div>

      {lastSaved ? (
        <StickyNote
          color="yellow"
          rotate={-0.8}
          className="gap-3 !bg-primary-soft text-ink"
        >
          <div className="flex items-center gap-3">
            <Mascot pose="cheer" size={72} />
            <div>
              <div className="font-hand text-2xl leading-tight">Saved!</div>
              <p className="m-0 text-base">
                “
                <Highlighter>{lastSaved.word}</Highlighter>
                ” is in your notebook.
              </p>
              <p className="m-0 text-sm text-muted">Đã lưu vào sổ từ vựng.</p>
            </div>
          </div>
        </StickyNote>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form
          className="flex flex-col gap-5 rounded-[8px_16px_12px_10px] bg-paper p-6 text-ink shadow-[var(--paper-shadow)]"
          onSubmit={form.handleSubmit((v) => save(v, false))}
          noValidate
        >
          <UnderlineField
            id="word"
            label="Word or phrase"
            error={form.formState.errors.word?.message}
          >
            <input
              id="word"
              className={underlineInputClass}
              placeholder="e.g. itinerary"
              {...form.register("word")}
            />
          </UnderlineField>

          <div>
            <div className="mb-2 text-sm font-extrabold">Part of speech</div>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {PARTS_OF_SPEECH.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  role="radio"
                  aria-checked={watched.partOfSpeech === pos}
                  onClick={() => form.setValue("partOfSpeech", pos)}
                  className={cn(
                    "h-9 rounded-[var(--radius-pill)] border-2 px-3 text-sm font-bold capitalize",
                    watched.partOfSpeech === pos
                      ? "border-line bg-primary-soft"
                      : "border-line/40 bg-surface",
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <UnderlineField
            id="ipa"
            label="Pronunciation (IPA)"
            optional
            hint="Auto-filled from the dictionary"
          >
            <input
              id="ipa"
              className={cn(underlineInputClass, "font-mono text-base")}
              placeholder="/aɪˈtɪn.ər.ər.i/"
              {...form.register("ipa")}
            />
          </UnderlineField>

          <div>
            <div className="mb-2 text-sm font-extrabold">Level</div>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {CEFR_LEVELS.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  role="radio"
                  aria-checked={watched.level === lv}
                  onClick={() => form.setValue("level", lv)}
                  className={cn(
                    "inline-flex h-9 items-center rounded-[var(--radius-pill)] border-2 px-2",
                    watched.level === lv
                      ? "border-line bg-primary-soft"
                      : "border-line/40 bg-surface",
                  )}
                >
                  <LevelBadge level={lv} />
                </button>
              ))}
            </div>
          </div>

          <UnderlineField
            id="meaningVi"
            label="Vietnamese meaning"
            error={form.formState.errors.meaningVi?.message}
          >
            <input
              id="meaningVi"
              className={underlineInputClass}
              placeholder="lịch trình (chuyến đi)"
              {...form.register("meaningVi")}
            />
          </UnderlineField>

          <UnderlineField id="definitionEn" label="English definition" optional>
            <input
              id="definitionEn"
              className={underlineInputClass}
              placeholder="a detailed plan of a journey, with places and times"
              {...form.register("definitionEn")}
            />
          </UnderlineField>

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-extrabold">Example sentences</span>
              <span className="text-xs text-muted">
                the word is highlighted for you
              </span>
            </div>
            {examples.map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="font-hand w-6 text-lg text-accent">
                  {index + 1}.
                </span>
                <input
                  className={cn(underlineInputClass, "flex-1")}
                  placeholder={`Example ${index + 1}`}
                  {...form.register(`examples.${index}`)}
                />
                {examples.length > 1 ? (
                  <button
                    type="button"
                    aria-label={`Remove example ${index + 1}`}
                    onClick={() => removeExample(index)}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={addExample}
              className="font-hand inline-flex items-center gap-1 self-start text-lg text-kick"
            >
              <Plus className="size-4" /> Add example
            </button>
          </div>

          <UnderlineField
            id="wordSet"
            label="Add to word set"
            error={form.formState.errors.wordSetId?.message}
          >
            {!creatingNewSet ? (
              <select
                id="wordSet"
                className={cn(underlineInputClass, "font-sans text-base")}
                value={watched.wordSetId}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setCreatingNewSet(true);
                    form.setValue("wordSetId", "");
                    return;
                  }
                  form.setValue("wordSetId", e.target.value, {
                    shouldValidate: true,
                  });
                }}
              >
                {wordSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.title} · {set.topic} · {set.level}
                  </option>
                ))}
                <option value="__new__">+ Create new set…</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  className={cn(underlineInputClass, "flex-1")}
                  placeholder="New set title"
                  {...form.register("newWordSetTitle")}
                />
                <button
                  type="button"
                  className="text-sm font-bold text-muted"
                  onClick={() => {
                    setCreatingNewSet(false);
                    form.setValue("wordSetId", wordSets[0]?.id ?? "");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </UnderlineField>

          <UnderlineField id="notes" label="Notes" optional>
            <input
              id="notes"
              className={underlineInputClass}
              placeholder="Personal tip or mnemonic"
              {...form.register("notes")}
            />
          </UnderlineField>

          <UnderlineField id="imageUrl" label="Image" optional>
            <div className="flex flex-col gap-2">
              <input
                id="imageUrl"
                className={cn(underlineInputClass, "font-sans text-base")}
                placeholder="/files/… or upload below"
                {...form.register("imageUrl")}
              />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="text-sm"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              />
              <p className="m-0 text-xs text-muted">
                jpg / png / webp · max 2 MB
              </p>
            </div>
          </UnderlineField>

          {formError ? (
            <p className="m-0 text-sm font-semibold text-danger" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="rounded-[var(--radius-sketch)] border-2 border-dashed border-line/40 bg-surface/60 px-4 py-3 text-sm text-muted">
            <div className="font-extrabold text-ink">Pronunciation audio</div>
            Create UK &amp; US audio automatically
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <div className="flex-1" />
            {!editing ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={form.handleSubmit((v) => save(v, true))}
              >
                Save &amp; add another
              </Button>
            ) : null}
            <Button type="submit" disabled={pending}>
              {editing ? "Save changes" : "Save word"}
            </Button>
          </div>
        </form>

        <aside className="flex flex-col gap-6">
          <LivePreview
            word={watched.word ?? ""}
            ipa={watched.ipa ?? ""}
            partOfSpeech={(watched.partOfSpeech as PartOfSpeech) ?? "noun"}
            level={(watched.level as CefrLevel) ?? "A2"}
            meaningVi={watched.meaningVi ?? ""}
            example={watched.examples?.[0] ?? ""}
            setTitle={setTitle}
          />

          <div className="rounded-[8px_14px_10px_12px] bg-paper p-4 text-ink shadow-[var(--paper-shadow)]">
            <div className="font-hand text-xl">Added today</div>
            {addedToday.length === 0 ? (
              <div className="mt-3 flex flex-col items-center gap-2 py-4 text-center">
                <Mascot pose="sleep" size={88} />
                <p className="m-0 text-sm font-semibold">
                  Nothing here yet — the notebook is napping.
                </p>
                <p className="m-0 text-xs text-muted">
                  Chưa có từ nào hôm nay. Thêm từ đầu tiên để đánh thức sổ tay
                  nhé!
                </p>
              </div>
            ) : (
              <ul className="mt-3 m-0 flex list-none flex-col gap-3 p-0">
                {addedToday.map((w) => (
                  <li
                    key={w.id}
                    className="rounded-xl border border-line/20 bg-surface px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-hand text-xl">{w.word}</span>
                      <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-extrabold uppercase">
                        new!
                      </span>
                      <div className="flex-1" />
                      <LevelBadge level={w.level} />
                    </div>
                    <div className="text-sm text-muted">{w.meaningVi}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {mode === "page" ? (
            <Link href="/vocabulary" className="text-sm font-bold text-link">
              ← Back to vocabulary
            </Link>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
