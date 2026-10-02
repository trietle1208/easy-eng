ALTER TABLE "word_sets" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "review_status" text DEFAULT 'human_reviewed' NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "ipa_status" text;--> statement-breakpoint
WITH ranked_words AS (
	SELECT id, (row_number() OVER (
		PARTITION BY word_set_id
		ORDER BY created_at ASC, word ASC, id ASC
	) - 1)::integer AS rn
	FROM words
)
UPDATE words AS w
SET sort_order = ranked_words.rn
FROM ranked_words
WHERE w.id = ranked_words.id;--> statement-breakpoint
WITH ranked_sets AS (
	SELECT id, (row_number() OVER (
		ORDER BY topic ASC, level ASC, title ASC, id ASC
	) - 1)::integer AS rn
	FROM word_sets
)
UPDATE word_sets AS s
SET sort_order = ranked_sets.rn
FROM ranked_sets
WHERE s.id = ranked_sets.id;--> statement-breakpoint
CREATE INDEX "word_sets_sort_order_idx" ON "word_sets" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "words_set_sort_order_idx" ON "words" USING btree ("word_set_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "words_system_word_pos_uidx" ON "words" USING btree (lower("word"),"part_of_speech") WHERE "words"."owner_id" is null;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_review_status_check" CHECK ("words"."review_status" in ('ai_generated', 'ai_checked', 'human_reviewed'));--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_ipa_status_check" CHECK ("words"."ipa_status" is null or "words"."ipa_status" in ('from_dict', 'proposed', 'missing'));