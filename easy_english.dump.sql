--
-- PostgreSQL database dump
--

\restrict Z2f3tSh197MWdhbQwqL339eDWj1T9FJajbsqbdeyd9dhv3de5dnRU5CrSOo4MHK

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account (
    id text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    scope text,
    password text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: achievement_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievement_definitions (
    id text NOT NULL,
    title text NOT NULL,
    subtitle_template text NOT NULL,
    icon text NOT NULL,
    shape text NOT NULL,
    color text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    rule jsonb NOT NULL
);


--
-- Name: activity_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_events (
    id text NOT NULL,
    user_id text NOT NULL,
    occurred_at timestamp with time zone NOT NULL,
    local_date date NOT NULL,
    kind text NOT NULL,
    duration_seconds integer DEFAULT 0 NOT NULL,
    payload jsonb,
    CONSTRAINT activity_events_kind_check CHECK ((kind = ANY (ARRAY['study_session'::text, 'word_added'::text, 'grammar_done'::text, 'reading_done'::text, 'listening_done'::text, 'quiz_done'::text, 'review_done'::text])))
);


--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_log (
    id text NOT NULL,
    actor_user_id text NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    summary text DEFAULT ''::text NOT NULL,
    payload jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: grammar_families; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grammar_families (
    id text NOT NULL,
    title text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: grammar_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grammar_groups (
    id text NOT NULL,
    family_id text NOT NULL,
    title text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: grammar_lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grammar_lessons (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    level text NOT NULL,
    family_id text NOT NULL,
    group_id text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    read_minutes integer DEFAULT 4 NOT NULL,
    intro_en text NOT NULL,
    intro_vi text NOT NULL,
    use_when_en text NOT NULL,
    use_when_vi text NOT NULL,
    structure jsonb NOT NULL,
    examples jsonb NOT NULL,
    mistakes jsonb NOT NULL,
    practice_quiz_slug text,
    practice_question_count integer DEFAULT 10 NOT NULL,
    practice_minutes integer DEFAULT 5 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'published'::text NOT NULL,
    CONSTRAINT grammar_lessons_level_check CHECK ((level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text]))),
    CONSTRAINT grammar_lessons_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


--
-- Name: listening_dictation_blanks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listening_dictation_blanks (
    id text NOT NULL,
    lesson_id text NOT NULL,
    sort_order integer NOT NULL,
    prompt_before text NOT NULL,
    prompt_after text NOT NULL,
    answer text NOT NULL,
    accept jsonb
);


--
-- Name: listening_lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listening_lessons (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    topic text NOT NULL,
    level text NOT NULL,
    duration_seconds integer NOT NULL,
    audio_path text NOT NULL,
    speakers integer DEFAULT 2 NOT NULL,
    accent text DEFAULT ''::text NOT NULL,
    family_label text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'published'::text NOT NULL,
    CONSTRAINT listening_lessons_level_check CHECK ((level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text]))),
    CONSTRAINT listening_lessons_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


--
-- Name: listening_transcript_sentences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listening_transcript_sentences (
    id text NOT NULL,
    lesson_id text NOT NULL,
    sort_order integer NOT NULL,
    speaker text NOT NULL,
    text text NOT NULL,
    start_ms integer DEFAULT 0 NOT NULL,
    end_ms integer DEFAULT 0 NOT NULL
);


--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_attempts (
    id text NOT NULL,
    user_id text NOT NULL,
    quiz_id text NOT NULL,
    score integer NOT NULL,
    total integer NOT NULL,
    passed boolean NOT NULL,
    time_used_seconds integer NOT NULL,
    accuracy real NOT NULL,
    answers jsonb NOT NULL,
    raw_answers jsonb NOT NULL,
    is_full_run boolean DEFAULT true NOT NULL,
    completed_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    client_attempt_id text
);


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    id text NOT NULL,
    quiz_id text NOT NULL,
    sort_order integer NOT NULL,
    type text NOT NULL,
    instruction_vi text NOT NULL,
    prompt_vi text,
    hint_en text,
    explanation_en text NOT NULL,
    explanation_vi text NOT NULL,
    review_before text DEFAULT ''::text NOT NULL,
    review_after text DEFAULT ''::text NOT NULL,
    payload jsonb NOT NULL,
    CONSTRAINT quiz_questions_type_check CHECK ((type = ANY (ARRAY['multiple_choice'::text, 'fill_blank'::text, 'correct_sentence'::text])))
);


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    kick_en text NOT NULL,
    kick_vi text NOT NULL,
    breadcrumb text NOT NULL,
    level text NOT NULL,
    description_en text NOT NULL,
    description_vi text NOT NULL,
    time_limit_seconds integer NOT NULL,
    pass_score integer NOT NULL,
    question_types jsonb NOT NULL,
    lesson_href text NOT NULL,
    next_href text NOT NULL,
    next_label text NOT NULL,
    encouragement_en text NOT NULL,
    encouragement_vi text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'published'::text NOT NULL,
    CONSTRAINT quizzes_level_check CHECK ((level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text]))),
    CONSTRAINT quizzes_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


--
-- Name: reading_paragraphs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_paragraphs (
    id text NOT NULL,
    passage_id text NOT NULL,
    sort_order integer NOT NULL,
    vi text NOT NULL,
    segments jsonb NOT NULL
);


--
-- Name: reading_passages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_passages (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    topic text NOT NULL,
    level text NOT NULL,
    minutes integer NOT NULL,
    word_count integer DEFAULT 0 NOT NULL,
    new_word_count integer DEFAULT 0 NOT NULL,
    family_label text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'published'::text NOT NULL,
    CONSTRAINT reading_passages_level_check CHECK ((level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text]))),
    CONSTRAINT reading_passages_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


--
-- Name: reading_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_questions (
    id text NOT NULL,
    passage_id text NOT NULL,
    sort_order integer NOT NULL,
    prompt text NOT NULL,
    choices jsonb NOT NULL,
    correct_index integer NOT NULL
);


--
-- Name: reading_vocab_highlights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_vocab_highlights (
    id text NOT NULL,
    passage_id text NOT NULL,
    word text NOT NULL,
    ipa text DEFAULT ''::text NOT NULL,
    part_of_speech text NOT NULL,
    meaning_vi text NOT NULL,
    level text NOT NULL,
    CONSTRAINT reading_vocab_highlights_level_check CHECK ((level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text])))
);


--
-- Name: review_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_logs (
    id text NOT NULL,
    user_id text NOT NULL,
    card_id text NOT NULL,
    rating smallint NOT NULL,
    scheduled_days integer NOT NULL,
    elapsed_days integer NOT NULL,
    review timestamp with time zone NOT NULL,
    state smallint NOT NULL
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    id text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    token text NOT NULL,
    ip_address text,
    user_agent text,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    image text,
    cefr_level text DEFAULT 'A1'::text NOT NULL,
    timezone text DEFAULT 'Asia/Ho_Chi_Minh'::text NOT NULL,
    goal_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    CONSTRAINT user_role_check CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text])))
);


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    user_id text NOT NULL,
    achievement_id text NOT NULL,
    earned_at timestamp with time zone NOT NULL,
    progress jsonb
);


--
-- Name: user_lesson_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_lesson_progress (
    id text NOT NULL,
    user_id text NOT NULL,
    content_kind text NOT NULL,
    content_id text NOT NULL,
    status text NOT NULL,
    progress_percent integer DEFAULT 0 NOT NULL,
    last_position jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_lesson_progress_kind_check CHECK ((content_kind = ANY (ARRAY['grammar'::text, 'reading'::text, 'listening'::text, 'vocabulary_set'::text]))),
    CONSTRAINT user_lesson_progress_percent_check CHECK (((progress_percent >= 0) AND (progress_percent <= 100))),
    CONSTRAINT user_lesson_progress_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])))
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    user_id text NOT NULL,
    words_per_day smallint DEFAULT 20 NOT NULL,
    grammar_per_day smallint DEFAULT 2 NOT NULL,
    daily_reminder boolean DEFAULT true NOT NULL,
    reminder_time text DEFAULT '20:30'::text NOT NULL,
    reminder_days text[] NOT NULL,
    streak_rescue boolean DEFAULT true NOT NULL,
    interface_language text DEFAULT 'en'::text NOT NULL,
    show_vietnamese_hints boolean DEFAULT true NOT NULL,
    auto_play_pronunciation boolean DEFAULT false NOT NULL,
    theme text DEFAULT 'default'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_settings_grammar_per_day_check CHECK ((grammar_per_day = ANY (ARRAY[1, 2, 3]))),
    CONSTRAINT user_settings_interface_language_check CHECK ((interface_language = ANY (ARRAY['en'::text, 'vi'::text]))),
    CONSTRAINT user_settings_theme_check CHECK ((theme = ANY (ARRAY['default'::text, 'blossom'::text]))),
    CONSTRAINT user_settings_words_per_day_check CHECK ((words_per_day = ANY (ARRAY[10, 20, 30, 50])))
);


--
-- Name: user_word_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_word_cards (
    id text NOT NULL,
    user_id text NOT NULL,
    word_id text NOT NULL,
    due timestamp with time zone NOT NULL,
    stability real DEFAULT 0 NOT NULL,
    difficulty real DEFAULT 0 NOT NULL,
    elapsed_days integer DEFAULT 0 NOT NULL,
    scheduled_days integer DEFAULT 0 NOT NULL,
    reps integer DEFAULT 0 NOT NULL,
    lapses integer DEFAULT 0 NOT NULL,
    state smallint DEFAULT 0 NOT NULL,
    last_review timestamp with time zone,
    learning_steps integer DEFAULT 0 NOT NULL
);


--
-- Name: verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: word_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.word_sets (
    id text NOT NULL,
    title text NOT NULL,
    title_vi text NOT NULL,
    topic text NOT NULL,
    level text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'published'::text NOT NULL,
    CONSTRAINT word_sets_level_check CHECK ((level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text]))),
    CONSTRAINT word_sets_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


