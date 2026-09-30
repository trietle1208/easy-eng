"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  deleteContentAction,
  setContentStatusAction,
} from "@/lib/actions/admin-content";
import type { ContentKind, ContentStatus } from "@/lib/admin/validate";

type StatusActionsProps = {
  kind: ContentKind;
  id: string;
  status: ContentStatus;
  /** After delete, go to the list instead of staying on the (now missing) page. */
  redirectOnDelete?: string;
};

export function StatusActions({
  kind,
  id,
  status,
  redirectOnDelete,
}: StatusActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fn();
        if (!res.ok) {
          setError(res.message ?? "Failed");
          return;
        }
        if (redirectOnDelete) router.push(redirectOnDelete);
        else router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={status === "published" ? "outline" : "primary"}
          disabled={pending}
          onClick={() =>
            run(() =>
              setContentStatusAction({
                kind,
                id,
                status: status === "published" ? "draft" : "published",
              }),
            )
          }
        >
          {status === "published" ? "Unpublish" : "Publish"}
        </Button>
        {status === "draft" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-danger"
            disabled={pending}
            onClick={() => {
              if (window.confirm(`Delete draft "${id}"? This cannot be undone.`)) {
                run(() => deleteContentAction({ kind, id }));
              }
            }}
          >
            Delete
          </Button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-danger m-0 text-xs font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
