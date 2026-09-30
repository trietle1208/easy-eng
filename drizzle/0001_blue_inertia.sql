CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"cefr_level" text DEFAULT 'A1' NOT NULL,
	"timezone" text DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	"goal_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"words_per_day" smallint DEFAULT 20 NOT NULL,
	"grammar_per_day" smallint DEFAULT 2 NOT NULL,
	"daily_reminder" boolean DEFAULT true NOT NULL,
	"reminder_time" text DEFAULT '20:30' NOT NULL,
	"reminder_days" text[] NOT NULL,
	"streak_rescue" boolean DEFAULT true NOT NULL,
	"interface_language" text DEFAULT 'en' NOT NULL,
	"show_vietnamese_hints" boolean DEFAULT true NOT NULL,
	"auto_play_pronunciation" boolean DEFAULT false NOT NULL,
	"theme" text DEFAULT 'default' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_words_per_day_check" CHECK ("user_settings"."words_per_day" in (10, 20, 30, 50)),
	CONSTRAINT "user_settings_grammar_per_day_check" CHECK ("user_settings"."grammar_per_day" in (1, 2, 3)),
	CONSTRAINT "user_settings_interface_language_check" CHECK ("user_settings"."interface_language" in ('en', 'vi')),
	CONSTRAINT "user_settings_theme_check" CHECK ("user_settings"."theme" in ('default', 'blossom'))
);
--> statement-breakpoint
CREATE TABLE "grammar_families" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"family_id" text NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"level" text NOT NULL,
	"family_id" text NOT NULL,
	"group_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"read_minutes" integer DEFAULT 4 NOT NULL,
	"intro_en" text NOT NULL,
	"intro_vi" text NOT NULL,
	"use_when_en" text NOT NULL,
	"use_when_vi" text NOT NULL,
	"structure" jsonb NOT NULL,
	"examples" jsonb NOT NULL,
	"mistakes" jsonb NOT NULL,
	"practice_quiz_slug" text,
	"practice_question_count" integer DEFAULT 10 NOT NULL,
	"practice_minutes" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grammar_lessons_slug_unique" UNIQUE("slug"),
	CONSTRAINT "grammar_lessons_level_check" CHECK ("grammar_lessons"."level" in ('A1', 'A2', 'B1', 'B2', 'C1'))
);
--> statement-breakpoint
CREATE TABLE "reading_paragraphs" (
	"id" text PRIMARY KEY NOT NULL,
	"passage_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"vi" text NOT NULL,
	"segments" jsonb NOT NULL,
	CONSTRAINT "reading_paragraphs_passage_sort_uidx" UNIQUE("passage_id","sort_order")
);
--> statement-breakpoint
CREATE TABLE "reading_passages" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"topic" text NOT NULL,
	"level" text NOT NULL,
	"minutes" integer NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"new_word_count" integer DEFAULT 0 NOT NULL,
	"family_label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_passages_slug_unique" UNIQUE("slug"),
	CONSTRAINT "reading_passages_level_check" CHECK ("reading_passages"."level" in ('A1', 'A2', 'B1', 'B2', 'C1'))
);
--> statement-breakpoint
CREATE TABLE "reading_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"passage_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"prompt" text NOT NULL,
	"choices" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	CONSTRAINT "reading_questions_passage_sort_uidx" UNIQUE("passage_id","sort_order")
);
--> statement-breakpoint
CREATE TABLE "reading_vocab_highlights" (
	"id" text PRIMARY KEY NOT NULL,
	"passage_id" text NOT NULL,
	"word" text NOT NULL,
	"ipa" text DEFAULT '' NOT NULL,
	"part_of_speech" text NOT NULL,
	"meaning_vi" text NOT NULL,
	"level" text NOT NULL,
	CONSTRAINT "reading_vocab_highlights_level_check" CHECK ("reading_vocab_highlights"."level" in ('A1', 'A2', 'B1', 'B2', 'C1'))
);
--> statement-breakpoint
CREATE TABLE "listening_dictation_blanks" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"prompt_before" text NOT NULL,
	"prompt_after" text NOT NULL,
	"answer" text NOT NULL,
	"accept" jsonb,
	CONSTRAINT "listening_dictation_lesson_sort_uidx" UNIQUE("lesson_id","sort_order")
);
--> statement-breakpoint
CREATE TABLE "listening_lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"topic" text NOT NULL,
	"level" text NOT NULL,
	"duration_seconds" integer NOT NULL,
	"audio_path" text NOT NULL,
	"speakers" integer DEFAULT 2 NOT NULL,
	"accent" text DEFAULT '' NOT NULL,
	"family_label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listening_lessons_slug_unique" UNIQUE("slug"),
	CONSTRAINT "listening_lessons_level_check" CHECK ("listening_lessons"."level" in ('A1', 'A2', 'B1', 'B2', 'C1'))
);
--> statement-breakpoint
CREATE TABLE "listening_transcript_sentences" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"speaker" text NOT NULL,
	"text" text NOT NULL,
	"start_ms" integer DEFAULT 0 NOT NULL,
	"end_ms" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "listening_transcript_lesson_sort_uidx" UNIQUE("lesson_id","sort_order")
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"score" integer NOT NULL,
	"total" integer NOT NULL,
	"passed" boolean NOT NULL,
	"time_used_seconds" integer NOT NULL,
	"accuracy" real NOT NULL,
	"answers" jsonb NOT NULL,
	"raw_answers" jsonb NOT NULL,
	"is_full_run" boolean DEFAULT true NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"quiz_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"type" text NOT NULL,
	"instruction_vi" text NOT NULL,
	"prompt_vi" text,
	"hint_en" text,
	"explanation_en" text NOT NULL,
	"explanation_vi" text NOT NULL,
	"review_before" text DEFAULT '' NOT NULL,
	"review_after" text DEFAULT '' NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "quiz_questions_quiz_sort_uidx" UNIQUE("quiz_id","sort_order"),
	CONSTRAINT "quiz_questions_type_check" CHECK ("quiz_questions"."type" in ('multiple_choice', 'fill_blank', 'correct_sentence'))
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"kick_en" text NOT NULL,
	"kick_vi" text NOT NULL,
	"breadcrumb" text NOT NULL,
	"level" text NOT NULL,
	"description_en" text NOT NULL,
	"description_vi" text NOT NULL,
	"time_limit_seconds" integer NOT NULL,
	"pass_score" integer NOT NULL,
	"question_types" jsonb NOT NULL,
	"lesson_href" text NOT NULL,
	"next_href" text NOT NULL,
	"next_label" text NOT NULL,
	"encouragement_en" text NOT NULL,
	"encouragement_vi" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quizzes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "quizzes_level_check" CHECK ("quizzes"."level" in ('A1', 'A2', 'B1', 'B2', 'C1'))
);
--> statement-breakpoint
CREATE TABLE "review_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"card_id" text NOT NULL,
	"rating" smallint NOT NULL,
	"scheduled_days" integer NOT NULL,
	"elapsed_days" integer NOT NULL,
	"review" timestamp with time zone NOT NULL,
	"state" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_word_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"word_id" text NOT NULL,
	"due" timestamp with time zone NOT NULL,
	"stability" real DEFAULT 0 NOT NULL,
	"difficulty" real DEFAULT 0 NOT NULL,
	"elapsed_days" integer DEFAULT 0 NOT NULL,
	"scheduled_days" integer DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"state" smallint DEFAULT 0 NOT NULL,
	"last_review" timestamp with time zone,
	CONSTRAINT "user_word_cards_user_word_uidx" UNIQUE("user_id","word_id")
);
--> statement-breakpoint
CREATE TABLE "word_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_vi" text NOT NULL,
	"topic" text NOT NULL,
	"level" text NOT NULL,
	"owner_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "word_sets_level_check" CHECK ("word_sets"."level" in ('A1', 'A2', 'B1', 'B2', 'C1'))
);
--> statement-breakpoint
CREATE TABLE "words" (
	"id" text PRIMARY KEY NOT NULL,
	"word_set_id" text NOT NULL,
	"owner_id" text,
	"word" text NOT NULL,
	"ipa" text DEFAULT '' NOT NULL,
	"part_of_speech" text NOT NULL,
	"level" text NOT NULL,
	"meaning_vi" text NOT NULL,
	"definition_en" text DEFAULT '' NOT NULL,
	"examples" jsonb NOT NULL,
	"collocations" jsonb,
	"notes" text,
	"image_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "words_level_check" CHECK ("words"."level" in ('A1', 'A2', 'B1', 'B2', 'C1'))
);
--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"local_date" date NOT NULL,
	"kind" text NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"payload" jsonb,
	CONSTRAINT "activity_events_kind_check" CHECK ("activity_events"."kind" in ('study_session', 'word_added', 'grammar_done', 'reading_done', 'listening_done', 'quiz_done', 'review_done'))
);
--> statement-breakpoint
CREATE TABLE "user_lesson_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"content_kind" text NOT NULL,
	"content_id" text NOT NULL,
	"status" text NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"last_position" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_lesson_progress_user_kind_id_uidx" UNIQUE("user_id","content_kind","content_id"),
	CONSTRAINT "user_lesson_progress_kind_check" CHECK ("user_lesson_progress"."content_kind" in ('grammar', 'reading', 'listening', 'vocabulary_set')),
	CONSTRAINT "user_lesson_progress_status_check" CHECK ("user_lesson_progress"."status" in ('not_started', 'in_progress', 'completed')),
	CONSTRAINT "user_lesson_progress_percent_check" CHECK ("user_lesson_progress"."progress_percent" >= 0 and "user_lesson_progress"."progress_percent" <= 100)
);
--> statement-breakpoint
CREATE TABLE "achievement_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle_template" text NOT NULL,
	"icon" text NOT NULL,
	"shape" text NOT NULL,
	"color" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"rule" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" text NOT NULL,
	"achievement_id" text NOT NULL,
	"earned_at" timestamp with time zone NOT NULL,
	"progress" jsonb,
	CONSTRAINT "user_achievements_user_id_achievement_id_pk" PRIMARY KEY("user_id","achievement_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_groups" ADD CONSTRAINT "grammar_groups_family_id_grammar_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."grammar_families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_lessons" ADD CONSTRAINT "grammar_lessons_family_id_grammar_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."grammar_families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_lessons" ADD CONSTRAINT "grammar_lessons_group_id_grammar_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."grammar_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_paragraphs" ADD CONSTRAINT "reading_paragraphs_passage_id_reading_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."reading_passages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_questions" ADD CONSTRAINT "reading_questions_passage_id_reading_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."reading_passages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_vocab_highlights" ADD CONSTRAINT "reading_vocab_highlights_passage_id_reading_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."reading_passages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_dictation_blanks" ADD CONSTRAINT "listening_dictation_blanks_lesson_id_listening_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."listening_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_transcript_sentences" ADD CONSTRAINT "listening_transcript_sentences_lesson_id_listening_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."listening_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_card_id_user_word_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."user_word_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_word_cards" ADD CONSTRAINT "user_word_cards_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_word_cards" ADD CONSTRAINT "user_word_cards_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_sets" ADD CONSTRAINT "word_sets_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_word_set_id_word_sets_id_fk" FOREIGN KEY ("word_set_id") REFERENCES "public"."word_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievement_definitions_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievement_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_uidx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "grammar_groups_family_id_idx" ON "grammar_groups" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "grammar_lessons_group_sort_idx" ON "grammar_lessons" USING btree ("group_id","sort_order");--> statement-breakpoint
CREATE INDEX "grammar_lessons_level_idx" ON "grammar_lessons" USING btree ("level");--> statement-breakpoint
CREATE INDEX "reading_passages_topic_level_idx" ON "reading_passages" USING btree ("topic","level");--> statement-breakpoint
CREATE INDEX "reading_vocab_highlights_passage_id_idx" ON "reading_vocab_highlights" USING btree ("passage_id");--> statement-breakpoint
CREATE INDEX "listening_lessons_topic_level_idx" ON "listening_lessons" USING btree ("topic","level");--> statement-breakpoint
CREATE INDEX "quiz_attempts_user_quiz_completed_idx" ON "quiz_attempts" USING btree ("user_id","quiz_id","completed_at");--> statement-breakpoint
CREATE INDEX "quiz_questions_type_idx" ON "quiz_questions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "review_logs_user_review_idx" ON "review_logs" USING btree ("user_id","review");--> statement-breakpoint
CREATE INDEX "user_word_cards_user_due_idx" ON "user_word_cards" USING btree ("user_id","due");--> statement-breakpoint
CREATE INDEX "word_sets_owner_id_idx" ON "word_sets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "word_sets_topic_level_idx" ON "word_sets" USING btree ("topic","level");--> statement-breakpoint
CREATE INDEX "words_word_set_id_idx" ON "words" USING btree ("word_set_id");--> statement-breakpoint
CREATE INDEX "words_owner_created_idx" ON "words" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_events_user_local_date_idx" ON "activity_events" USING btree ("user_id","local_date");--> statement-breakpoint
CREATE INDEX "activity_events_user_occurred_idx" ON "activity_events" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "user_lesson_progress_user_updated_idx" ON "user_lesson_progress" USING btree ("user_id","updated_at");