# Vocab Learning App — Brainstorm & MVP Plan

Status: draft v1 — 2026-07-15
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

Goal: stand up a new app (FE + BE) in this monorepo, seeded with real content from the photos,
using the same "silent login" (Supabase anonymous auth) pattern already used by `apps/platform`.

## 2. Decisions already confirmed with the user

| Question | Decision |
|---|---|
| Backend approach | Extend `apps/api` (Hono + Prisma) with its own Postgres. Supabase is used **only** for anonymous auth (silent login); the FE sends the Supabase access token to the Hono API, which verifies it and uses the `sub` claim as the user id. Content + progress live in the API's own DB. |
| New app name/location | `apps/vocab` |
| Discourse 3–5 content | Not in the source material. Seed only Discourse 1 & 2 with real content; Discourse 3 (Working and Business), 4 (Community and Services), 5 (Travel and Leisure) are seeded as row placeholders marked `comingSoon: true` and rendered as locked/"Coming soon" in the UI — no invented vocabulary. |

## 3. Architecture

```
apps/vocab (FE)                     apps/api (BE)                  Supabase (hosted/local)
─────────────────                   ───────────────                 ────────────────────
Vite + React 19 +                   Hono + Prisma 7                  Auth only:
TanStack Router +                   own Postgres (docker-compose)    - signInAnonymously()
Tailwind v4                                                          - issues JWT (sub = user id)
                                                                     
ensureAnonymousSession() ────────▶  Authorization: Bearer <jwt>
(copied from platform/lib/supabase)  │
                                     ▼
                              verifySupabaseJwt middleware
                              (HS256, SUPABASE_JWT_SECRET)
                                     │
                                     ▼
                              Hono routes ──▶ Prisma ──▶ Postgres
                              (content tables + per-user progress
                               keyed by supabaseUserId, no FK — different DB)
```

Why this split: it matches what the user confirmed (real BE, not just Supabase tables), reuses
the exact silent-login mechanism already proven in `apps/platform`, and keeps `apps/api`'s
existing Prisma/Postgres setup (currently an empty schema) as the actual home for this app's data
instead of introducing a second parallel content store in Supabase.

`SUPABASE_JWT_SECRET` is added to `apps/api`'s env. For local dev this is the standard Supabase
CLI default (`super-secret-jwt-token-with-at-least-32-characters-long`); in production it's the
project's real JWT secret from the Supabase dashboard.

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
tables. **Please review the seeded content once it exists — happy to correct any word.**

## 5. Data model (Prisma, `apps/api`)

```
Discourse          id, slug, title, description, order, comingSoon
VocabularyWord      id, discourseId, word, wordClass, meaning, example, order
PhrasalVerb         id, discourseId, phrase, meaning, order
WordFormationEntry  id, discourseId, baseWord, order
WordFormationForm   id, entryId, form, partOfSpeech
WordPattern         id, discourseId, category(ADJECTIVE|VERB|NOUN), pattern, meaning, order
PrepositionalPhrase id, discourseId, phrase, meaning, order
QuizQuestion        id, discourseId, category, prompt, order
QuizOption          id, questionId, text, isCorrect

UserWordProgress    id, supabaseUserId, vocabularyWordId, learned, saved, updatedAt
UserQuizAttempt     id, supabaseUserId, discourseId, score, total, createdAt
UserStats           supabaseUserId (PK), points, currentStreak, lastActiveDate
```

`supabaseUserId` is stored as a plain `uuid` string column (no FK — it lives in Supabase's auth
schema, a different database).

## 6. API surface (Hono)

Public (content) — no auth required, but auth optional to merge in per-user progress:
- `GET /discourses`
- `GET /discourses/:slug`
- `GET /discourses/:slug/vocabulary`
- `GET /discourses/:slug/phrasal-verbs`
- `GET /discourses/:slug/word-formation`
- `GET /discourses/:slug/word-patterns`
- `GET /discourses/:slug/prepositional-phrases`
- `GET /discourses/:slug/quiz`

Authenticated (requires verified Supabase JWT):
- `POST /words/:id/learned` `{ learned: boolean }`
- `POST /words/:id/save` `{ saved: boolean }`
- `GET /my-words`
- `POST /discourses/:slug/quiz/submit` `{ answers: [...] }` → score + updates `UserStats`
- `GET /me/stats`

## 7. FE screens — MVP scope

In scope for MVP (v1, matches core mockup flow end-to-end):
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
2. Every API call attaches `Authorization: Bearer <access_token>` from the current Supabase
   session.
3. Hono middleware verifies the JWT signature (`SUPABASE_JWT_SECRET`, HS256) and expiry, reads
   `sub` as the user id. No separate signup/login UI — matches "silent login seperti fonetik app".

## 9. Build order

1. ✅ This plan
2. Prisma schema + `seed.ts` for `apps/api` (Discourse 1 & 2 real content, D3–5 stubs)
3. Hono routes + JWT middleware
4. `apps/vocab` scaffold (copied from `apps/platform` Vite/TanStack/Tailwind setup) + silent login
5. Wire MVP screens to the API, smoke-test the flow end to end

## 10. Open items / assumptions to flag

- No audio files/TTS provider specified — pronunciation playback button is stubbed as disabled in
  MVP.
- Assumed local dev only for now (docker-compose Postgres + local Supabase); production secrets
  are out of scope for this pass.
- Some vocabulary entries are best-effort transcriptions of handwritten annotations — flagged
  above, easy to correct later via the seed file since it's the single source of truth.