--
-- Name: words; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.words (
    id text NOT NULL,
    word_set_id text NOT NULL,
    owner_id text,
    word text NOT NULL,
    ipa text DEFAULT ''::text NOT NULL,
    part_of_speech text NOT NULL,
    level text NOT NULL,
    meaning_vi text NOT NULL,
    definition_en text DEFAULT ''::text NOT NULL,
    examples jsonb NOT NULL,
    collocations jsonb,
    notes text,
    image_path text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT words_level_check CHECK ((level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text])))
);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	6ade742e9444917ecc9632a910eb462be5460558089f19004aa12f8fd14328c6	1727680000000
2	e7f94fa2ef7ee9003195d2399c74c1f02d34d509072a40e869feac458a19642d	1790738481630
3	2916512bd07167aa34d657f92152af48ee0f0735a34640c8b4d90cbfc25207c4	1790750423079
4	8e87cf860b90191ae3142b1ff1b667dccbec8466d605253070ed650273b480e7	1790760000000
5	8b596874d97c8baa1ca84724de5a84754ef5a106db63c7348da2fbc362e87862	1790761000000
\.


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at) FROM stdin;
acdb30bfc2870307911408d3	user-linh	credential	user-linh	\N	\N	\N	\N	\N	\N	27d70724a6ccd69c5075b91b21ee75d8:9e7244beee5157888fa7bf100b56f782d40d7f9eba76cda8bcf9e04e0ea69c63c9813f4265e06ab822da68bb87dec8054f824907f7fa241ec19d22cdb0a0ccc5	2026-09-30 03:25:31.52325+00	2026-09-30 03:25:42.233+00
5Jyg2aZmOFyFYC1H9Z3IDMPBsYgxKW3Q	s8Z2ag6EkxbDhQZUZmuyxiKGc2peyDhJ	credential	s8Z2ag6EkxbDhQZUZmuyxiKGc2peyDhJ	\N	\N	\N	\N	\N	\N	6c5040b61073e4d19d11a9ab5ab05a17:2398538d342f87f8202cdbbd4b04ce43b36d5e1d5ae87d105b5a050105835a0858384e7d876a6c70473a00a324722b33e27cae1f7e3f591e12b16454ed6b817a	2026-09-30 08:40:21.515+00	2026-09-30 08:40:21.515+00
5shgODgMMg5lxw1tzb7LMAsO7xMy62j6	kwfxP73XLJMIa57epp3nsU0B1qv1qlfU	credential	kwfxP73XLJMIa57epp3nsU0B1qv1qlfU	\N	\N	\N	\N	\N	\N	49e9a2d26f8d1fdd74057307aa39ffc6:669765a56b38a75e5f406ecd91c52259bc1230c614a38c724be43e6972a54daec56303f00a332f7e409ef1412a8a2810b719c6efe75f8ab3d442edd2d459db84	2026-09-30 08:42:07.728+00	2026-09-30 08:42:07.728+00
XGNt4skJj4qrrl4LL6WfOFnWCSTJU5D6	tJJVzu7WtC0izQqsXNXrXDa3JbavJ6KD	credential	tJJVzu7WtC0izQqsXNXrXDa3JbavJ6KD	\N	\N	\N	\N	\N	\N	235ec3ea516010abbd04e6a718ae7be1:e8ca55492f4daeea95d56721de0c99f348512e36b5b6795b533375f0b133cb4d715232c05e11fa62d9779a144e934720a35ac3e5dfeaebe10175360855612e68	2026-09-30 08:44:40.191+00	2026-09-30 08:44:40.191+00
7aac72c4-2611-42b5-9050-6353c6f1777b	963956b9-732e-4136-9e0c-a4400ac7aa00	credential	963956b9-732e-4136-9e0c-a4400ac7aa00	\N	\N	\N	\N	\N	\N	eb97b475f5248d67b515283b4b2790f9:af180253be606de6df1431f7047510a3e4832a142d9c800c3c77e0cc31519cb6121b2b41398e20842a64f918a9050dc51377f5567a27feccefe9f707b3a25f95	2026-09-30 08:45:01.119031+00	2026-09-30 08:45:01.119031+00
1gQqadAlmeRW7DpJPq4jIYJELOtnl2XJ	NM6lUYr2vn78KnAXFJqOMaIS1iMacCQs	credential	NM6lUYr2vn78KnAXFJqOMaIS1iMacCQs	\N	\N	\N	\N	\N	\N	f6ccbb573b82d5e8345cd6e378f2b1fe:c6cad4d31d0ba8a8f56915f2cb890d2c2d6fd731c9baddbe7705490a4abe977a417afaf7337c97a2c4b46daf7ef94d14423bb895e0d95728637ce1a6e640b877	2026-09-30 08:59:42.815+00	2026-09-30 08:59:42.815+00
774acefc-539c-420b-83da-96ca3bedf742	8e6e8647-59de-4684-a673-c777de938c6d	credential	8e6e8647-59de-4684-a673-c777de938c6d	\N	\N	\N	\N	\N	\N	9c69d0054647080c518064a9a9781ae2:94e1f845823a58cfbc290a66b5c1c26d27c8daa8f9df4706b4708bb14f3a5053dcfd068c766a310a87087cb97052f40757e7e05622a7330a343b2bf922f5aea9	2026-09-30 08:59:51.523699+00	2026-09-30 08:59:51.523699+00
ZyEvxSf1kOfoUBfaP8vVOjoHaz7GyV24	AtPHMmittFnK82bXQbuKdqNfHLTUMYSS	credential	AtPHMmittFnK82bXQbuKdqNfHLTUMYSS	\N	\N	\N	\N	\N	\N	a42d2ac32071d315e20390db7aa56ad5:c1cf0746a0f7680a055c95098434480589e33befea244d13ce32137aabff37d96208e0b191e330fb05107f01916b95d6a54c9aed8fa61feacfdcf7b039d06da9	2026-09-30 09:03:59.531+00	2026-09-30 09:03:59.531+00
db021cd1-6692-4193-ae6b-14fe49e591f7	b665efc4-613d-44ae-8b58-3a10d97904f4	credential	b665efc4-613d-44ae-8b58-3a10d97904f4	\N	\N	\N	\N	\N	\N	84e72f7da09c834597fd11c15acd5834:d39498710bd4feb11bda95bae6bb1f2b089985bfe83e020a0e6ca3f8dcd1a1c493dbb8459b3d07ca6090ec4b7cc48f1df47fa9dbd03207367786394c6fbdf2e3	2026-09-30 09:04:19.018903+00	2026-09-30 09:04:19.018903+00
5c1878ce-ccae-447f-b1e5-39b976632dc9	b044c8cc-acc1-42db-9f67-bd32602542b1	credential	b044c8cc-acc1-42db-9f67-bd32602542b1	\N	\N	\N	\N	\N	\N	2d43730438312cc0efd86b91648b96b8:5116da17750687b7e3e76e9da9f57f7e17623c4d8703f2ceb47d0717827ff7759c4745cb0b5f425549e0668878c893c190a332b08e1a368d7c206d2e29f5f43c	2026-09-30 09:49:44.977973+00	2026-09-30 09:49:44.977973+00
5f752266-96a9-4a10-8d01-688a80407c47	fbdcc509-ac98-41cb-9e1c-096affe45133	credential	fbdcc509-ac98-41cb-9e1c-096affe45133	\N	\N	\N	\N	\N	\N	dea0c6ac3e57401f0e913c32fc828347:ce58fee6734376803de2252fba4928730f48642180c4e75625bdaa2279a7acfb1b369ba2d3a9f443fc77079270f04445ef5753586ce1e225c94a06bf7d443d32	2026-09-30 09:50:07.13321+00	2026-09-30 09:50:07.13321+00
rmgXyyiE71L4u39PidjYphDkCKYEQjaa	uLAQMlC0aAgUNtTP71ee2L7ugxJE9ldL	credential	uLAQMlC0aAgUNtTP71ee2L7ugxJE9ldL	\N	\N	\N	\N	\N	\N	662d41fff41b04e0743a0c5646b46ea8:5f2d8504d3598237dd5705aad87dbc327371c9003c7a07ce2910bd3c9201e46e173a34dd7040a076585c77e58165df7ae6c2ddec96a68f459bc5e52795cf43e8	2026-09-30 09:50:55.971+00	2026-09-30 09:50:55.971+00
ec37205b-dc13-4dc5-81db-af2f0dcb3b67	ac6eaba3-d035-435b-82f3-fd2e85d87e55	credential	ac6eaba3-d035-435b-82f3-fd2e85d87e55	\N	\N	\N	\N	\N	\N	a0b98a34f8ecefee533e57a2fc8102c7:e2ccfaf76f5ca07632f9a69d9ed93452747d48e9d16689672c5205f248efd6e2be6cb2946b9d7f00e72f815727c2c2a7f62802c85600f8ec9312379e3156a09d	2026-09-30 09:51:12.851864+00	2026-09-30 09:51:12.851864+00
3f50f81c-a630-4dad-a1e6-c252594212c2	113e3cdd-f270-447e-b1fa-32ffecc14d3b	credential	113e3cdd-f270-447e-b1fa-32ffecc14d3b	\N	\N	\N	\N	\N	\N	acc4dcd8f27ee7575005d68c732f8096:f665fa5ccf7997943fbdc3766fd32805b7d32070a599c3cd6e7473334466cb386a36ae00a1bd1cf4715bee558c540437a51883909d59caf85af7add69a6ca6ce	2026-09-30 09:55:19.240975+00	2026-09-30 09:55:19.240975+00
5751a596-3d47-48c1-aaee-13ac45344609	f55b8ab9-61de-475d-a6d9-c4df914db292	credential	f55b8ab9-61de-475d-a6d9-c4df914db292	\N	\N	\N	\N	\N	\N	7e40b3e202ae7a0ae19837968146d83f:9fe57973ff36ec90129d560bd290dac649bf681446a49847fed7560e25cb8d4b3665e24331b2e2a3d67ab3069311892d1eebef420083fa126d74b868af8e0ea5	2026-09-30 09:55:31.888088+00	2026-09-30 09:55:31.888088+00
ee253edd-7af1-4fa5-8e63-996f3c821732	0e34f4aa-b6e0-41ff-86d3-fdd0bdfaa410	credential	0e34f4aa-b6e0-41ff-86d3-fdd0bdfaa410	\N	\N	\N	\N	\N	\N	58ed2c382fac701c8301b295555b17c6:1b30395a6e211481841e3a08f9ca6883617f971348cab8a0690cc686b95e7756ead5d0021e80ea423c6f9bc957965fdfe0246ccc8c9fe2064f7fb28913a6fe14	2026-09-30 09:56:33.008015+00	2026-09-30 09:56:33.008015+00
73bb19b1-c74b-4715-8210-26409233d38e	a1d8083f-588b-426c-b158-4514b939070a	credential	a1d8083f-588b-426c-b158-4514b939070a	\N	\N	\N	\N	\N	\N	e84fb5670d337550506c8dc614bad67a:24814cea60d894f99f0ae4148df59fec59aafb7b6725d8c2eac47d2dd2a1634b450704f0f794aa32eaa8a42c4bfcd1b7f142912a768287cb523f291972d4b4bd	2026-09-30 09:56:44.351103+00	2026-09-30 09:56:44.351103+00
C6lT4VGiPKNERzo7qW4XmPDA6caniRxg	XJv75hoRGsYGxRn6xiYf0xf09EX1ZzXZ	credential	XJv75hoRGsYGxRn6xiYf0xf09EX1ZzXZ	\N	\N	\N	\N	\N	\N	ecb8e1dbd0e63494205efb419e087548:a89a342ad47fbfe2f9cfb98ada9e2df896994d49880a4b6168e6cd2b7c13028c8faf6100602145e8ba7e9cd4303a281a3ef955b95edeb03cb3529af676e07330	2026-09-30 09:56:52.069+00	2026-09-30 09:56:52.069+00
d057bdf6-1f4e-49a9-b9f0-9979e0e10852	033c9876-883f-483c-9994-7c80c2e2dcf0	credential	033c9876-883f-483c-9994-7c80c2e2dcf0	\N	\N	\N	\N	\N	\N	e787779703daf4270f36b5366308f3c0:ad0204452f543cb966d9c18531651d6194bd98d7c7ac236e213c05608964de1a9eee1cbb1c6867d836e4c974d76bd195df19207c724ce78f2e6f5ef4159be0dc	2026-09-30 09:56:55.799742+00	2026-09-30 09:56:55.799742+00
rN6xGEtD2G9cWgqollmwKnL0QKIojuVX	XC87UBk37bVbvxj5Tzeg0cQu6EywpK2s	credential	XC87UBk37bVbvxj5Tzeg0cQu6EywpK2s	\N	\N	\N	\N	\N	\N	53a339cf5dd2d4030c10239c66cac1bd:b33e4a5d63725d4041dacae5dc3f194c5c19e3366c4fec1d990345c929a87c05616c32200d454dc8adc0dd51d5878c93dc21691ad491a04c587f857ded8b00db	2026-10-01 03:17:33.9+00	2026-10-01 03:17:33.9+00
jsc77hcXObN1L51OEfCSMnufQaMIflp1	YCUL9L6ADd1I7EToiqxQ5S7xhQSes16s	credential	YCUL9L6ADd1I7EToiqxQ5S7xhQSes16s	\N	\N	\N	\N	\N	\N	51eb01fa3e0e396b88a3ac151f0c17c7:e11aefb7ab5ef43eae9a2a3e675cb6d1747b1b7b5a9204166391f5c7856621566315c5fac656c5c4f88b70a8fbcc8b11e3bd98f1ab8ce1403158db0145e40f95	2026-10-01 03:21:16.1+00	2026-10-01 03:21:16.1+00
\.


--
-- Data for Name: achievement_definitions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.achievement_definitions (id, title, subtitle_template, icon, shape, color, sort_order, rule) FROM stdin;
first-page	First page	Finished lesson 1	book	round	green	0	{"min": 1, "type": "grammar_completed"}
streak-7	7-day streak	Earned 4 Sep	flame	square	orange	1	{"min": 7, "type": "streak_days"}
word-collector	Word collector	1,000 words	cards	round	blue	2	{"min": 1000, "type": "words_saved"}
grammar-geek	Grammar geek	50 lessons	pencil	square	purple	3	{"min": 50, "type": "grammar_completed"}
early-bird	Early bird	Studied before 7 am	sun	round	gold	4	{"hour": 7, "type": "activity_before_hour"}
streak-30	30-day streak	23 of 30 days	flame	square	orange	5	{"min": 30, "type": "streak_days"}
night-owl	Night owl	Study after 11 pm	moon	round	blue	6	{"hour": 23, "type": "activity_after_hour"}
b2-unlocked	B2 unlocked	Finish B1	trophy	square	gold	7	{"type": "cefr_at_least", "level": "B2"}
\.


