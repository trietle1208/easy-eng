"use client";

import { useState, useTransition } from "react";

import { adminInputClass } from "@/components/admin/entity-form";
import { Button } from "@/components/ui/button";
import { importContentAction } from "@/lib/actions/admin-import";
import {
  CONTENT_KINDS,
  KIND_LABELS,
  type ContentKind,
} from "@/lib/admin/validate";
import { cn } from "@/lib/utils";

export function ImportForm() {
  const [kind, setKind] = useState<ContentKind>("grammar");
  const [status, setStatus] = useState<"keep" | "draft" | "published">("keep");
  const [json, setJson] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    tone: "ok" | "error";
    text: string;
    details?: string[];
  } | null>(null);

  function onFile(file: File | null) {
    if (!file) return;
    void file.text().then(setJson);
  }

  function submit() {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await importContentAction({ kind, json, status });
        if (!res.ok) {
          setResult({
            tone: "error",
            text: res.message,
            details: Object.entries(res.fieldErrors).flatMap(([k, v]) =>
              v.map((m) => (k === "_form" ? m : `${k}: ${m}`)),
            ),
          });
          return;
        }
        setResult({
          tone: "ok",
          text: `Imported ${Object.entries(res.counts)
            .map(([k, n]) => `${n} ${k}`)
            .join(", ")}.`,
        });
      } catch (err) {
        setResult({
          tone: "error",
          text: err instanceof Error ? err.message : "Import failed",
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-extrabold">
          Content type
          <select
            className={adminInputClass}
            value={kind}
            onChange={(e) => setKind(e.target.value as ContentKind)}
          >
            {CONTENT_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-extrabold">
          Status for imported items
          <select
            className={adminInputClass}
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "keep" | "draft" | "published")
            }
          >
            <option value="keep">Keep existing status (new items → draft)</option>
            <option value="draft">Force draft</option>
            <option value="published">Force published</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-extrabold">
        JSON file (same format as <code>content/{kind}.json</code>)
        <input
          type="file"
          accept="application/json,.json"
          className="text-sm font-normal"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <textarea
        aria-label="JSON document"
        rows={14}
        spellCheck={false}
        className={cn(adminInputClass, "font-mono text-[13px] leading-snug")}
        placeholder='{ "lessons": [ … ] }'
        value={json}
        onChange={(e) => setJson(e.target.value)}
      />

      {result ? (
        <div
          role={result.tone === "error" ? "alert" : "status"}
          className={cn(
            "text-sm font-bold",
            result.tone === "error" ? "text-danger" : "text-success",
          )}
        >
          <p className="m-0">{result.text}</p>
          {result.details && result.details.length > 1 ? (
            <ul className="m-0 mt-1 list-disc pl-5 font-normal">
              {result.details.slice(0, 8).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div>
        <Button size="sm" disabled={pending || json.trim() === ""} onClick={submit}>
          {pending ? "Importing…" : "Validate & import"}
        </Button>
      </div>
    </div>
  );
}
