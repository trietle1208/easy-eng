import "server-only";

import { and, inArray, ne } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";

import type { db } from "@/db";
import { ActionError } from "@/lib/errors/action";
import type { ContentStatus } from "@/lib/admin/validate";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type AdminListRow = {
  id: string;
  slug: string;
  title: string;
  level: string;
  status: ContentStatus;
  updatedAt: Date | null;
  /** Short extra info shown in the list (topic, counts, …). */
  meta: string;
};

export function asStatus(value: string): ContentStatus {
  return value === "draft" ? "draft" : "published";
}

/** Status to write. `keep` = leave existing rows alone, new rows start as draft. */
export type WriteStatus = ContentStatus | "keep";

export function statusColumns(status: WriteStatus): {
  insert: { status: ContentStatus };
  update: { status?: ContentStatus };
} {
  return status === "keep"
    ? { insert: { status: "draft" }, update: {} }
    : { insert: { status }, update: { status } };
}

/** Postgres unique violation (drizzle wraps the pg error in `cause`). */
export function isUniqueViolation(err: unknown): boolean {
  const code = (e: unknown) => (e as { code?: string } | null)?.code;
  return (
    code(err) === "23505" ||
    code((err as { cause?: unknown } | null)?.cause) === "23505"
  );
}

export function conflictError(message: string, field = "_form"): ActionError {
  return new ActionError(message, {
    code: "VALIDATION",
    fieldErrors: { [field]: [message] },
  });
}

/**
 * Child rows use globally-unique text ids. Make sure none of the ids we are
 * about to write already belong to a *different* parent (would silently steal rows).
 */
export async function assertChildIdsFree(
  tx: Tx,
  table: PgTable,
  idCol: AnyPgColumn,
  parentCol: AnyPgColumn,
  ids: string[],
  parentId: string,
  label: string,
): Promise<void> {
  if (ids.length === 0) return;
  const rows = await tx
    .select({ id: idCol })
    .from(table)
    .where(and(inArray(idCol, ids), ne(parentCol, parentId)))
    .limit(1);
  if (rows[0]) {
    throw conflictError(
      `${label} id "${String(rows[0].id)}" is already used by another item — ids must be unique across the site.`,
    );
  }
}