--
-- Data for Name: activity_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_events (id, user_id, occurred_at, local_date, kind, duration_seconds, payload) FROM stdin;
9b7c60a0a3c944eb2fca70c9	user-linh	2026-09-30 03:00:00+00	2026-09-30	study_session	900	{"source": "seed"}
6522333bd310dddca21e8297	user-linh	2026-09-29 03:00:00+00	2026-09-29	study_session	930	{"source": "seed"}
6f485903d9c9711cc892d4ff	user-linh	2026-09-28 03:00:00+00	2026-09-28	study_session	960	{"source": "seed"}
0e843ac466af14289973360f	user-linh	2026-09-27 03:00:00+00	2026-09-27	study_session	990	{"source": "seed"}
e1eddd8d257dde862225f4a1	user-linh	2026-09-26 03:00:00+00	2026-09-26	study_session	1020	{"source": "seed"}
0e6b4c9228a29049257d71d9	user-linh	2026-09-25 03:00:00+00	2026-09-25	study_session	1050	{"source": "seed"}
035f92df158a2fd4670e2a73	user-linh	2026-09-24 03:00:00+00	2026-09-24	study_session	1080	{"source": "seed"}
2cae6b91a5cc82c595b1fe2c	user-linh	2026-09-23 03:00:00+00	2026-09-23	study_session	1110	{"source": "seed"}
5857348669f6de10cb627f32	user-linh	2026-09-22 03:00:00+00	2026-09-22	study_session	1140	{"source": "seed"}
f23ca431a88e7b925fa0eaa0	user-linh	2026-09-21 03:00:00+00	2026-09-21	study_session	1170	{"source": "seed"}
c5209a76a9e9cc07e765f62f	user-linh	2026-09-20 03:00:00+00	2026-09-20	study_session	1200	{"source": "seed"}
75deb2b70038321436dc5d33	user-linh	2026-09-19 03:00:00+00	2026-09-19	study_session	1230	{"source": "seed"}
01f7011e7ed32173fb7daaca	user-linh	2026-09-18 03:00:00+00	2026-09-18	study_session	1260	{"source": "seed"}
12ef54e6c9f962741e0c0e72	user-linh	2026-09-17 03:00:00+00	2026-09-17	study_session	1290	{"source": "seed"}
8f286e79-bf5d-4e42-b36b-4117a5b9d054	963956b9-732e-4136-9e0c-a4400ac7aa00	2026-09-30 08:45:21.316+00	2026-09-30	quiz_done	5	{"ref": "present-perfect-vs-past-simple:8c90b4fa-72ec-4e7c-b8a3-c6191f4a152e", "score": 0, "total": 10, "passed": false, "quizSlug": "present-perfect-vs-past-simple", "isFullRun": true}
051269ff-cf54-4563-8483-0e01a04a06aa	963956b9-732e-4136-9e0c-a4400ac7aa00	2026-09-30 08:45:36.168+00	2026-09-30	word_added	0	{"ref": "9cd42c0d-67ec-4d21-aba3-ca2e2b75c15f", "word": "apple1790757900628", "wordSetId": "e2e-set-1790757900628-f21e2ed9"}
f81e270e-5b5e-4ec3-a241-b009a9f5ed5d	963956b9-732e-4136-9e0c-a4400ac7aa00	2026-09-30 08:45:50.653+00	2026-09-30	review_done	0	{"ref": "f266b8128cc3ed6189720f09:2026-09-30T08:45:50.604Z", "grade": "know_it", "cardId": "f266b8128cc3ed6189720f09", "rating": 3, "wordId": "9cd42c0d-67ec-4d21-aba3-ca2e2b75c15f"}
3bcc7725-6374-4aec-b9a0-1760f2d39b43	8e6e8647-59de-4684-a673-c777de938c6d	2026-09-30 09:00:05.736+00	2026-09-30	quiz_done	4	{"ref": "present-perfect-vs-past-simple:4a5ae712-c404-402e-8ac0-bffd66a2400d", "score": 0, "total": 10, "passed": false, "quizSlug": "present-perfect-vs-past-simple", "isFullRun": true}
25d16c26-cbff-4270-b86e-b405fa8af7a3	b665efc4-613d-44ae-8b58-3a10d97904f4	2026-09-30 09:04:47.305+00	2026-09-30	quiz_done	7	{"ref": "present-perfect-vs-past-simple:82087679-b67c-4989-ad22-36bc2ee8d33d", "score": 0, "total": 10, "passed": false, "quizSlug": "present-perfect-vs-past-simple", "isFullRun": true}
e5991638-0d4b-4fc1-8862-5bdb0e5c72e9	b665efc4-613d-44ae-8b58-3a10d97904f4	2026-09-30 09:05:02.253+00	2026-09-30	word_added	0	{"ref": "7c669ce5-2f95-40a2-969b-ad237cbcd0d5", "word": "apple1790759058629", "wordSetId": "e2e-set-1790759058629-8afbb807"}
160b06dd-98ac-49df-b9a4-0ba4822e2959	b665efc4-613d-44ae-8b58-3a10d97904f4	2026-09-30 09:05:13.643+00	2026-09-30	review_done	0	{"ref": "550df459c58925542303f378:2026-09-30T09:05:13.595Z", "grade": "know_it", "cardId": "550df459c58925542303f378", "rating": 3, "wordId": "7c669ce5-2f95-40a2-969b-ad237cbcd0d5"}
f7a08b5d-febd-4aa2-9fca-16673fba641a	033c9876-883f-483c-9994-7c80c2e2dcf0	2026-09-30 09:57:03.589+00	2026-09-30	quiz_done	3	{"ref": "present-perfect-vs-past-simple:c035c411-0551-4ca2-8835-5528bd0413f0", "score": 0, "total": 10, "passed": false, "quizSlug": "present-perfect-vs-past-simple", "isFullRun": true}
382229c5-61f3-4921-a729-c35a4d14910b	033c9876-883f-483c-9994-7c80c2e2dcf0	2026-09-30 09:57:09.729+00	2026-09-30	word_added	0	{"ref": "363075a5-d59b-48a4-991b-9479cdca5c99", "word": "apple1790762215621", "wordSetId": "e2e-set-1790762215621-f3f05fe1"}
8b28ac5e-8b85-41f5-9921-7acdfefc9955	033c9876-883f-483c-9994-7c80c2e2dcf0	2026-09-30 09:57:16.69+00	2026-09-30	review_done	0	{"ref": "2797e15642f98f03197b2910:2026-09-30T09:57:16.656Z", "grade": "know_it", "cardId": "2797e15642f98f03197b2910", "rating": 3, "wordId": "363075a5-d59b-48a4-991b-9479cdca5c99"}
\.


--
-- Data for Name: admin_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_audit_log (id, actor_user_id, action, entity_type, entity_id, summary, payload, created_at) FROM stdin;
\.


--
-- Data for Name: grammar_families; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.grammar_families (id, title, sort_order, created_at, updated_at) FROM stdin;
sentence-foundations	1. Sentence foundations	0	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.264+00
tenses-time	2. Tenses & time	1	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.266+00
questions-negatives	3. Questions & negatives	2	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.267+00
modal-verbs	4. Modal verbs	3	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.268+00
nouns-determiners	5. Nouns & determiners	4	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.269+00
adjectives-adverbs	6. Adjectives & adverbs	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.27+00
clauses-linking	7. Clauses & linking	6	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.272+00
\.


--
-- Data for Name: grammar_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.grammar_groups (id, family_id, title, sort_order, created_at, updated_at) FROM stdin;
basic-clause-patterns	sentence-foundations	1.1 Basic clause patterns	0	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.273+00
basic-word-order	sentence-foundations	1.2 Basic word order	1	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.276+00
be-have-do	sentence-foundations	1.3 The verbs be, have and do	2	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.277+00
imperatives	sentence-foundations	1.4 Imperatives	3	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.285+00
present-tenses	tenses-time	2.1 Present tenses	0	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.286+00
past-tenses	tenses-time	2.2 Past tenses	1	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.287+00
perfect-tenses	tenses-time	2.3 Perfect tenses	2	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.289+00
future-forms	tenses-time	2.4 Future forms	3	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.29+00
yes-no-questions	questions-negatives	3.1 Yes/no questions	0	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.291+00
ability-permission	modal-verbs	4.1 Ability & permission	0	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.292+00
articles	nouns-determiners	5.1 Articles	0	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.293+00
adjective-order	adjectives-adverbs	6.1 Adjective order	0	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.294+00
coordinating	clauses-linking	7.1 Coordinating conjunctions	0	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.295+00
\.


--
-- Data for Name: grammar_lessons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.grammar_lessons (id, slug, title, level, family_id, group_id, sort_order, read_minutes, intro_en, intro_vi, use_when_en, use_when_vi, structure, examples, mistakes, practice_quiz_slug, practice_question_count, practice_minutes, created_at, updated_at, status) FROM stdin;
use-subject-verb-clauses	use-subject-verb-clauses	Use subject + verb clauses	A1	sentence-foundations	basic-clause-patterns	0	4	A subject + verb clause is the simplest complete sentence in English. It tells us who or what (the subject) and what they do (the verb). Some verbs need nothing after them: She smiled. The bus arrived.	Câu đơn giản nhất = Ai / Cái gì + làm gì. Tiếng Anh luôn cần đủ cả hai phần.	you make simple statements about actions and events.	Dùng khi kể về hành động, sự việc đơn giản.	[{"formula": "Subject + Verb", "explanation": "The subject is usually a noun or pronoun. The verb tells us the action or state."}, {"formula": "He / She / It + Verb-s / -es", "explanation": "In the present simple, add -s or -es after he, she, it and singular nouns. — Ngôi thứ ba số ít thêm -s/-es."}, {"formula": "Subject + Verb + (place / time)", "explanation": "You can add where or when — but the sentence is already complete without it."}]	[{"sentence": "I run every morning.", "explanation": "Subject “I” + verb “run” — a daily habit. · Tôi chạy bộ mỗi sáng."}, {"sentence": "The baby cried.", "explanation": "Subject “The baby” + verb “cried” — a finished action; nothing else is needed. · Em bé đã khóc."}, {"sentence": "She works at a bakery.", "explanation": "He / she / it → “works” with -s. · Cô ấy làm việc ở tiệm bánh."}, {"sentence": "Prices went up last year.", "explanation": "Subject “Prices” + verb “went up”; “last year” only adds time. · Giá cả đã tăng vào năm ngoái."}, {"sentence": "We live near the river.", "explanation": "Subject “We” + verb “live”; “near the river” adds place. · Chúng tôi sống gần sông."}]	[{"after": " to school by bus.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}, {"after": " a lot in Huế in October.", "wrong": "Rains", "before": "", "noteEn": "English always needs a subject — even for weather!", "noteVi": "Không bỏ chủ ngữ: dùng “It”.", "correct": "It rains"}, {"after": " very happy today.", "wrong": "", "before": "The children ", "noteEn": "Adjectives aren't verbs — add be.", "noteVi": "Tính từ cần “to be” đi kèm.", "correct": "are", "missing": true}]	use-subject-verb-clauses	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.296+00	published
use-subject-verb-object-clauses	use-subject-verb-object-clauses	Use subject + verb + object clauses	A1	sentence-foundations	basic-clause-patterns	1	4	Many verbs need an object — someone or something that receives the action. Pattern: Subject + Verb + Object.	Nhiều động từ cần tân ngữ — ai/cái gì nhận hành động.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb + Object", "explanation": "The object answers “who?” or “what?” after the verb."}, {"formula": "Subject + Verb + someone / something", "explanation": "Objects are usually nouns, pronouns, or noun phrases."}]	[{"sentence": "I read a book.", "explanation": "“a book” is the object. · Tôi đọc một cuốn sách."}, {"sentence": "She called her friend.", "explanation": "“her friend” receives the action. · Cô ấy gọi bạn."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	use-subject-verb-object-clauses	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.307+00	published
use-linking-verbs-with-complements	use-linking-verbs-with-complements	Use linking verbs with complements	A2	sentence-foundations	basic-clause-patterns	2	4	Linking verbs connect the subject to a description: be, seem, feel, look, become.	Động từ nối liên kết chủ ngữ với phần mô tả.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Linking verb + Complement", "explanation": "The complement describes or renames the subject."}]	[{"sentence": "The soup tastes great.", "explanation": "“tastes” links subject to the adjective. · Súp rất ngon."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	use-linking-verbs-with-complements	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.31+00	published
use-verbs-with-two-objects	use-verbs-with-two-objects	Use verbs with two objects	B1	sentence-foundations	basic-clause-patterns	3	4	Use verbs with two objects helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	use-verbs-with-two-objects	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.313+00	published
use-object-complements	use-object-complements	Use object complements	B2	sentence-foundations	basic-clause-patterns	4	4	Use object complements helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	use-object-complements	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.316+00	published
put-subjects-before-verbs	put-subjects-before-verbs	Put subjects before verbs in statements	A1	sentence-foundations	basic-word-order	0	4	Put subjects before verbs in statements helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	put-subjects-before-verbs	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.324+00	published
put-objects-after-transitive-verbs	put-objects-after-transitive-verbs	Put objects after transitive verbs	A2	sentence-foundations	basic-word-order	1	4	Put objects after transitive verbs helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	put-objects-after-transitive-verbs	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.326+00	published
place-expressions-of-place-and-time	place-expressions-of-place-and-time	Place expressions of place and time	B1	sentence-foundations	basic-word-order	2	4	Place expressions of place and time helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	place-expressions-of-place-and-time	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.329+00	published
order-manner-place-and-time	order-manner-place-and-time	Order manner, place and time adverbials	B2	sentence-foundations	basic-word-order	3	4	Order manner, place and time adverbials helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	order-manner-place-and-time	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.333+00	published
use-be-in-simple-sentences	use-be-in-simple-sentences	Use be in simple sentences	A1	sentence-foundations	be-have-do	0	4	Use be in simple sentences helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	use-be-in-simple-sentences	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.335+00	published
use-have-for-possession	use-have-for-possession	Use have for possession	A1	sentence-foundations	be-have-do	1	4	Use have for possession helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	use-have-for-possession	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.337+00	published
use-do-for-emphasis	use-do-for-emphasis	Use do for emphasis	A2	sentence-foundations	be-have-do	2	4	Use do for emphasis helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	use-do-for-emphasis	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.346+00	published
choose-be-have-or-do	choose-be-have-or-do	Choose be, have or do	A2	sentence-foundations	be-have-do	3	4	Choose be, have or do helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	choose-be-have-or-do	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.348+00	published
give-simple-instructions	give-simple-instructions	Give simple instructions	A1	sentence-foundations	imperatives	0	4	Give simple instructions helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	give-simple-instructions	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.351+00	published
make-polite-requests	make-polite-requests	Make polite requests	A2	sentence-foundations	imperatives	1	4	Make polite requests helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	make-polite-requests	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.353+00	published
use-negative-imperatives	use-negative-imperatives	Use negative imperatives	A2	sentence-foundations	imperatives	2	4	Use negative imperatives helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	use-negative-imperatives	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.355+00	published
soften-commands-with-please	soften-commands-with-please	Soften commands with please	B1	sentence-foundations	imperatives	3	4	Soften commands with please helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	soften-commands-with-please	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.364+00	published
imperatives-for-directions	imperatives-for-directions	Use imperatives for directions	B1	sentence-foundations	imperatives	4	4	Use imperatives for directions helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	imperatives-for-directions	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.367+00	published
present-simple-habits	present-simple-habits	Talk about habits with present simple	A1	tenses-time	present-tenses	0	4	Talk about habits with present simple helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	present-simple-habits	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.37+00	published
present-continuous-now	present-continuous-now	Describe actions happening now	A1	tenses-time	present-tenses	1	4	Describe actions happening now helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	present-continuous-now	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.372+00	published
past-simple-finished	past-simple-finished	Talk about finished past events	A2	tenses-time	past-tenses	0	4	Talk about finished past events helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	past-simple-finished	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.375+00	published
present-perfect-vs-past-simple	present-perfect-vs-past-simple	Present perfect vs. past simple	B1	tenses-time	perfect-tenses	0	4	Use present perfect for experience or results that connect to now; past simple for finished time.	Present perfect nối với hiện tại; past simple cho thời điểm đã kết thúc.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "have / has + past participle", "explanation": "Present perfect focuses on the result or experience."}, {"formula": "Verb-ed / irregular past", "explanation": "Past simple needs a finished time (yesterday, in 2019…)."}]	[{"sentence": "I have visited Đà Nẵng.", "explanation": "Experience — time not specified. · Tôi đã từng đến Đà Nẵng."}, {"sentence": "I visited Đà Nẵng last year.", "explanation": "Finished time with “last year”. · Tôi đến Đà Nẵng năm ngoái."}]	[{"after": " her yesterday.", "wrong": "have seen", "before": "I ", "noteEn": "Yesterday → past simple!", "noteVi": "Có mốc thời gian cụ thể → dùng past simple.", "correct": "saw"}]	present-perfect-vs-past-simple	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.377+00	published
future-plans-going-to	future-plans-going-to	Talk about plans with going to	A2	tenses-time	future-forms	0	4	Talk about plans with going to helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	future-plans-going-to	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.386+00	published
form-yes-no-questions	form-yes-no-questions	Form yes/no questions	A1	questions-negatives	yes-no-questions	0	4	Form yes/no questions helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	form-yes-no-questions	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.388+00	published
answer-yes-no-short	answer-yes-no-short	Give short yes/no answers	A1	questions-negatives	yes-no-questions	1	4	Give short yes/no answers helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	answer-yes-no-short	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.39+00	published
can-for-ability	can-for-ability	Use can for ability	A1	modal-verbs	ability-permission	0	4	Use can for ability helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	can-for-ability	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.393+00	published
could-for-past-ability	could-for-past-ability	Use could for past ability	A2	modal-verbs	ability-permission	1	4	Use could for past ability helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	could-for-past-ability	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.395+00	published
a-an-with-singular	a-an-with-singular	Use a/an with singular nouns	A1	nouns-determiners	articles	0	4	Use a/an with singular nouns helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	a-an-with-singular	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.405+00	published
order-opinion-fact-adjectives	order-opinion-fact-adjectives	Order opinion and fact adjectives	B1	adjectives-adverbs	adjective-order	0	4	Order opinion and fact adjectives helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	order-opinion-fact-adjectives	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.408+00	published
link-ideas-with-and-but	link-ideas-with-and-but	Link ideas with and / but	A2	clauses-linking	coordinating	0	4	Link ideas with and / but helps you build clearer English sentences step by step.	Bài này giúp bạn viết câu tiếng Anh rõ ràng hơn từng bước.	you practise this pattern in everyday speaking and writing.	Dùng khi luyện mẫu câu trong giao tiếp hàng ngày.	[{"formula": "Subject + Verb (+ …)", "explanation": "Start with who or what, then the action. Add detail only when needed."}]	[{"sentence": "I practise every day.", "explanation": "A simple complete sentence. · Tôi luyện tập mỗi ngày."}, {"sentence": "They arrived early.", "explanation": "Subject + verb is enough. · Họ đã đến sớm."}]	[{"after": " home late.", "wrong": "go", "before": "She ", "noteEn": "He / she / it needs -s!", "noteVi": "Ngôi thứ 3 số ít: thêm -s / -es.", "correct": "goes"}]	link-ideas-with-and-but	10	5	2026-09-30 03:25:31.125521+00	2026-09-30 08:50:29.411+00	published
\.


