-- Pronunciation assessment MVP: user records themselves reading a line from an
-- existing conversion, assess-pronunciation (Edge Function) transcribes it and
-- diffs the transcript against the expected line word-by-word.

create table if not exists public.pronunciation_attempts (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	conversion_id uuid references public.conversions (id) on delete cascade,
	line_index int not null,
	expected_text text not null,
	transcript text not null,
	word_results jsonb not null,
	accuracy_score numeric not null,
	audio_path text not null,
	created_at timestamptz not null default now()
);

create index if not exists pronunciation_attempts_user_created_idx
	on public.pronunciation_attempts (user_id, created_at desc);

alter table public.pronunciation_attempts enable row level security;

create policy "pronunciation_attempts_select_own"
	on public.pronunciation_attempts for select
	using (auth.uid() = user_id);

-- Inserted by assess-pronunciation using the caller's own JWT (same pattern as
-- process-image writing to conversions), so a normal per-user insert policy
-- is enough -- no service-role/secret data involved here.
create policy "pronunciation_attempts_insert_own"
	on public.pronunciation_attempts for insert
	with check (auth.uid() = user_id);

-- Storage bucket for the user's recorded audio. Private bucket, objects keyed
-- as "<user_id>/<uuid>.<ext>" so RLS can scope access per-user.
insert into storage.buckets (id, name, public)
values ('pronunciation-audio', 'pronunciation-audio', false)
on conflict (id) do nothing;

create policy "pronunciation_audio_select_own"
	on storage.objects for select
	using (
		bucket_id = 'pronunciation-audio'
		and auth.uid()::text = (storage.foldername(name))[1]
	);

create policy "pronunciation_audio_insert_own"
	on storage.objects for insert
	with check (
		bucket_id = 'pronunciation-audio'
		and auth.uid()::text = (storage.foldername(name))[1]
	);
