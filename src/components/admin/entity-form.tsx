"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { saveContentAction } from "@/lib/actions/admin-content";
import { uploadListeningAudioAction } from "@/lib/actions/admin-upload";
import type { FieldSpec, FormValues } from "@/lib/admin/forms";
import type { ContentKind, ContentStatus } from "@/lib/admin/validate";
import { cn } from "@/lib/utils";

export const adminInputClass =
  "w-full rounded-lg border-2 border-line bg-surface px-3 py-2 text-[15px] text-ink outline-none focus-visible:border-focus disabled:opacity-60";

type EntityFormProps = {
  kind: ContentKind;
  mode: "create" | "update";
  /** Existing entity id when editing. */
  existingId?: string;
  fields: FieldSpec[];
  initialValues: FormValues;
  status: ContentStatus | null;
};

export function EntityForm({
  kind,
  mode,
  existingId,
  fields,
  initialValues,
  status,
}: EntityFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "ok";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function set(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function submit(intent: "save" | "publish" | "draft") {
    setMessage(null);
    setFieldErrors({});
    startTransition(async () => {
      try {
        const res = await saveContentAction({
          kind,
          mode,
          existingId,
          values,
          intent,
        });
        if (!res.ok) {
          setFieldErrors(res.fieldErrors);
          setMessage({ tone: "error", text: res.message });
          return;
        }
        if (mode === "create") {
          router.push(`/admin/${kind}/${res.id}`);
        } else {
          setMessage({
            tone: "ok",
            text:
              res.status === "published"
                ? "Saved — live for learners."
                : "Saved as draft.",
          });
          router.refresh();
        }
      } catch (err) {
        setMessage({
          tone: "error",
          text: err instanceof Error ? err.message : "Save failed",
        });
      }
    });
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadListeningAudioAction(fd);
      if (!res.ok) {
        setFieldErrors(res.fieldErrors);
        setMessage({ tone: "error", text: res.message });
        return;
      }
      set("audioPath", res.key);
      setMessage({ tone: "ok", text: `Uploaded → ${res.key}` });
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  }

  const busy = pending || uploading;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit("save");
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => {
          const errors = fieldErrors[f.name];
          const wide = f.type === "json" || f.type === "textarea";
          const locked = mode === "update" && f.lockOnEdit;
          const id = `f-${f.name}`;
          return (
            <div
              key={f.name}
              className={cn("flex flex-col gap-1.5", wide && "md:col-span-2")}
            >
              <label htmlFor={id} className="text-sm font-extrabold">
                {f.label}
                {f.required ? <span className="text-danger"> *</span> : null}
              </label>

              {f.type === "select" ? (
                <select
                  id={id}
                  className={adminInputClass}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                >
                  {f.name === "groupId" ? (
                    <option value="">— choose —</option>
                  ) : null}
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" || f.type === "json" ? (
                <textarea
                  id={id}
                  rows={f.rows ?? 4}
                  spellCheck={f.type !== "json"}
                  className={cn(
                    adminInputClass,
                    f.type === "json" && "font-mono text-[13px] leading-snug",
                  )}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    id={id}
                    type={f.type === "number" ? "number" : "text"}
                    className={adminInputClass}
                    value={values[f.name] ?? ""}
                    disabled={locked}
                    onChange={(e) => set(f.name, e.target.value)}
                  />
                  {f.type === "audio" ? (
                    <label className="border-line bg-surface inline-flex shrink-0 cursor-pointer items-center rounded-lg border-2 px-3 text-sm font-bold">
                      {uploading ? "Uploading…" : "Upload"}
                      <input
                        type="file"
                        accept=".wav,.mp3,.ogg,.m4a,.webm,audio/*"
                        className="sr-only"
                        disabled={busy}
                        onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  ) : null}
                </div>
              )}

              {f.help ? (
                <p className="text-muted m-0 text-xs">{f.help}</p>
              ) : null}
              {errors?.map((e) => (
                <p key={e} className="text-danger m-0 text-sm font-semibold">
                  {e}
                </p>
              ))}
            </div>
          );
        })}
      </div>

      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={cn(
            "m-0 text-sm font-bold",
            message.tone === "error" ? "text-danger" : "text-success",
          )}
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" variant="ink" disabled={busy}>
          {pending ? "Saving…" : mode === "create" ? "Create draft" : "Save"}
        </Button>
        {status !== "published" ? (
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => submit("publish")}
          >
            Save &amp; publish
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => submit("draft")}
          >
            Save &amp; unpublish
          </Button>
        )}
      </div>
    </form>
  );
}