--
-- Data for Name: listening_dictation_blanks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listening_dictation_blanks (id, lesson_id, sort_order, prompt_before, prompt_after, answer, accept) FROM stdin;
ordering-a-coffee:b1	ordering-a-coffee	0	This is a 	 placeholder.	listening	\N
asking-for-directions-in-ha-noi:b1	asking-for-directions-in-ha-noi	0	This is a 	 placeholder.	listening	\N
checking-in-at-the-airport:b1	checking-in-at-the-airport	0	Can I see your 	 and booking reference, please?	passport	\N
checking-in-at-the-airport:b2	checking-in-at-the-airport	1	Thank you. Are you checking in any 	?	bags	\N
checking-in-at-the-airport:b3	checking-in-at-the-airport	2	Just one suitcase. Is there a weight 	?	limit	\N
checking-in-at-the-airport:b4	checking-in-at-the-airport	3	Would you prefer a window or an 	 seat?	aisle	\N
checking-in-at-the-airport:b5	checking-in-at-the-airport	4	Boarding starts at 	 twelve at nine forty.	gate	\N
a-voicemail-from-your-landlord:b1	a-voicemail-from-your-landlord	0	This is a 	 placeholder.	listening	\N
team-meeting-project-update:b1	team-meeting-project-update	0	This is a 	 placeholder.	listening	\N
podcast-the-joy-of-slow-travel:b1	podcast-the-joy-of-slow-travel	0	This is a 	 placeholder.	listening	\N
rice-prices-and-the-weather:b1	rice-prices-and-the-weather	0	This is a 	 placeholder.	listening	\N
\.


--
-- Data for Name: listening_lessons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listening_lessons (id, slug, title, topic, level, duration_seconds, audio_path, speakers, accent, family_label, sort_order, created_at, updated_at, status) FROM stdin;
ordering-a-coffee	ordering-a-coffee	Ordering a coffee	Daily life	A1	84	listening/checking-in-at-the-airport.wav	2	Neutral accent	Daily life · Lesson	0	2026-09-30 03:25:31.367358+00	2026-09-30 08:50:29.537+00	published
asking-for-directions-in-ha-noi	asking-for-directions-in-ha-noi	Asking for directions in Hà Nội	Travel	A2	125	listening/checking-in-at-the-airport.wav	2	Neutral accent	Travel · Lesson	1	2026-09-30 03:25:31.367358+00	2026-09-30 08:50:29.553+00	published
checking-in-at-the-airport	checking-in-at-the-airport	Checking in at the airport	Travel	A2	160	listening/checking-in-at-the-airport.wav	2	British accent	Travel · Lesson 3 of 12	2	2026-09-30 03:25:31.367358+00	2026-09-30 08:50:29.557+00	published
a-voicemail-from-your-landlord	a-voicemail-from-your-landlord	A voicemail from your landlord	Daily life	B1	118	listening/checking-in-at-the-airport.wav	2	Neutral accent	Daily life · Lesson	3	2026-09-30 03:25:31.367358+00	2026-09-30 08:50:29.589+00	published
team-meeting-project-update	team-meeting-project-update	Team meeting: project update	Work	B1	192	listening/checking-in-at-the-airport.wav	2	Neutral accent	Work · Lesson	4	2026-09-30 03:25:31.367358+00	2026-09-30 08:50:29.593+00	published
podcast-the-joy-of-slow-travel	podcast-the-joy-of-slow-travel	Podcast: the joy of slow travel	Culture	B2	270	listening/checking-in-at-the-airport.wav	2	Neutral accent	Culture · Lesson	5	2026-09-30 03:25:31.367358+00	2026-09-30 08:50:29.597+00	published
rice-prices-and-the-weather	rice-prices-and-the-weather	Rice prices and the weather	News	C1	225	listening/checking-in-at-the-airport.wav	2	Neutral accent	News · Lesson	6	2026-09-30 03:25:31.367358+00	2026-09-30 08:50:29.608+00	published
\.


--
-- Data for Name: listening_transcript_sentences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listening_transcript_sentences (id, lesson_id, sort_order, speaker, text, start_ms, end_ms) FROM stdin;
a-voicemail-from-your-landlord:s1	a-voicemail-from-your-landlord	0	Speaker	A voicemail from your landlord — open the featured airport lesson for the full exercise.	0	5000
team-meeting-project-update:s1	team-meeting-project-update	0	Speaker	Team meeting: project update — open the featured airport lesson for the full exercise.	0	5000
podcast-the-joy-of-slow-travel:s1	podcast-the-joy-of-slow-travel	0	Speaker	Podcast: the joy of slow travel — open the featured airport lesson for the full exercise.	0	5000
rice-prices-and-the-weather:s1	rice-prices-and-the-weather	0	Speaker	Rice prices and the weather — open the featured airport lesson for the full exercise.	0	5000
ordering-a-coffee:s1	ordering-a-coffee	0	Speaker	Ordering a coffee — open the featured airport lesson for the full exercise.	0	5000
asking-for-directions-in-ha-noi:s1	asking-for-directions-in-ha-noi	0	Speaker	Asking for directions in Hà Nội — open the featured airport lesson for the full exercise.	0	5000
checking-in-at-the-airport:s1	checking-in-at-the-airport	0	Agent	Good morning. Where are you flying to today?	0	4000
checking-in-at-the-airport:s2	checking-in-at-the-airport	1	Lan	Hi, I’m flying to Singapore.	4000	7000
checking-in-at-the-airport:s3	checking-in-at-the-airport	2	Agent	Can I see your passport and booking reference, please?	7000	12000
checking-in-at-the-airport:s4	checking-in-at-the-airport	3	Lan	Sure, here you are.	12000	15000
checking-in-at-the-airport:s5	checking-in-at-the-airport	4	Agent	Thank you. Are you checking in any bags?	15000	19000
checking-in-at-the-airport:s6	checking-in-at-the-airport	5	Lan	Just one suitcase. Is there a weight limit?	19000	23000
checking-in-at-the-airport:s7	checking-in-at-the-airport	6	Agent	Yes, it’s twenty-three kilos. Could you put it on the scale?	23000	29000
checking-in-at-the-airport:s8	checking-in-at-the-airport	7	Agent	Would you prefer a window or an aisle seat?	29000	33000
checking-in-at-the-airport:s9	checking-in-at-the-airport	8	Lan	A window seat, please.	33000	36000
checking-in-at-the-airport:s10	checking-in-at-the-airport	9	Agent	Here’s your boarding pass. Boarding starts at gate twelve at nine forty.	36000	42000
\.


