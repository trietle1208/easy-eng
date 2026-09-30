import "server-only";

import { randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";

import type { db as Db } from "@/db";
import { db } from "@/db";
import { adminAuditLog, user } from "@/db/schema";

/** Drizzle handle: the pool client or an open transaction. */
export type DbOrTx = Pick<typeof Db, "insert" | "select">;

export type AuditAction =
  | "create"
  | "update"
  | "publish"
  | "unpublish"
  | "delete"
  | "import"
  | "upload";

export type AuditEntityType =
  | "grammar_lesson"
  | "grammar_family"
  | "grammar_group"
  | "reading_passage"
  | "listening_lesson"
  | "quiz"
  | "word_set"
  | "content_file"
  | "audio";

export type AuditInput = {
  actorUserId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  summary?: string;
  payload?: Record<string, unknown> | null;
};

/** Insert one audit row. Pass the transaction handle so it commits with the write. */
export async function writeAuditLog(
  handle: DbOrTx,
  input: AuditInput,
): Promise<void> {
  await handle.insert(adminAuditLog).values({
    id: randomUUID(),
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary ?? "",
    payload: input.payload ?? null,
  });
}

export type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: Date;
};

export async function listAuditLog(limit = 100): Promise<AuditLogRow[]> {
  return db
    .select({
      id: adminAuditLog.id,
      action: adminAuditLog.action,
      entityType: adminAuditLog.entityType,
      entityId: adminAuditLog.entityId,
      summary: adminAuditLog.summary,
      actorName: user.name,
      actorEmail: user.email,
      createdAt: adminAuditLog.createdAt,
    })
    .from(adminAuditLog)
    .leftJoin(user, eq(user.id, adminAuditLog.actorUserId))
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(limit);
}
