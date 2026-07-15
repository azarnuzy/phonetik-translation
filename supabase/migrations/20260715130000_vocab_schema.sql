-- English Access vocabulary app schema. Content tables (discourses, vocabulary,
-- phrasal verbs, word formation, word patterns, prepositional phrases, quiz)
-- are public-read reference data. User tables track per-user progress, scoped
-- to auth.uid() same as the conversions table in the initial migration.

create table if not exists public.discourses (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	title text not null,
	description text not null,
	"order" int not null,
	coming_soon boolean not null default false,
	created_at timestamptz not null default now()
);

create table if not exists public.vocabulary_words (
	id uuid primary key default gen_random_uuid(),
	discourse_id uuid not null references public.discourses (id) on delete cascade,
	word text not null,
	word_class text,
	meaning text not null,
	example text,
	"order" int not null
);

create index if not exists vocabulary_words_discourse_idx on public.vocabulary_words (discourse_id);

create table if not exists public.phrasal_verbs (
	id uuid primary key default gen_random_uuid(),
	discourse_id uuid not null references public.discourses (id) on delete cascade,
	phrase text not null,
	meaning text not null,
	"order" int not null
);

create index if not exists phrasal_verbs_discourse_idx on public.phrasal_verbs (discourse_id);

create table if not exists public.word_formation_entries (
	id uuid primary key default gen_random_uuid(),
	discourse_id uuid not null references public.discourses (id) on delete cascade,
	base_word text not null,
	"order" int not null
);

create index if not exists word_formation_entries_discourse_idx on public.word_formation_entries (discourse_id);

create table if not exists public.word_formation_forms (
	id uuid primary key default gen_random_uuid(),
	entry_id uuid not null references public.word_formation_entries (id) on delete cascade,
	form text not null,
	part_of_speech text not null
);

create index if not exists word_formation_forms_entry_idx on public.word_formation_forms (entry_id);

create type public.word_pattern_category as enum ('ADJECTIVE', 'VERB', 'NOUN');

create table if not exists public.word_patterns (
	id uuid primary key default gen_random_uuid(),
	discourse_id uuid not null references public.discourses (id) on delete cascade,
	category public.word_pattern_category not null,
	pattern text not null,
	meaning text,
	"order" int not null
);

create index if not exists word_patterns_discourse_idx on public.word_patterns (discourse_id);

create table if not exists public.prepositional_phrases (
	id uuid primary key default gen_random_uuid(),
	discourse_id uuid not null references public.discourses (id) on delete cascade,
	phrase text not null,
	meaning text not null,
	"order" int not null
);

create index if not exists prepositional_phrases_discourse_idx on public.prepositional_phrases (discourse_id);

create type public.quiz_category as enum (
	'TOPIC_VOCABULARY',
	'PHRASAL_VERB',
	'WORD_FORMATION',
	'WORD_PATTERN',
	'PREPOSITIONAL_PHRASE'
);

create table if not exists public.quiz_questions (
	id uuid primary key default gen_random_uuid(),
	discourse_id uuid not null references public.discourses (id) on delete cascade,
	category public.quiz_category not null,
	prompt text not null,
	"order" int not null
);

create index if not exists quiz_questions_discourse_idx on public.quiz_questions (discourse_id);

-- is_correct is intentionally never exposed to clients -- see quiz_options_public below.
create table if not exists public.quiz_options (
	id uuid primary key default gen_random_uuid(),
	question_id uuid not null references public.quiz_questions (id) on delete cascade,
	text text not null,
	is_correct boolean not null default false
);

create index if not exists quiz_options_question_idx on public.quiz_options (question_id);

-- Views run with the owner's privileges (not the caller's) unless declared
-- security_invoker, so this intentionally omits security_invoker: it lets
-- anon/authenticated read id/question_id/text while quiz_options itself has
-- no select policy at all, keeping is_correct server-side only.
create or replace view public.quiz_options_public as
select id, question_id, text
from public.quiz_options;

create table if not exists public.user_word_progress (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	vocabulary_word_id uuid not null references public.vocabulary_words (id) on delete cascade,
	learned boolean not null default false,
	saved boolean not null default false,
	updated_at timestamptz not null default now(),
	unique (user_id, vocabulary_word_id)
);

create index if not exists user_word_progress_user_idx on public.user_word_progress (user_id);

create table if not exists public.user_quiz_attempts (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	discourse_id uuid not null references public.discourses (id) on delete cascade,
	score int not null,
	total int not null,
	created_at timestamptz not null default now()
);

create index if not exists user_quiz_attempts_user_idx on public.user_quiz_attempts (user_id);

create table if not exists public.user_stats (
	user_id uuid primary key references auth.users (id) on delete cascade,
	points int not null default 0,
	current_streak int not null default 0,
	last_active_date date
);

-- Row level security -----------------------------------------------------

alter table public.discourses enable row level security;
alter table public.vocabulary_words enable row level security;
alter table public.phrasal_verbs enable row level security;
alter table public.word_formation_entries enable row level security;
alter table public.word_formation_forms enable row level security;
alter table public.word_patterns enable row level security;
alter table public.prepositional_phrases enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.user_word_progress enable row level security;
alter table public.user_quiz_attempts enable row level security;
alter table public.user_stats enable row level security;

-- Content is public read-only; only migrations (running as postgres) write it.
create policy "discourses_select_all" on public.discourses for select using (true);
create policy "vocabulary_words_select_all" on public.vocabulary_words for select using (true);
create policy "phrasal_verbs_select_all" on public.phrasal_verbs for select using (true);
create policy "word_formation_entries_select_all" on public.word_formation_entries for select using (true);
create policy "word_formation_forms_select_all" on public.word_formation_forms for select using (true);
create policy "word_patterns_select_all" on public.word_patterns for select using (true);
create policy "prepositional_phrases_select_all" on public.prepositional_phrases for select using (true);
create policy "quiz_questions_select_all" on public.quiz_questions for select using (true);

-- Deliberately no policy on quiz_options -- nobody selects it directly, only
-- through quiz_options_public (view) or the submit-quiz edge function
-- (service role, which bypasses RLS).

create policy "user_word_progress_select_own" on public.user_word_progress for select using (auth.uid() = user_id);
create policy "user_word_progress_insert_own" on public.user_word_progress for insert with check (auth.uid() = user_id);
create policy "user_word_progress_update_own" on public.user_word_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_quiz_attempts_select_own" on public.user_quiz_attempts for select using (auth.uid() = user_id);

create policy "user_stats_select_own" on public.user_stats for select using (auth.uid() = user_id);

-- Grants -------------------------------------------------------------------

grant select on
	public.discourses,
	public.vocabulary_words,
	public.phrasal_verbs,
	public.word_formation_entries,
	public.word_formation_forms,
	public.word_patterns,
	public.prepositional_phrases,
	public.quiz_questions,
	public.quiz_options_public
to anon, authenticated;

grant select, insert, update on public.user_word_progress to authenticated;
grant select on public.user_quiz_attempts to authenticated;
grant select on public.user_stats to authenticated;
