import { sql, type SQL } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const CEFR_VALUES = ["A1", "A2", "B1", "B2", "C1"] as const;
export type CefrDb = (typeof CEFR_VALUES)[number];

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** CEFR check constraint body — `column` is the table column ref from `pgTable` callback. */
export function cefrCheck(column: unknown): SQL {
  return sql`${column} in ('A1', 'A2', 'B1', 'B2', 'C1')`;
}