--
-- Data for Name: quiz_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_attempts (id, user_id, quiz_id, score, total, passed, time_used_seconds, accuracy, answers, raw_answers, is_full_run, completed_at, created_at, client_attempt_id) FROM stdin;
bc869c38e99413940b903d6b	user-linh	present-perfect-vs-past-simple	6	10	f	420	60	{}	{}	t	2026-09-28 03:25:42.264+00	2026-09-30 03:25:31.52325+00	\N
8c90b4fa-72ec-4e7c-b8a3-c6191f4a152e	963956b9-732e-4136-9e0c-a4400ac7aa00	present-perfect-vs-past-simple	0	10	f	5	0	{"q1": "—", "q2": "—", "q3": "—", "q4": "—", "q5": "—", "q6": "—", "q7": "—", "q8": "—", "q9": "—", "q10": "—"}	{"q1": null, "q2": null, "q3": null, "q4": null, "q5": null, "q6": null, "q7": null, "q8": null, "q9": null, "q10": null}	t	2026-09-30 08:45:21.272+00	2026-09-30 08:45:21.291603+00	54587837-dbb1-46e5-ac00-48659fb42aa9
4a5ae712-c404-402e-8ac0-bffd66a2400d	8e6e8647-59de-4684-a673-c777de938c6d	present-perfect-vs-past-simple	0	10	f	4	0	{"q1": "—", "q2": "—", "q3": "—", "q4": "—", "q5": "—", "q6": "—", "q7": "—", "q8": "—", "q9": "—", "q10": "—"}	{"q1": null, "q2": null, "q3": null, "q4": null, "q5": null, "q6": null, "q7": null, "q8": null, "q9": null, "q10": null}	t	2026-09-30 09:00:05.714+00	2026-09-30 09:00:05.723511+00	39fb5bcb-5cb8-42cc-b858-e832316cd3f6
82087679-b67c-4989-ad22-36bc2ee8d33d	b665efc4-613d-44ae-8b58-3a10d97904f4	present-perfect-vs-past-simple	0	10	f	7	0	{"q1": "—", "q2": "—", "q3": "—", "q4": "—", "q5": "—", "q6": "—", "q7": "—", "q8": "—", "q9": "—", "q10": "—"}	{"q1": null, "q2": null, "q3": null, "q4": null, "q5": null, "q6": null, "q7": null, "q8": null, "q9": null, "q10": null}	t	2026-09-30 09:04:47.244+00	2026-09-30 09:04:47.265888+00	7f5773ab-70f6-4a1e-bbea-ba4ed672804a
c035c411-0551-4ca2-8835-5528bd0413f0	033c9876-883f-483c-9994-7c80c2e2dcf0	present-perfect-vs-past-simple	0	10	f	3	0	{"q1": "—", "q2": "—", "q3": "—", "q4": "—", "q5": "—", "q6": "—", "q7": "—", "q8": "—", "q9": "—", "q10": "—"}	{"q1": null, "q2": null, "q3": null, "q4": null, "q5": null, "q6": null, "q7": null, "q8": null, "q9": null, "q10": null}	t	2026-09-30 09:57:03.572+00	2026-09-30 09:57:03.576596+00	deaf298d-5779-40e5-81c9-8a95b3d28959
\.


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_questions (id, quiz_id, sort_order, type, instruction_vi, prompt_vi, hint_en, explanation_en, explanation_vi, review_before, review_after, payload) FROM stdin;
present-perfect-vs-past-simple:q1	present-perfect-vs-past-simple	0	multiple_choice	Chọn đáp án đúng	Tôi đã đến Đà Nẵng ba lần.	“three times” = experience up to now → present perfect.	Experiences with no finished time → present perfect.	Kinh nghiệm đến hiện tại → hiện tại hoàn thành.	I 	 to Đà Nẵng three times.	{"options": ["was", "have been", "went", "am"], "stemAfter": "to Đà Nẵng three times.", "stemBefore": "I", "correctIndex": 1}
present-perfect-vs-past-simple:q2	present-perfect-vs-past-simple	1	fill_blank	Điền dạng đúng của động từ	Chúng tôi chuyển đến đây năm 2020.	“in 2020” is a finished time → past simple.	“in 2020” is finished time → past simple.	Có mốc thời gian đã qua → quá khứ đơn.	We 	 here in 2020.	{"verbHint": "move", "wordBank": ["moved", "have moved", "were moving", "move"], "stemAfter": "here in 2020.", "stemBefore": "We", "displayAnswer": "moved", "correctAnswers": ["moved"]}
present-perfect-vs-past-simple:q3	present-perfect-vs-past-simple	2	correct_sentence	Chọn câu đúng ngữ pháp	Câu nào đúng?	“ever” + experience → present perfect.	“ever” asks about life experience → present perfect.	“ever” hỏi kinh nghiệm → hiện tại hoàn thành.			{"options": ["Did you ever eat durian?", "Have you ever eaten durian?", "Have you ever ate durian?", "Do you ever eaten durian?"], "promptEn": "Which sentence is correct?", "correctIndex": 1}
present-perfect-vs-past-simple:q4	present-perfect-vs-past-simple	3	multiple_choice	Chọn đáp án đúng	Tôi làm mất chìa khóa rồi — giờ không vào nhà được.	The result matters now (can't enter) → present perfect.	Present result of a past action → present perfect.	Kết quả vẫn ảnh hưởng hiện tại → hiện tại hoàn thành.	I 	 my keys. I can't get into my flat.	{"options": ["lost", "have lost", "was losing", "had lose"], "stemAfter": "my keys. I can't get into my flat.", "stemBefore": "I", "correctIndex": 1}
present-perfect-vs-past-simple:q6	present-perfect-vs-past-simple	5	correct_sentence	Chọn câu đúng ngữ pháp	Câu nào đúng?	“last week” is finished time → past simple.	Finished time words (last week) → past simple.	Có mốc thời gian đã kết thúc → quá khứ đơn.			{"options": ["I have seen that film last week.", "I saw that film last week.", "I have saw that film last week.", "I seen that film last week."], "promptEn": "Which sentence is correct?", "correctIndex": 1}
present-perfect-vs-past-simple:q5	present-perfect-vs-past-simple	4	fill_blank	Điền dạng đúng của động từ	Cô ấy đã sống ở Huế từ năm 2019 (đến giờ vẫn sống).	“since 2019” — it started in the past and is still true now.	“since” + starting point still true → present perfect.	“since” + vẫn còn đúng → hiện tại hoàn thành.	She 	 in Huế since 2019.	{"verbHint": "live", "wordBank": ["lived", "has lived", "was living", "is living"], "stemAfter": "in Huế since 2019.", "stemBefore": "She", "displayAnswer": "has lived", "correctAnswers": ["has lived", "have lived"]}
present-perfect-vs-past-simple:q7	present-perfect-vs-past-simple	6	multiple_choice	Chọn đáp án đúng	Bạn đến Hà Nội khi nào?	“When…?” asks about a finished time → did.	“When…?” asks about a finished time → did.	Hỏi “khi nào” → dùng quá khứ đơn.	When 	 you arrive in Hà Nội?	{"options": ["have", "did", "do", "are"], "stemAfter": "you arrive in Hà Nội?", "stemBefore": "When", "correctIndex": 1}
present-perfect-vs-past-simple:q8	present-perfect-vs-past-simple	7	fill_blank	Điền dạng đúng của động từ	Tôi chưa làm xong bài tập.	“yet” often goes with present perfect negative.	“yet” + unfinished → present perfect negative.	“yet” + chưa xong → hiện tại hoàn thành phủ định.	I 	 my homework yet.	{"verbHint": "finish", "wordBank": ["didn't finish", "haven't finished", "not finished", "wasn't finish"], "stemAfter": "my homework yet.", "stemBefore": "I", "displayAnswer": "haven't finished", "correctAnswers": ["haven't finished", "have not finished"]}
present-perfect-vs-past-simple:q9	present-perfect-vs-past-simple	8	multiple_choice	Chọn đáp án đúng	Cô ấy vừa mới rời văn phòng.	“just” sits between have/has and the past participle.	have/has + just + past participle.	have/has + just + quá khứ phân từ.	She has 	 left the office.	{"options": ["yet", "just", "already ago", "since"], "stemAfter": "left the office.", "stemBefore": "She has", "correctIndex": 1}
use-subject-verb-clauses:sv1	use-subject-verb-clauses	0	multiple_choice	Chọn đáp án đúng	Cô ấy đi làm bằng xe buýt.	He / she / it needs -s in the present simple.	He / she / it → verb + -s.	Ngôi thứ 3 số ít thêm -s.	She 	 to work by bus.	{"options": ["go", "goes", "going", "gone"], "stemAfter": "to work by bus.", "stemBefore": "She", "correctIndex": 1}
present-perfect-vs-past-simple:q10	present-perfect-vs-past-simple	9	correct_sentence	Chọn câu đúng ngữ pháp	Câu nào đúng?	“since May” → action started then and continues.	“since” + starting point → present perfect.	“since” + mốc bắt đầu → hiện tại hoàn thành.			{"options": ["She works here since May.", "She has worked here since May.", "She worked here since May.", "She is working here since May."], "promptEn": "Which sentence is correct?", "correctIndex": 1}
use-subject-verb-clauses:sv2	use-subject-verb-clauses	1	fill_blank	Điền dạng đúng của động từ	Trời mưa nhiều ở Huế vào tháng 10.	Weather sentences need a subject — usually “It”.	English always needs a subject — even for weather.	Không bỏ chủ ngữ: dùng “It”.		 a lot in Huế in October.	{"verbHint": "rain", "wordBank": ["Rains", "It rains", "Is raining", "Rain"], "stemAfter": "a lot in Huế in October.", "stemBefore": "", "displayAnswer": "It rains", "correctAnswers": ["it rains", "It rains"]}
use-subject-verb-clauses:sv3	use-subject-verb-clauses	2	correct_sentence	Chọn câu đúng ngữ pháp	Câu nào đúng?	Adjectives need a form of be.	Adjectives aren't verbs — add be.	Tính từ cần “to be” đi kèm.			{"options": ["The children very happy today.", "The children are very happy today.", "The children is very happy today.", "The children be very happy today."], "promptEn": "Which sentence is correct?", "correctIndex": 1}
use-subject-verb-clauses:sv4	use-subject-verb-clauses	3	multiple_choice	Chọn đáp án đúng	Tôi chạy bộ mỗi sáng.	I / you / we / they → base verb.	I + base verb for habits.	I + động từ nguyên mẫu cho thói quen.	I 	 every morning.	{"options": ["runs", "run", "running", "ran"], "stemAfter": "every morning.", "stemBefore": "I", "correctIndex": 1}
use-subject-verb-clauses:sv5	use-subject-verb-clauses	4	fill_blank	Điền dạng đúng của động từ	Em bé đã khóc.	A finished past action — past simple.	Finished past action → past simple.	Hành động đã kết thúc → quá khứ đơn.	The baby 	.	{"verbHint": "cry", "wordBank": ["cry", "cries", "cried", "crying"], "stemAfter": ".", "stemBefore": "The baby", "displayAnswer": "cried", "correctAnswers": ["cried"]}
use-subject-verb-clauses:sv6	use-subject-verb-clauses	5	correct_sentence	Chọn câu đúng ngữ pháp	Câu nào đúng?	She needs -s on the verb.	He / she / it → works.	Ngôi thứ 3 số ít → works.			{"options": ["She work at a bakery.", "She works at a bakery.", "She working at a bakery.", "She is works at a bakery."], "promptEn": "Which sentence is correct?", "correctIndex": 1}
use-subject-verb-clauses:sv7	use-subject-verb-clauses	6	multiple_choice	Chọn đáp án đúng	Giá cả đã tăng vào năm ngoái.	Plural subject + past verb.	Plural subject “Prices” + past verb.	Chủ ngữ số nhiều + động từ quá khứ.	Prices 	 up last year.	{"options": ["goes", "went", "going", "go"], "stemAfter": "up last year.", "stemBefore": "Prices", "correctIndex": 1}
use-subject-verb-clauses:sv8	use-subject-verb-clauses	7	fill_blank	Điền dạng đúng của động từ	Chúng tôi sống gần sông.	We + base verb.	We + base verb in the present.	We + động từ nguyên mẫu.	We 	 near the river.	{"verbHint": "live", "wordBank": ["lives", "live", "living", "lived"], "stemAfter": "near the river.", "stemBefore": "We", "displayAnswer": "live", "correctAnswers": ["live"]}
use-subject-verb-clauses:sv9	use-subject-verb-clauses	8	multiple_choice	Chọn đáp án đúng	Họ đã đến sớm.	Finished past event.	Finished past event → past simple.	Sự việc đã qua → quá khứ đơn.	They 	 early.	{"options": ["arrive", "arrives", "arrived", "arriving"], "stemAfter": "early.", "stemBefore": "They", "correctIndex": 2}
use-subject-verb-clauses:sv10	use-subject-verb-clauses	9	correct_sentence	Chọn câu đúng ngữ pháp	Câu nào đúng?	Subject + verb is enough for a complete sentence.	A complete sentence needs subject + verb.	Câu hoàn chỉnh cần chủ ngữ + động từ.			{"options": ["Practise every day.", "I practise every day.", "Practising every day.", "Every day practise."], "promptEn": "Which sentence is correct?", "correctIndex": 1}
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quizzes (id, slug, title, kick_en, kick_vi, breadcrumb, level, description_en, description_vi, time_limit_seconds, pass_score, question_types, lesson_href, next_href, next_label, encouragement_en, encouragement_vi, created_at, updated_at, status) FROM stdin;
present-perfect-vs-past-simple	present-perfect-vs-past-simple	Present perfect vs. past simple	Grammar quiz	Kiểm tra ngữ pháp	Grammar › Tenses & time › Present perfect	B1	Test yourself on when to say have done and when to say did.	Khi nào dùng hiện tại hoàn thành, khi nào dùng quá khứ đơn?	480	7	[{"id": "multiple_choice", "label": "Multiple choice"}, {"id": "fill_blank", "label": "Fill in the blank"}, {"id": "correct_sentence", "label": "Choose the correct sentence"}]	/grammar/present-perfect-vs-past-simple	/grammar/future-plans-going-to	Next: Future plans	You've got this, Linh!	Đọc kỹ đề nhé.	2026-09-30 03:25:31.039316+00	2026-09-30 08:50:29.171+00	published
use-subject-verb-clauses	use-subject-verb-clauses	Use subject + verb clauses	Grammar quiz	Kiểm tra ngữ pháp	Grammar › Sentence foundations › Basic clauses	A1	Check that every sentence has a clear subject and a matching verb.	Mỗi câu cần đủ chủ ngữ và động từ phù hợp.	300	7	[{"id": "multiple_choice", "label": "Multiple choice"}, {"id": "fill_blank", "label": "Fill in the blank"}, {"id": "correct_sentence", "label": "Choose the correct sentence"}]	/grammar/use-subject-verb-clauses	/grammar/use-subject-verb-object-clauses	Next: SVO clauses	You've got this, Linh!	Đọc kỹ đề nhé.	2026-09-30 03:25:31.039316+00	2026-09-30 08:50:29.224+00	published
\.


--
-- Data for Name: reading_paragraphs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reading_paragraphs (id, passage_id, sort_order, vi, segments) FROM stdin;
working-from-a-cafe:p1	working-from-a-cafe	0	Bản dịch tiếng Việt sẽ hiện khi bạn bật nút dịch.	[{"text": "Working From a Café — open this card to practise everyday English reading. Full story content is available for The Night Bus to Đà Lạt.", "type": "text"}]
the-rice-terraces-of-sa-pa:p1	the-rice-terraces-of-sa-pa	0	Bản dịch tiếng Việt sẽ hiện khi bạn bật nút dịch.	[{"text": "The Rice Terraces of Sa Pa — open this card to practise everyday English reading. Full story content is available for The Night Bus to Đà Lạt.", "type": "text"}]
a-morning-at-ben-thanh-market:p1	a-morning-at-ben-thanh-market	0	Bản dịch tiếng Việt sẽ hiện khi bạn bật nút dịch.	[{"text": "A Morning at Bến Thành Market — open this card to practise everyday English reading. Full story content is available for The Night Bus to Đà Lạt.", "type": "text"}]
why-cats-sleep-so-much:p1	why-cats-sleep-so-much	0	Bản dịch tiếng Việt sẽ hiện khi bạn bật nút dịch.	[{"text": "Why Cats Sleep So Much — open this card to practise everyday English reading. Full story content is available for The Night Bus to Đà Lạt.", "type": "text"}]
the-night-bus-to-da-lat:p1	the-night-bus-to-da-lat	0	Tháng Mười Hai năm ngoái, Minh quyết định đến Đà Lạt lần đầu. Vé máy bay dịp lễ rất đắt nên anh đặt một chỗ trên xe khách đêm từ Sài Gòn. Xe chạy lúc mười giờ, và hầu hết hành khách đã ngủ trước khi ra khỏi thành phố.	[{"text": "Last December, Minh decided to visit Đà Lạt for the first time. Flights were expensive during the holidays, so he booked a seat on the night bus from Saigon. The bus left at ten o’clock, and most passengers fell asleep before it reached the edge of the city.", "type": "text"}]
the-night-bus-to-da-lat:p2	the-night-bus-to-da-lat	1	Khoảng nửa đêm đường trở nên quanh co khi xe bắt đầu leo núi. Anh hơi buồn ngủ, nhưng những khúc cua gắt liên tục đánh thức anh.	[{"text": "Around midnight the road became ", "type": "text"}, {"type": "vocab", "vocabId": "the-night-bus-to-da-lat:winding"}, {"text": " as the bus began to climb into the mountains. He felt a little ", "type": "text"}, {"type": "vocab", "vocabId": "the-night-bus-to-da-lat:drowsy"}, {"text": ", but the sharp turns kept waking him up.", "type": "text"}]
the-night-bus-to-da-lat:p3	the-night-bus-to-da-lat	2	Khi mặt trời lên, cảnh vật bên ngoài đã hoàn toàn thay đổi. Thay cho ruộng lúa là những rừng thông phủ sương mỏng. Không khí lùa qua cửa sổ mát lạnh — gần như lạnh. Minh miễn cưỡng mặc chiếc áo khoác mà mẹ đã xếp cho anh.	[{"text": "When the sun came up, the ", "type": "text"}, {"type": "vocab", "vocabId": "the-night-bus-to-da-lat:scenery"}, {"text": " outside had completely changed. Instead of rice fields, there were pine forests covered in thin mist. The air coming through the window was cool — almost cold. Minh ", "type": "text"}, {"type": "vocab", "vocabId": "the-night-bus-to-da-lat:reluctantly"}, {"text": " put on the jacket his mother had packed for him.", "type": "text"}]
the-night-bus-to-da-lat:p4	the-night-bus-to-da-lat	3	Xe đến nơi lúc bảy giờ. Một người bán hàng rong gần bến xe đang bán sữa đậu nành nóng và bánh tráng nướng. Minh mua cả hai, ngồi trên chiếc ghế nhựa nhỏ và ngắm đồi núi. Chuyến đi thật dài, nhưng khung cảnh thì đẹp đến ngỡ ngàng.	[{"text": "The bus arrived at seven. A street ", "type": "text"}, {"type": "vocab", "vocabId": "the-night-bus-to-da-lat:vendor"}, {"text": " near the station was selling hot soy milk and grilled rice paper. Minh bought both, sat on a small plastic stool, and looked at the hills. The trip had been long, but the view was ", "type": "text"}, {"type": "vocab", "vocabId": "the-night-bus-to-da-lat:breathtaking"}, {"text": ".", "type": "text"}]
how-podcasts-changed-radio:p1	how-podcasts-changed-radio	0	Bản dịch tiếng Việt sẽ hiện khi bạn bật nút dịch.	[{"text": "How Podcasts Changed Radio — open this card to practise everyday English reading. Full story content is available for The Night Bus to Đà Lạt.", "type": "text"}]
the-economics-of-street-food:p1	the-economics-of-street-food	0	Bản dịch tiếng Việt sẽ hiện khi bạn bật nút dịch.	[{"text": "The Economics of Street Food — open this card to practise everyday English reading. Full story content is available for The Night Bus to Đà Lạt.", "type": "text"}]
\.


--
-- Data for Name: reading_passages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reading_passages (id, slug, title, topic, level, minutes, word_count, new_word_count, family_label, sort_order, created_at, updated_at, status) FROM stdin;
a-morning-at-ben-thanh-market	a-morning-at-ben-thanh-market	A Morning at Bến Thành Market	Travel	A2	3	180	4	Travel · Passage	0	2026-09-30 03:25:31.280331+00	2026-09-30 08:50:29.425+00	published
why-cats-sleep-so-much	why-cats-sleep-so-much	Why Cats Sleep So Much	Science	A2	3	180	4	Science · Passage	1	2026-09-30 03:25:31.280331+00	2026-09-30 08:50:29.431+00	published
the-night-bus-to-da-lat	the-night-bus-to-da-lat	The Night Bus to Đà Lạt	Travel	B1	4	212	6	Travel · Passage 3 of 7	2	2026-09-30 03:25:31.280331+00	2026-09-30 08:50:29.434+00	published
working-from-a-cafe	working-from-a-cafe	Working From a Café	Work	B1	4	180	4	Work · Passage	3	2026-09-30 03:25:31.280331+00	2026-09-30 08:50:29.485+00	published
the-rice-terraces-of-sa-pa	the-rice-terraces-of-sa-pa	The Rice Terraces of Sa Pa	Culture	B2	5	180	4	Culture · Passage	4	2026-09-30 03:25:31.280331+00	2026-09-30 08:50:29.49+00	published
how-podcasts-changed-radio	how-podcasts-changed-radio	How Podcasts Changed Radio	Culture	B2	5	180	4	Culture · Passage	5	2026-09-30 03:25:31.280331+00	2026-09-30 08:50:29.496+00	published
the-economics-of-street-food	the-economics-of-street-food	The Economics of Street Food	Business	C1	6	180	4	Business · Passage	6	2026-09-30 03:25:31.280331+00	2026-09-30 08:50:29.515+00	published
\.


--
-- Data for Name: reading_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reading_questions (id, passage_id, sort_order, prompt, choices, correct_index) FROM stdin;
why-cats-sleep-so-much:q1	why-cats-sleep-so-much	0	What is this passage mainly about?	["Why Cats Sleep So Much", "A cooking recipe", "A grammar rule", "A listening tip"]	0
the-night-bus-to-da-lat:q1	the-night-bus-to-da-lat	0	Why did Minh take the night bus?	["He wanted to sleep on the way", "Flights were expensive during the holidays", "His mother booked the ticket", "There were no flights to Đà Lạt"]	1
the-night-bus-to-da-lat:q2	the-night-bus-to-da-lat	1	What kept waking Minh up?	["The podcast he was listening to", "The lights of the small towns", "The sharp turns on the mountain road", "The cold air from the window"]	2
the-night-bus-to-da-lat:q3	the-night-bus-to-da-lat	2	“Minh reluctantly put on the jacket” means he put it on…	["happily", "very quickly", "without really wanting to", "because it was new"]	2
the-night-bus-to-da-lat:q4	the-night-bus-to-da-lat	3	What did Minh do when he arrived?	["He went straight to his hotel", "He had breakfast from a street vendor", "He took photos of the station", "He called his mother"]	1
working-from-a-cafe:q1	working-from-a-cafe	0	What is this passage mainly about?	["Working From a Café", "A cooking recipe", "A grammar rule", "A listening tip"]	0
the-rice-terraces-of-sa-pa:q1	the-rice-terraces-of-sa-pa	0	What is this passage mainly about?	["The Rice Terraces of Sa Pa", "A cooking recipe", "A grammar rule", "A listening tip"]	0
how-podcasts-changed-radio:q1	how-podcasts-changed-radio	0	What is this passage mainly about?	["How Podcasts Changed Radio", "A cooking recipe", "A grammar rule", "A listening tip"]	0
the-economics-of-street-food:q1	the-economics-of-street-food	0	What is this passage mainly about?	["The Economics of Street Food", "A cooking recipe", "A grammar rule", "A listening tip"]	0
a-morning-at-ben-thanh-market:q1	a-morning-at-ben-thanh-market	0	What is this passage mainly about?	["A Morning at Bến Thành Market", "A cooking recipe", "A grammar rule", "A listening tip"]	0
\.


--
-- Data for Name: reading_vocab_highlights; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reading_vocab_highlights (id, passage_id, word, ipa, part_of_speech, meaning_vi, level) FROM stdin;
the-night-bus-to-da-lat:winding	the-night-bus-to-da-lat	winding	/ˈwaɪn.dɪŋ/	adj.	quanh co, uốn lượn	B1
the-night-bus-to-da-lat:drowsy	the-night-bus-to-da-lat	drowsy	/ˈdraʊ.zi/	adj.	buồn ngủ, uể oải	B1
the-night-bus-to-da-lat:scenery	the-night-bus-to-da-lat	scenery	/ˈsiː.nər.i/	noun	phong cảnh, cảnh vật	A2
the-night-bus-to-da-lat:reluctantly	the-night-bus-to-da-lat	reluctantly	/rɪˈlʌk.tənt.li/	adv.	miễn cưỡng, bất đắc dĩ	B1
the-night-bus-to-da-lat:vendor	the-night-bus-to-da-lat	vendor	/ˈven.dər/	noun	người bán hàng (rong)	B1
the-night-bus-to-da-lat:breathtaking	the-night-bus-to-da-lat	breathtaking	/ˈbreθˌteɪ.kɪŋ/	adj.	đẹp đến nghẹt thở, ngoạn mục	B2
\.


--
-- Data for Name: review_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.review_logs (id, user_id, card_id, rating, scheduled_days, elapsed_days, review, state) FROM stdin;
6bc11b63-922e-4ee3-9a52-bb684eebf08b	963956b9-732e-4136-9e0c-a4400ac7aa00	f266b8128cc3ed6189720f09	3	0	0	2026-09-30 08:45:50.604+00	0
1db70668-1cea-4d78-9a08-b68a4ef7d718	b665efc4-613d-44ae-8b58-3a10d97904f4	550df459c58925542303f378	3	0	0	2026-09-30 09:05:13.595+00	0
20878494-bd9e-49bd-b1b4-6618a3a4dc78	033c9876-883f-483c-9994-7c80c2e2dcf0	2797e15642f98f03197b2910	3	0	0	2026-09-30 09:57:16.656+00	0
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (id, expires_at, token, ip_address, user_agent, user_id, created_at, updated_at) FROM stdin;
5wsGEy8JrliP3fkeTxR9UAF2HmZNbYdp	2026-10-07 08:42:12.514+00	zulS8nHvrVJ8Htp2veqfVqm5hsAQKqnB	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	kwfxP73XLJMIa57epp3nsU0B1qv1qlfU	2026-09-30 08:42:12.515+00	2026-09-30 08:42:12.515+00
NYzdH1QqLP7NqapWrM65p1DpsHtPyVRv	2026-10-07 08:44:46.91+00	dZR8QHXMLSFQ1aBBSz47zFNWbCpiOaAr	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	tJJVzu7WtC0izQqsXNXrXDa3JbavJ6KD	2026-09-30 08:44:46.911+00	2026-09-30 08:44:46.912+00
YYN7oJjs6QI1JTvpY2NG7i6T7EU7q6Yd	2026-10-07 08:45:05.843+00	VyqDMVPxToRWmMudDKKRZ8xVlqdqYBji	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	963956b9-732e-4136-9e0c-a4400ac7aa00	2026-09-30 08:45:05.844+00	2026-09-30 08:45:05.844+00
usfoPAjhQC35GRZGpC6bwUdc4qIchQkn	2026-10-07 08:59:46.759+00	O1WG5GU3yOhB0MxB3peDTYbKfRDmVUwu	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	NM6lUYr2vn78KnAXFJqOMaIS1iMacCQs	2026-09-30 08:59:46.76+00	2026-09-30 08:59:46.76+00
QQrQMvRfsvvUCJ94VzNAGXWkMzWz7uKA	2026-10-07 08:59:54.265+00	wYfAXCOqjLVt5MFoXK3xISr4pS3h6OGp	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	8e6e8647-59de-4684-a673-c777de938c6d	2026-09-30 08:59:54.266+00	2026-09-30 08:59:54.266+00
Q7OU7SiHWci897nOoBLXIUetWnk2luya	2026-10-07 09:04:06.458+00	ss0XAm1g9ocmagIBKmVCNFw9q7qOvGAR	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	AtPHMmittFnK82bXQbuKdqNfHLTUMYSS	2026-09-30 09:04:06.459+00	2026-09-30 09:04:06.459+00
UpR0hG7OpIDb5ehKwyxKKD2O9BqNdnsc	2026-10-07 09:04:23.834+00	ZbAzVY45iznNkUJsAVhL48BuWndbTslO	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	b665efc4-613d-44ae-8b58-3a10d97904f4	2026-09-30 09:04:23.835+00	2026-09-30 09:04:23.835+00
5m3PPVuW6sx4Z12IMpoMfMXbSvCibcUf	2026-10-07 09:50:11.44+00	Nippp6ai6VWuYgqlQBGw6EsnKpqdf6vC	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	fbdcc509-ac98-41cb-9e1c-096affe45133	2026-09-30 09:50:11.441+00	2026-09-30 09:50:11.441+00
Ox6hXYLW1CdL5efWEFZHQcgvy7HauNOM	2026-10-07 09:50:59.891+00	C1JfF4GLXThw3KIIE7u4mufyVM54JzAO	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	uLAQMlC0aAgUNtTP71ee2L7ugxJE9ldL	2026-09-30 09:50:59.892+00	2026-09-30 09:50:59.892+00
43Gu6cSwGeKngU3imva06xXSPCER9APq	2026-10-07 09:51:27.852+00	IQDhyHlQfYlIwvxSGJkmsKTbfgbDrisq	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	ac6eaba3-d035-435b-82f3-fd2e85d87e55	2026-09-30 09:51:27.853+00	2026-09-30 09:51:27.853+00
Ji6KcCdmC2mn60oo09PyoL6h6Ek79f5B	2026-10-07 09:55:26.572+00	xkyJWTH9H8hGhJHyMcyRme1JVadbaxtp	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	113e3cdd-f270-447e-b1fa-32ffecc14d3b	2026-09-30 09:55:26.573+00	2026-09-30 09:55:26.573+00
tbaSyXjK2nGN8EqdZv2782S85HS8y64J	2026-10-07 09:55:32.485+00	syRsjBmbnYHvOswhM4EHDrKwg0KS2l4h	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	f55b8ab9-61de-475d-a6d9-c4df914db292	2026-09-30 09:55:32.486+00	2026-09-30 09:55:32.486+00
DNcIa7EuKJlcqlDB7U2ds8vLxnyZYJVM	2026-10-07 09:56:40.084+00	ly1pALcbUgw0chD28OPNCI4R3EXiGKll	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	0e34f4aa-b6e0-41ff-86d3-fdd0bdfaa410	2026-09-30 09:56:40.084+00	2026-09-30 09:56:40.084+00
lYbtwL8Q3tVLOMTGTLtOvy7XjBCPH8mL	2026-10-07 09:56:44.917+00	XdwS3Qi5KeOhCKhjlO5zfEeNdM7rZvXJ	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	a1d8083f-588b-426c-b158-4514b939070a	2026-09-30 09:56:44.917+00	2026-09-30 09:56:44.917+00
HHoB25fkzR67zuNGWxTQsSkKiD0zKRov	2026-10-07 09:56:53.817+00	qrmr0ucr0Hg3tO5vKuuY7bRVB3lJ5jRA	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	XJv75hoRGsYGxRn6xiYf0xf09EX1ZzXZ	2026-09-30 09:56:53.817+00	2026-09-30 09:56:53.817+00
uzaG3tO4yQ5nbnrcFtNp1I26cjoQ2QSy	2026-10-07 09:56:57.425+00	bD5Fw5NfbXN6LOyQoJecn6n3WSUI65n7	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	033c9876-883f-483c-9994-7c80c2e2dcf0	2026-09-30 09:56:57.426+00	2026-09-30 09:56:57.426+00
qrJhDYkfr3KqrexiDqc2CV0DTwHFMu1t	2026-10-08 03:21:16.108+00	zcRgodQxChH4t0UOjhzJFdgVm4z8XCZj	0000:0000:0000:0000:0000:0000:0000:0000	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	YCUL9L6ADd1I7EToiqxQ5S7xhQSes16s	2026-10-01 03:21:16.108+00	2026-10-01 03:21:16.108+00
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."user" (id, name, email, email_verified, image, cefr_level, timezone, goal_text, created_at, updated_at, role) FROM stdin;
user-linh	Linh Trần	linh@example.com	t	\N	B1	Asia/Ho_Chi_Minh	IELTS 6.5	2026-09-30 03:25:31.52325+00	2026-09-30 03:25:42.028+00	user
s8Z2ag6EkxbDhQZUZmuyxiKGc2peyDhJ	Signup E2E	e2e.signup.1790757605802@example.com	f	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 08:40:21.487+00	2026-09-30 08:40:21.487+00	user
kwfxP73XLJMIa57epp3nsU0B1qv1qlfU	Signup E2E	e2e.signup.1790757709266@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 08:42:07.7+00	2026-09-30 08:42:07.94885+00	user
tJJVzu7WtC0izQqsXNXrXDa3JbavJ6KD	Signup E2E	e2e.signup.1790757855179@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 08:44:40.167+00	2026-09-30 08:44:40.43777+00	user
963956b9-732e-4136-9e0c-a4400ac7aa00	E2E Learner	e2e.learn.1790757900628@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 08:45:01.119031+00	2026-09-30 08:45:01.119031+00	user
NM6lUYr2vn78KnAXFJqOMaIS1iMacCQs	Signup E2E	e2e.signup.1790758769263@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 08:59:42.79+00	2026-09-30 08:59:42.986191+00	user
8e6e8647-59de-4684-a673-c777de938c6d	E2E Learner	e2e.learn.1790758791244@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 08:59:51.523699+00	2026-09-30 08:59:51.523699+00	user
AtPHMmittFnK82bXQbuKdqNfHLTUMYSS	Signup E2E	e2e.signup.1790759016853@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:03:59.502+00	2026-09-30 09:03:59.727618+00	user
b665efc4-613d-44ae-8b58-3a10d97904f4	E2E Learner	e2e.learn.1790759058629@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:04:19.018903+00	2026-09-30 09:04:19.018903+00	user
b044c8cc-acc1-42db-9f67-bd32602542b1	Normal User	e2e.user.1790761784476@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:49:44.977973+00	2026-09-30 09:49:44.977973+00	user
fbdcc509-ac98-41cb-9e1c-096affe45133	Site Admin	e2e.admin.1790761806725@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:50:07.13321+00	2026-09-30 09:50:07.13321+00	admin
uLAQMlC0aAgUNtTP71ee2L7ugxJE9ldL	Signup E2E	e2e.signup.1790761854893@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:50:55.958+00	2026-09-30 09:50:56.070616+00	user
ac6eaba3-d035-435b-82f3-fd2e85d87e55	E2E Learner	e2e.learn.1790761872523@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:51:12.851864+00	2026-09-30 09:51:12.851864+00	user
113e3cdd-f270-447e-b1fa-32ffecc14d3b	Normal User	e2e.user.1790762119010@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:55:19.240975+00	2026-09-30 09:55:19.240975+00	user
f55b8ab9-61de-475d-a6d9-c4df914db292	Site Admin	e2e.admin.1790762131703@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:55:31.888088+00	2026-09-30 09:55:31.888088+00	admin
0e34f4aa-b6e0-41ff-86d3-fdd0bdfaa410	Normal User	e2e.user.1790762192804@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:56:33.008015+00	2026-09-30 09:56:33.008015+00	user
a1d8083f-588b-426c-b158-4514b939070a	Site Admin	e2e.admin.1790762204198@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:56:44.351103+00	2026-09-30 09:56:44.351103+00	admin
XJv75hoRGsYGxRn6xiYf0xf09EX1ZzXZ	Signup E2E	e2e.signup.1790762211523@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:56:52.059+00	2026-09-30 09:56:52.123364+00	user
033c9876-883f-483c-9994-7c80c2e2dcf0	E2E Learner	e2e.learn.1790762215621@example.com	t	\N	A1	Asia/Ho_Chi_Minh	\N	2026-09-30 09:56:55.799742+00	2026-09-30 09:56:55.799742+00	user
XC87UBk37bVbvxj5Tzeg0cQu6EywpK2s	Admin	admin@gmail.com	f	\N	A1	Asia/Ho_Chi_Minh	\N	2026-10-01 03:17:33.881+00	2026-10-01 03:17:33.881+00	user
YCUL9L6ADd1I7EToiqxQ5S7xhQSes16s	Admin	admin@admin.com	f	\N	A1	Asia/Ho_Chi_Minh	\N	2026-10-01 03:21:16.087+00	2026-10-01 03:21:16.087+00	user
\.


--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_achievements (user_id, achievement_id, earned_at, progress) FROM stdin;
user-linh	first-page	2026-09-04 08:00:00+00	\N
user-linh	streak-7	2026-09-04 08:00:00+00	\N
user-linh	word-collector	2026-09-04 08:00:00+00	\N
user-linh	grammar-geek	2026-09-04 08:00:00+00	\N
user-linh	early-bird	2026-09-04 08:00:00+00	\N
\.


--
-- Data for Name: user_lesson_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_lesson_progress (id, user_id, content_kind, content_id, status, progress_percent, last_position, updated_at) FROM stdin;
aa43e387e9047fb53c88d1de	user-linh	grammar	present-perfect-vs-past-simple	in_progress	60	{"section": "mistakes"}	2026-09-30 03:25:42.241+00
6cbf7a4fe8277c6f34db7a21	user-linh	vocabulary_set	at-the-airport	in_progress	47	\N	2026-09-30 03:25:42.244+00
4617afb577953142fc49b1ce	user-linh	grammar	use-linking-verbs-with-complements	in_progress	35	{"section": "examples"}	2026-09-30 03:25:42.245+00
afc6b8aa1696b6202bba6249	user-linh	reading	the-night-bus-to-da-lat	in_progress	40	\N	2026-09-30 03:25:42.247+00
e1734e0e815fc773a66be69b	user-linh	listening	checking-in-at-the-airport	in_progress	50	{"blankIndex": 2}	2026-09-30 03:25:42.248+00
1ca0a46bfc850d14a5452f5f	user-linh	reading	a-morning-at-ben-thanh-market	completed	100	\N	2026-09-30 03:25:42.25+00
97ca41eb06fda24decf08bee	user-linh	reading	why-cats-sleep-so-much	completed	100	\N	2026-09-30 03:25:42.258+00
ef1292cff9fdeff1d9464c7d	user-linh	listening	ordering-a-coffee	completed	100	\N	2026-09-30 03:25:42.26+00
ed4a80b1b738a0336499ce30	user-linh	listening	asking-for-directions-in-ha-noi	completed	100	\N	2026-09-30 03:25:42.262+00
c2d648bce7732d2edf505eaa	YCUL9L6ADd1I7EToiqxQ5S7xhQSes16s	grammar	use-subject-verb-clauses	in_progress	10	{"section": "visit"}	2026-10-01 04:51:28.248+00
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_settings (user_id, words_per_day, grammar_per_day, daily_reminder, reminder_time, reminder_days, streak_rescue, interface_language, show_vietnamese_hints, auto_play_pronunciation, theme, updated_at) FROM stdin;
user-linh	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 03:25:42.236+00
s8Z2ag6EkxbDhQZUZmuyxiKGc2peyDhJ	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 08:40:21.575403+00
kwfxP73XLJMIa57epp3nsU0B1qv1qlfU	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 08:42:07.79941+00
tJJVzu7WtC0izQqsXNXrXDa3JbavJ6KD	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 08:44:40.287467+00
963956b9-732e-4136-9e0c-a4400ac7aa00	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 08:45:01.119031+00
NM6lUYr2vn78KnAXFJqOMaIS1iMacCQs	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 08:59:42.864949+00
8e6e8647-59de-4684-a673-c777de938c6d	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 08:59:51.523699+00
AtPHMmittFnK82bXQbuKdqNfHLTUMYSS	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:03:59.587487+00
b665efc4-613d-44ae-8b58-3a10d97904f4	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:04:19.018903+00
b044c8cc-acc1-42db-9f67-bd32602542b1	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:49:44.977973+00
fbdcc509-ac98-41cb-9e1c-096affe45133	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:50:07.13321+00
uLAQMlC0aAgUNtTP71ee2L7ugxJE9ldL	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:50:56.010899+00
ac6eaba3-d035-435b-82f3-fd2e85d87e55	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:51:12.851864+00
113e3cdd-f270-447e-b1fa-32ffecc14d3b	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:55:19.240975+00
f55b8ab9-61de-475d-a6d9-c4df914db292	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:55:31.888088+00
0e34f4aa-b6e0-41ff-86d3-fdd0bdfaa410	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:56:33.008015+00
a1d8083f-588b-426c-b158-4514b939070a	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:56:44.351103+00
XJv75hoRGsYGxRn6xiYf0xf09EX1ZzXZ	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:56:52.099113+00
033c9876-883f-483c-9994-7c80c2e2dcf0	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-09-30 09:56:55.799742+00
XC87UBk37bVbvxj5Tzeg0cQu6EywpK2s	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-10-01 03:17:33.93031+00
YCUL9L6ADd1I7EToiqxQ5S7xhQSes16s	20	2	t	20:30	{mon,tue,wed,thu,fri,sun}	t	en	t	f	default	2026-10-01 03:24:07.313+00
\.


--
-- Data for Name: user_word_cards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_word_cards (id, user_id, word_id, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review, learning_steps) FROM stdin;
c4050700148d1f8a1e284d35	user-linh	w-itinerary	2026-09-30 03:25:42.268+00	2	5	0	1	1	0	1	2026-09-29 03:25:42.268+00	0
3209aaba18fdcc05e02fea4f	user-linh	w-boarding-pass	2026-10-02 03:25:42.277+00	3	5	1	2	2	0	2	2026-09-28 03:25:42.277+00	0
cdb3b7a3946df641ca61058e	user-linh	w-gate	2026-10-03 03:25:42.279+00	4	5	2	3	3	0	2	2026-09-27 03:25:42.279+00	0
f266b8128cc3ed6189720f09	963956b9-732e-4136-9e0c-a4400ac7aa00	9cd42c0d-67ec-4d21-aba3-ca2e2b75c15f	2026-09-30 08:55:50.604+00	2.3065	2.118104	0	0	1	0	1	2026-09-30 08:45:50.604+00	1
550df459c58925542303f378	b665efc4-613d-44ae-8b58-3a10d97904f4	7c669ce5-2f95-40a2-969b-ad237cbcd0d5	2026-09-30 09:15:13.595+00	2.3065	2.118104	0	0	1	0	1	2026-09-30 09:05:13.595+00	1
2797e15642f98f03197b2910	033c9876-883f-483c-9994-7c80c2e2dcf0	363075a5-d59b-48a4-991b-9479cdca5c99	2026-09-30 10:07:16.656+00	2.3065	2.118104	0	0	1	0	1	2026-09-30 09:57:16.656+00	1
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification (id, identifier, value, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: word_sets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.word_sets (id, title, title_vi, topic, level, owner_id, created_at, status) FROM stdin;
e2e-set-1790757900628-f21e2ed9	E2E Set 1790757900628	E2E Set 1790757900628	Daily life	A2	963956b9-732e-4136-9e0c-a4400ac7aa00	2026-09-30 08:45:36.121827+00	published
at-the-airport	At the airport	Ở sân bay	Travel	A2	\N	2026-09-30 03:25:31.465405+00	published
morning-routines	Morning routines	Thói quen buổi sáng	Daily life	A1	\N	2026-09-30 03:25:31.465405+00	published
job-interviews	Job interviews	Phỏng vấn xin việc	Work	B1	\N	2026-09-30 03:25:31.465405+00	published
vietnamese-street-food	Vietnamese street food	Ẩm thực đường phố	Food	A2	\N	2026-09-30 03:25:31.465405+00	published
office-small-talk	Office small talk	Trò chuyện nơi công sở	Work	B2	\N	2026-09-30 03:25:31.465405+00	published
booking-a-hotel	Booking a hotel	Đặt phòng khách sạn	Travel	A2	\N	2026-09-30 03:25:31.465405+00	published
feelings-moods	Feelings & moods	Cảm xúc và tâm trạng	Daily life	B1	\N	2026-09-30 03:25:31.465405+00	published
in-the-kitchen	In the kitchen	Trong nhà bếp	Food	A1	\N	2026-09-30 03:25:31.465405+00	published
negotiating-a-deal	Negotiating a deal	Đàm phán hợp đồng	Work	C1	\N	2026-09-30 03:25:31.465405+00	published
e2e-set-1790759058629-8afbb807	E2E Set 1790759058629	E2E Set 1790759058629	Daily life	A2	b665efc4-613d-44ae-8b58-3a10d97904f4	2026-09-30 09:05:02.192448+00	published
e2e-set-1790762215621-f3f05fe1	E2E Set 1790762215621	E2E Set 1790762215621	Daily life	A2	033c9876-883f-483c-9994-7c80c2e2dcf0	2026-09-30 09:57:09.68687+00	published
\.


--
-- Data for Name: words; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.words (id, word_set_id, owner_id, word, ipa, part_of_speech, level, meaning_vi, definition_en, examples, collocations, notes, image_path, created_at) FROM stdin;
9cd42c0d-67ec-4d21-aba3-ca2e2b75c15f	e2e-set-1790757900628-f21e2ed9	963956b9-732e-4136-9e0c-a4400ac7aa00	apple1790757900628		noun	A2	quả táo		[]	\N	\N	\N	2026-09-30 08:45:36.136+00
w-itinerary	at-the-airport	\N	itinerary	/aɪˈtɪn.ər.ər.i/	noun	A2	lịch trình (chuyến đi)	a detailed plan of a journey, with places and times	[{"en": "Could you email me the itinerary for our trip?", "vi": "Bạn gửi email cho mình lịch trình chuyến đi nhé?"}, {"en": "Our itinerary includes two days in Hội An.", "vi": "Lịch trình của chúng tôi có hai ngày ở Hội An."}]	["travel itinerary", "a detailed itinerary", "plan an itinerary"]	\N	\N	2026-09-20 08:00:00+00
w-boarding-pass	at-the-airport	\N	boarding pass	/ˈbɔː.dɪŋ ˌpɑːs/	noun	A2	thẻ lên máy bay	a document that lets you board a plane	[{"en": "Please show your boarding pass at the gate.", "vi": "Vui lòng xuất trình thẻ lên máy bay tại cổng."}]	\N	\N	\N	2026-09-21 08:00:00+00
w-gate	at-the-airport	\N	gate	/ɡeɪt/	noun	A1	cổng (sân bay)	the place where passengers board the plane	[{"en": "Our flight leaves from gate 12.", "vi": "Chuyến bay của chúng ta khởi hành từ cổng 12."}]	\N	\N	\N	2026-09-22 08:00:00+00
7c669ce5-2f95-40a2-969b-ad237cbcd0d5	e2e-set-1790759058629-8afbb807	b665efc4-613d-44ae-8b58-3a10d97904f4	apple1790759058629		noun	A2	quả táo		[]	\N	\N	\N	2026-09-30 09:05:02.22+00
363075a5-d59b-48a4-991b-9479cdca5c99	e2e-set-1790762215621-f3f05fe1	033c9876-883f-483c-9994-7c80c2e2dcf0	apple1790762215621		noun	A2	quả táo		[]	\N	\N	\N	2026-09-30 09:57:09.697+00
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 5, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: achievement_definitions achievement_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievement_definitions
    ADD CONSTRAINT achievement_definitions_pkey PRIMARY KEY (id);


--
-- Name: activity_events activity_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_events
    ADD CONSTRAINT activity_events_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: grammar_families grammar_families_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grammar_families
    ADD CONSTRAINT grammar_families_pkey PRIMARY KEY (id);


--
-- Name: grammar_groups grammar_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grammar_groups
    ADD CONSTRAINT grammar_groups_pkey PRIMARY KEY (id);


--
-- Name: grammar_lessons grammar_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grammar_lessons
    ADD CONSTRAINT grammar_lessons_pkey PRIMARY KEY (id);


--
-- Name: grammar_lessons grammar_lessons_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grammar_lessons
    ADD CONSTRAINT grammar_lessons_slug_unique UNIQUE (slug);


--
-- Name: listening_dictation_blanks listening_dictation_blanks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listening_dictation_blanks
    ADD CONSTRAINT listening_dictation_blanks_pkey PRIMARY KEY (id);


--
-- Name: listening_dictation_blanks listening_dictation_lesson_sort_uidx; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listening_dictation_blanks
    ADD CONSTRAINT listening_dictation_lesson_sort_uidx UNIQUE (lesson_id, sort_order);


--
-- Name: listening_lessons listening_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listening_lessons
    ADD CONSTRAINT listening_lessons_pkey PRIMARY KEY (id);


--
-- Name: listening_lessons listening_lessons_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listening_lessons
    ADD CONSTRAINT listening_lessons_slug_unique UNIQUE (slug);


--
-- Name: listening_transcript_sentences listening_transcript_lesson_sort_uidx; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listening_transcript_sentences
    ADD CONSTRAINT listening_transcript_lesson_sort_uidx UNIQUE (lesson_id, sort_order);


--
-- Name: listening_transcript_sentences listening_transcript_sentences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listening_transcript_sentences
    ADD CONSTRAINT listening_transcript_sentences_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempts quiz_attempts_user_client_attempt_uidx; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_user_client_attempt_uidx UNIQUE (user_id, client_attempt_id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: quiz_questions quiz_questions_quiz_sort_uidx; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_quiz_sort_uidx UNIQUE (quiz_id, sort_order);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_slug_unique UNIQUE (slug);


--
-- Name: reading_paragraphs reading_paragraphs_passage_sort_uidx; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_paragraphs
    ADD CONSTRAINT reading_paragraphs_passage_sort_uidx UNIQUE (passage_id, sort_order);


--
-- Name: reading_paragraphs reading_paragraphs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_paragraphs
    ADD CONSTRAINT reading_paragraphs_pkey PRIMARY KEY (id);


--
-- Name: reading_passages reading_passages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_passages
    ADD CONSTRAINT reading_passages_pkey PRIMARY KEY (id);


--
-- Name: reading_passages reading_passages_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_passages
    ADD CONSTRAINT reading_passages_slug_unique UNIQUE (slug);


--
-- Name: reading_questions reading_questions_passage_sort_uidx; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_questions
    ADD CONSTRAINT reading_questions_passage_sort_uidx UNIQUE (passage_id, sort_order);


--
-- Name: reading_questions reading_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_questions
    ADD CONSTRAINT reading_questions_pkey PRIMARY KEY (id);


--
-- Name: reading_vocab_highlights reading_vocab_highlights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_vocab_highlights
    ADD CONSTRAINT reading_vocab_highlights_pkey PRIMARY KEY (id);


--
-- Name: review_logs review_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_logs
    ADD CONSTRAINT review_logs_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_token_unique UNIQUE (token);


--
-- Name: user_achievements user_achievements_user_id_achievement_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_achievement_id_pk PRIMARY KEY (user_id, achievement_id);


--
-- Name: user user_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_unique UNIQUE (email);


--
-- Name: user_lesson_progress user_lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_progress
    ADD CONSTRAINT user_lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: user_lesson_progress user_lesson_progress_user_kind_id_uidx; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_progress
    ADD CONSTRAINT user_lesson_progress_user_kind_id_uidx UNIQUE (user_id, content_kind, content_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);


--
-- Name: user_word_cards user_word_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_word_cards
    ADD CONSTRAINT user_word_cards_pkey PRIMARY KEY (id);


--
-- Name: user_word_cards user_word_cards_user_word_uidx; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_word_cards
    ADD CONSTRAINT user_word_cards_user_word_uidx UNIQUE (user_id, word_id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: word_sets word_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.word_sets
    ADD CONSTRAINT word_sets_pkey PRIMARY KEY (id);


--
-- Name: words words_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.words
    ADD CONSTRAINT words_pkey PRIMARY KEY (id);


--
-- Name: account_provider_account_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX account_provider_account_uidx ON public.account USING btree (provider_id, account_id);


--
-- Name: account_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_user_id_idx ON public.account USING btree (user_id);


--
-- Name: activity_events_user_local_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_events_user_local_date_idx ON public.activity_events USING btree (user_id, local_date);


--
-- Name: activity_events_user_occurred_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_events_user_occurred_idx ON public.activity_events USING btree (user_id, occurred_at);


--
-- Name: admin_audit_log_actor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_actor_idx ON public.admin_audit_log USING btree (actor_user_id);


--
-- Name: admin_audit_log_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log USING btree (created_at);


--
-- Name: admin_audit_log_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_entity_idx ON public.admin_audit_log USING btree (entity_type, entity_id);


--
-- Name: grammar_groups_family_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX grammar_groups_family_id_idx ON public.grammar_groups USING btree (family_id);


--
-- Name: grammar_lessons_group_sort_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX grammar_lessons_group_sort_idx ON public.grammar_lessons USING btree (group_id, sort_order);


--
-- Name: grammar_lessons_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX grammar_lessons_level_idx ON public.grammar_lessons USING btree (level);


--
-- Name: listening_lessons_topic_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listening_lessons_topic_level_idx ON public.listening_lessons USING btree (topic, level);


--
-- Name: quiz_attempts_user_quiz_completed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_attempts_user_quiz_completed_idx ON public.quiz_attempts USING btree (user_id, quiz_id, completed_at);


--
-- Name: quiz_questions_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_questions_type_idx ON public.quiz_questions USING btree (type);


--
-- Name: reading_passages_topic_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reading_passages_topic_level_idx ON public.reading_passages USING btree (topic, level);


--
-- Name: reading_vocab_highlights_passage_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reading_vocab_highlights_passage_id_idx ON public.reading_vocab_highlights USING btree (passage_id);


--
-- Name: review_logs_user_review_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX review_logs_user_review_idx ON public.review_logs USING btree (user_id, review);


--
-- Name: session_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX session_user_id_idx ON public.session USING btree (user_id);


--
-- Name: user_lesson_progress_user_updated_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_lesson_progress_user_updated_idx ON public.user_lesson_progress USING btree (user_id, updated_at);


--
-- Name: user_word_cards_user_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_word_cards_user_due_idx ON public.user_word_cards USING btree (user_id, due);


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verification_identifier_idx ON public.verification USING btree (identifier);


--
-- Name: word_sets_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX word_sets_owner_id_idx ON public.word_sets USING btree (owner_id);


--
-- Name: word_sets_topic_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX word_sets_topic_level_idx ON public.word_sets USING btree (topic, level);


--
-- Name: words_owner_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX words_owner_created_idx ON public.words USING btree (owner_id, created_at);


--
-- Name: words_system_set_word_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX words_system_set_word_uidx ON public.words USING btree (word_set_id, lower(word)) WHERE (owner_id IS NULL);


--
-- Name: words_user_set_word_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX words_user_set_word_uidx ON public.words USING btree (word_set_id, owner_id, lower(word)) WHERE (owner_id IS NOT NULL);


--
-- Name: words_word_set_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX words_word_set_id_idx ON public.words USING btree (word_set_id);


--
-- Name: account account_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: activity_events activity_events_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_events
    ADD CONSTRAINT activity_events_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: admin_audit_log admin_audit_log_actor_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_actor_user_id_user_id_fk FOREIGN KEY (actor_user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: grammar_groups grammar_groups_family_id_grammar_families_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grammar_groups
    ADD CONSTRAINT grammar_groups_family_id_grammar_families_id_fk FOREIGN KEY (family_id) REFERENCES public.grammar_families(id) ON DELETE CASCADE;


--
-- Name: grammar_lessons grammar_lessons_family_id_grammar_families_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grammar_lessons
    ADD CONSTRAINT grammar_lessons_family_id_grammar_families_id_fk FOREIGN KEY (family_id) REFERENCES public.grammar_families(id) ON DELETE CASCADE;


--
-- Name: grammar_lessons grammar_lessons_group_id_grammar_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grammar_lessons
    ADD CONSTRAINT grammar_lessons_group_id_grammar_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.grammar_groups(id) ON DELETE CASCADE;


--
-- Name: listening_dictation_blanks listening_dictation_blanks_lesson_id_listening_lessons_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listening_dictation_blanks
    ADD CONSTRAINT listening_dictation_blanks_lesson_id_listening_lessons_id_fk FOREIGN KEY (lesson_id) REFERENCES public.listening_lessons(id) ON DELETE CASCADE;


--
-- Name: listening_transcript_sentences listening_transcript_sentences_lesson_id_listening_lessons_id_f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listening_transcript_sentences
    ADD CONSTRAINT listening_transcript_sentences_lesson_id_listening_lessons_id_f FOREIGN KEY (lesson_id) REFERENCES public.listening_lessons(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_quiz_id_quizzes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_quiz_id_quizzes_id_fk FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: quiz_questions quiz_questions_quiz_id_quizzes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_quiz_id_quizzes_id_fk FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: reading_paragraphs reading_paragraphs_passage_id_reading_passages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_paragraphs
    ADD CONSTRAINT reading_paragraphs_passage_id_reading_passages_id_fk FOREIGN KEY (passage_id) REFERENCES public.reading_passages(id) ON DELETE CASCADE;


--
-- Name: reading_questions reading_questions_passage_id_reading_passages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_questions
    ADD CONSTRAINT reading_questions_passage_id_reading_passages_id_fk FOREIGN KEY (passage_id) REFERENCES public.reading_passages(id) ON DELETE CASCADE;


--
-- Name: reading_vocab_highlights reading_vocab_highlights_passage_id_reading_passages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_vocab_highlights
    ADD CONSTRAINT reading_vocab_highlights_passage_id_reading_passages_id_fk FOREIGN KEY (passage_id) REFERENCES public.reading_passages(id) ON DELETE CASCADE;


--
-- Name: review_logs review_logs_card_id_user_word_cards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_logs
    ADD CONSTRAINT review_logs_card_id_user_word_cards_id_fk FOREIGN KEY (card_id) REFERENCES public.user_word_cards(id) ON DELETE CASCADE;


--
-- Name: review_logs review_logs_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_logs
    ADD CONSTRAINT review_logs_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: session session_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_achievement_id_achievement_definitions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_achievement_definitions_id_fk FOREIGN KEY (achievement_id) REFERENCES public.achievement_definitions(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_lesson_progress user_lesson_progress_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_progress
    ADD CONSTRAINT user_lesson_progress_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_word_cards user_word_cards_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_word_cards
    ADD CONSTRAINT user_word_cards_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_word_cards user_word_cards_word_id_words_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_word_cards
    ADD CONSTRAINT user_word_cards_word_id_words_id_fk FOREIGN KEY (word_id) REFERENCES public.words(id) ON DELETE CASCADE;


--
-- Name: word_sets word_sets_owner_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.word_sets
    ADD CONSTRAINT word_sets_owner_id_user_id_fk FOREIGN KEY (owner_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: words words_owner_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.words
    ADD CONSTRAINT words_owner_id_user_id_fk FOREIGN KEY (owner_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: words words_word_set_id_word_sets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.words
    ADD CONSTRAINT words_word_set_id_word_sets_id_fk FOREIGN KEY (word_set_id) REFERENCES public.word_sets(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Z2f3tSh197MWdhbQwqL339eDWj1T9FJajbsqbdeyd9dhv3de5dnRU5CrSOo4MHK

