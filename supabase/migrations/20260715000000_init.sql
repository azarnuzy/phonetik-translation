-- Phonetik MVP schema: a single table backs both Riwayat (history) and
-- Favorit (favorites) -- favorites are just conversions with is_favorite = true.

create table if not exists public.conversions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	language text not null default 'en-US',
	original_text text not null,
	ipa_lines jsonb not null,
	is_favorite boolean not null default false,
	created_at timestamptz not null default now()
);

create index if not exists conversions_user_created_idx
	on public.conversions (user_id, created_at desc);

create index if not exists conversions_user_favorite_idx
	on public.conversions (user_id, is_favorite);

alter table public.conversions enable row level security;

create policy "conversions_select_own"
	on public.conversions for select
	using (auth.uid() = user_id);

create policy "conversions_insert_own"
	on public.conversions for insert
	with check (auth.uid() = user_id);

create policy "conversions_update_own"
	on public.conversions for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

create policy "conversions_delete_own"
	on public.conversions for delete
	using (auth.uid() = user_id);
