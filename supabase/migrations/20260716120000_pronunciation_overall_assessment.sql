-- Extends pronunciation_attempts to support two assessment scopes:
--   'line'    - a single line (existing behaviour)
--   'overall' - the whole conversion's original_text, from an uploaded or
--               recorded audio covering the full paragraph
-- and adds the accuracy / completeness / fluency / overall score breakdown
-- used by most pronunciation assessment tools (Azure Pronunciation
-- Assessment, Speechace, etc.), plus words the speaker said that don't
-- correspond to any expected word ("extra_words").

alter table public.pronunciation_attempts
	alter column line_index drop not null;

alter table public.pronunciation_attempts
	add column if not exists scope text not null default 'line',
	add column if not exists completeness_score numeric,
	add column if not exists fluency_score numeric,
	add column if not exists overall_score numeric,
	add column if not exists extra_words jsonb not null default '[]'::jsonb,
	add column if not exists duration_seconds numeric;

alter table public.pronunciation_attempts
	drop constraint if exists pronunciation_attempts_scope_check;
alter table public.pronunciation_attempts
	add constraint pronunciation_attempts_scope_check check (scope in ('line', 'overall'));

-- Backfill so any pre-existing rows (all scope='line', inserted before this
-- migration) still render sensibly under the new multi-score UI.
update public.pronunciation_attempts
set completeness_score = accuracy_score,
	overall_score = accuracy_score
where completeness_score is null;
