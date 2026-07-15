# Vocab Learning App — Brainstorm & MVP Plan

Status: revised v2 — 2026-07-15 (v1 used a custom Hono/Prisma backend; v2 moves all data +
business logic into Supabase directly, see "Architecture change" below)
New app: `apps/vocab` (in-app product name follows the mockup: **English Access**)

## 1. Background

The user supplied:
- A mobile UI mockup (10 screens) for a vocabulary-learning app ("English Access") with a
  bottom-nav (Home / Material / Quiz / Profile), discourse-based content organization, flashcards,
  quizzes, and a "My Words" save feature.
- Four photos of real course material ("ACCESS-ES / Center for International Language and
  Cultural Studies") covering **Discourse 1: Learning and Doing** and **Discourse 2: Buying and
  Selling**, each with a Topic Vocabulary list, Phrasal Verbs, Word Formation, Word Patterns, and
  Prepositional Phrases, plus a graded exercise/answer-key page for each discourse.

Goal: stand up a new app (FE + data layer) in this monorepo, seeded with real content from the
photos, using the same "silent login" (Supabase anonymous auth) pattern already used by
`apps/platform`.

## 2. Decisions confirmed with the user

| Question | Decision |
|---|---|
| Backend approach (v1) | Extend `apps/api` (Hono + Prisma) with its own Postgres, Supabase used only for auth. |
| Backend approach (v2, current) | Drop the custom backend entirely. All content + per-user data lives in Supabase Postgres, accessed directly from `apps/vocab` via `supabase-js` + Row Level Security -- the same pattern `apps/platform` already uses for its `conversions` table. `apps/api` was reverted back to the unused starter-template stub it was before this feature. Quiz scoring (the one place that needs server-side logic to keep correct answers hidden) is a Supabase Edge Function, `submit-quiz`, mirroring the existing `process-image` function. |
| New app name/location | `apps/vocab` |
| Discourse 3–5 content | Not in the source material. Seed only Discourse 1 & 2 with real content; Discourse 3 (Working and Business), 4 (Community and Services), 5 (Travel and Leisure) are seeded as row placeholders marked `coming_soon = true` and rendered as locked/"Coming soon" in the UI — no invented vocabulary. |

### Why the v1 → v2 switch

Hosting a standalone Node/Prisma backend for a small MVP means paying for and operating a second
service (Railway/Render/VPS) with its own Postgres, on top of Supabase (needed regardless, for
auth). Since Supabase already provides Postgres + RLS + Edge Functions, folding everything into
one project removes that second service entirely. The trade-off: correct quiz answers can't be
protected by a Hono middleware anymore, so that one piece of "real" server logic moved to an Edge
Function instead.

## 3. Architecture

```
apps/vocab (FE)                              Supabase (hosted/local)
─────────────────                              ────────────────────
Vite + React 19 +                              Auth: signInAnonymously() (silent login)
TanStack Router + Tailwind v4                  Postgres: content tables (public read, RLS)
                                                          + user_word_progress / user_quiz_attempts
ensureAnonymousSession()                                 / user_stats (RLS: auth.uid() = user_id)
(apps/vocab/src/lib/supabase.ts)               Edge Function: submit-quiz (Deno)
        │                                        - service-role client reads quiz_options.is_correct
        ▼                                          (RLS blocks that column-bearing table for every
supabase-js .from(...) calls                        other caller)
  - RLS enforces per-user access                 - inserts user_quiz_attempts, upserts user_stats
  - content tables: select-only for anon/authenticated
```

`apps/api` is unused again (back to its original "Hello Hono" placeholder, same as `apps/admin`).

## 4. Content model (from the material)

Each Discourse has five sub-sections, matching both the mockup and the source pages:

- **Topic Vocabulary** — word + word class (n/v/adj) + meaning + example sentence
- **Phrasal Verbs** — phrase + meaning
- **Word Formation** — base word + derived forms (noun/verb/adjective/adverb variants)
- **Word Patterns** — grouped by part of speech (adjective/verb/noun) + the preposition/pattern
- **Prepositional Phrases** — fixed phrase + meaning
- **Review & Practice** — a quiz drawing questions from the above (multiple choice, matches the
  mockup's Quiz screens)

Transcription note: the photographed pages mix printed text with handwritten Indonesian glosses;
meanings/examples for phrasal verbs & word formation were written in English by us based on the
printed definitions (the material gives definitions, not example sentences, for those sections).
The Topic Vocabulary word lists and Prepositional Phrases are taken directly from the printed
tables. **Please review the seeded content — happy to correct any word** (it's plain SQL in
`supabase/migrations/20260715130100_vocab_seed.sql`, easy to edit and re-run against a fresh
project).

## 5. Data model (Supabase Postgres, `supabase/migrations/20260715130000_vocab_schema.sql`)

```
discourses              id, slug, title, description, order, coming_soon
vocabulary_words        id, discourse_id, word, word_class, meaning, example, order
phrasal_verbs           id, discourse_id, phrase, meaning, order
word_formation_entries  id, discourse_id, base_word, order
word_formation_forms    id, entry_id, form, part_of_speech
word_patterns           id, discourse_id, category(ADJECTIVE|VERB|NOUN), pattern, meaning, order
prepositional_phrases   id, discourse_id, phrase, meaning, order
quiz_questions          id, discourse_id, category, prompt, order
quiz_options            id, question_id, text, is_correct   -- no select policy for anyone
quiz_options_public     (view) id, question_id, text        -- what clients actually query

user_word_progress      id, user_id, vocabulary_word_id, learned, saved, updated_at
user_quiz_attempts      id, user_id, discourse_id, score, total, created_at
user_stats              user_id (PK), points, current_streak, last_active_date
```

`user_id` is a real FK to `auth.users(id)` (same database now, unlike the v1 cross-database
design), so RLS policies use `auth.uid() = user_id` exactly like the existing `conversions` table.

Content tables: RLS enabled, `select using (true)` for everyone (read-only reference data, only
migrations write to them). `quiz_options` deliberately has no policy at all -- it's readable only
by the `submit-quiz` Edge Function's service-role client. `quiz_options_public` is a view owned by
the migration role that re-exposes `id, question_id, text` (no `is_correct`) to `anon` and
`authenticated`.

## 6. Data access & the one Edge Function

Everything else is a direct `supabase-js` call from `apps/vocab/src/lib/api.ts` (mirrors
`apps/platform/src/lib/api.ts`):
- `listDiscourses` / `getDiscourse` / `listVocabulary` / `listPhrasalVerbs` /
  `listWordFormation` / `listWordPatterns` / `listPrepositionalPhrases` / `getQuiz` — plain
  `select()` calls (some client-side aggregation for progress counts, dataset is small).
- `setWordLearned` / `setWordSaved` — `upsert()` into `user_word_progress`.
- `listMyWords` / `getMyStats` — `select()` with embedded foreign-table joins.

`submitQuiz(slug, answers)` calls `supabase.functions.invoke("submit-quiz", ...)`. The function
(`supabase/functions/submit-quiz/index.ts`):
1. Verifies the caller's JWT via a Supabase client scoped to the request's `Authorization` header.
2. Uses a **service-role** client (bypasses RLS) to look up the correct options, since
   `quiz_options` is intentionally unreadable by anyone else.
3. Scores the answers, inserts a `user_quiz_attempts` row, and upserts `user_stats` (points +
   streak, same day/yesterday/reset logic as the v1 Hono version).
4. Returns `{ score, total, accuracy, results }`.

## 7. FE screens — MVP scope

Unchanged from v1 (only the data layer moved):
1. Home — streak/points, "continue learning" card, discourse list w/ progress
2. Select Discourse (D1 & D2 unlocked, D3–5 shown locked/"coming soon")
3. Discourse detail — progress bar + list of 5 sub-sections
4. Vocabulary flashcard viewer (word/class/meaning/example, next/prev, mark learned)
5. Phrasal Verbs / Word Formation / Word Patterns / Prepositional Phrases — same card-list UI,
   reused component, different field mapping
6. Review & Practice quiz — multiple choice, progress bar, submit
7. Quiz result — score, accuracy, back to discourse
8. Word detail + "Add to My Words"

Backlog (not MVP): Profile screen detail, My Words dedicated tab polish, audio pronunciation
playback (mockup shows a speaker icon — no audio asset source provided), spaced-repetition
scheduling, streak-break notifications.

## 8. Silent login flow

Identical mechanism to `apps/platform/src/lib/supabase.ts`:
1. On app load, `ensureAnonymousSession()` calls `supabase.auth.getSession()`; if empty, calls
   `supabase.auth.signInAnonymously()`.
2. Every `supabase-js` call (`.from(...)`, `.functions.invoke(...)`) automatically attaches the
   current session's access token; RLS policies key off `auth.uid()` directly. No separate
   signup/login UI — matches "silent login seperti fonetik app".

## 9. Deploying

- `apps/vocab`: Vercel project (git-connected), Root Directory = `apps/vocab`, same as
  `apps/platform`. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Supabase: `supabase db push` (migrations) + `supabase functions deploy submit-quiz` — both
  already wired into `.github/workflows/deployment.yml`'s `deploy-supabase` job. One extra secret
  needed once, via the Supabase dashboard/CLI: `supabase secrets set
  SUPABASE_SERVICE_ROLE_KEY=...` (the function needs it to read `quiz_options.is_correct`).
- No separate backend host needed at all.

## 10. Open items / assumptions to flag

- No audio files/TTS provider specified — pronunciation playback button is stubbed as disabled in
  MVP.
- Some vocabulary entries are best-effort transcriptions of handwritten annotations — flagged
  above, easy to correct later via the seed migration since it's the single source of truth.
- Local verification in this environment used a plain (non-Supabase) Postgres with a stubbed
  `auth` schema to check migration SQL and RLS behavior, plus `deno check` for the Edge Function --
  there was no Docker available to run the real `supabase start` stack, so the first real
  end-to-end test happens against an actual Supabase project.
