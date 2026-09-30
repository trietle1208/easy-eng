CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
ALTER TABLE "user_word_cards" ADD COLUMN IF NOT EXISTS "learning_steps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "words_user_set_word_uidx" ON "words" ("word_set_id","owner_id",lower("word")) WHERE "owner_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "words_system_set_word_uidx" ON "words" ("word_set_id",lower("word")) WHERE "owner_id" IS NULL;
