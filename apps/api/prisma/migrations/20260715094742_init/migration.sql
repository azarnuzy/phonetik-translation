-- CreateEnum
CREATE TYPE "WordPatternCategory" AS ENUM ('ADJECTIVE', 'VERB', 'NOUN');

-- CreateEnum
CREATE TYPE "QuizCategory" AS ENUM ('TOPIC_VOCABULARY', 'PHRASAL_VERB', 'WORD_FORMATION', 'WORD_PATTERN', 'PREPOSITIONAL_PHRASE');

-- CreateTable
CREATE TABLE "discourses" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "comingSoon" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discourses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_words" (
    "id" TEXT NOT NULL,
    "discourseId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "wordClass" TEXT,
    "meaning" TEXT NOT NULL,
    "example" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "vocabulary_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phrasal_verbs" (
    "id" TEXT NOT NULL,
    "discourseId" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "phrasal_verbs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_formation_entries" (
    "id" TEXT NOT NULL,
    "discourseId" TEXT NOT NULL,
    "baseWord" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "word_formation_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_formation_forms" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "partOfSpeech" TEXT NOT NULL,

    CONSTRAINT "word_formation_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_patterns" (
    "id" TEXT NOT NULL,
    "discourseId" TEXT NOT NULL,
    "category" "WordPatternCategory" NOT NULL,
    "pattern" TEXT NOT NULL,
    "meaning" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "word_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prepositional_phrases" (
    "id" TEXT NOT NULL,
    "discourseId" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "prepositional_phrases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "discourseId" TEXT NOT NULL,
    "category" "QuizCategory" NOT NULL,
    "prompt" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_word_progress" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "vocabularyWordId" TEXT NOT NULL,
    "learned" BOOLEAN NOT NULL DEFAULT false,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_word_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quiz_attempts" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "discourseId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stats" (
    "supabaseUserId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("supabaseUserId")
);

-- CreateIndex
CREATE UNIQUE INDEX "discourses_slug_key" ON "discourses"("slug");

-- CreateIndex
CREATE INDEX "vocabulary_words_discourseId_idx" ON "vocabulary_words"("discourseId");

-- CreateIndex
CREATE INDEX "phrasal_verbs_discourseId_idx" ON "phrasal_verbs"("discourseId");

-- CreateIndex
CREATE INDEX "word_formation_entries_discourseId_idx" ON "word_formation_entries"("discourseId");

-- CreateIndex
CREATE INDEX "word_formation_forms_entryId_idx" ON "word_formation_forms"("entryId");

-- CreateIndex
CREATE INDEX "word_patterns_discourseId_idx" ON "word_patterns"("discourseId");

-- CreateIndex
CREATE INDEX "prepositional_phrases_discourseId_idx" ON "prepositional_phrases"("discourseId");

-- CreateIndex
CREATE INDEX "quiz_questions_discourseId_idx" ON "quiz_questions"("discourseId");

-- CreateIndex
CREATE INDEX "quiz_options_questionId_idx" ON "quiz_options"("questionId");

-- CreateIndex
CREATE INDEX "user_word_progress_supabaseUserId_idx" ON "user_word_progress"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "user_word_progress_supabaseUserId_vocabularyWordId_key" ON "user_word_progress"("supabaseUserId", "vocabularyWordId");

-- CreateIndex
CREATE INDEX "user_quiz_attempts_supabaseUserId_idx" ON "user_quiz_attempts"("supabaseUserId");

-- CreateIndex
CREATE INDEX "user_quiz_attempts_discourseId_idx" ON "user_quiz_attempts"("discourseId");

-- AddForeignKey
ALTER TABLE "vocabulary_words" ADD CONSTRAINT "vocabulary_words_discourseId_fkey" FOREIGN KEY ("discourseId") REFERENCES "discourses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phrasal_verbs" ADD CONSTRAINT "phrasal_verbs_discourseId_fkey" FOREIGN KEY ("discourseId") REFERENCES "discourses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_formation_entries" ADD CONSTRAINT "word_formation_entries_discourseId_fkey" FOREIGN KEY ("discourseId") REFERENCES "discourses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_formation_forms" ADD CONSTRAINT "word_formation_forms_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "word_formation_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_patterns" ADD CONSTRAINT "word_patterns_discourseId_fkey" FOREIGN KEY ("discourseId") REFERENCES "discourses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prepositional_phrases" ADD CONSTRAINT "prepositional_phrases_discourseId_fkey" FOREIGN KEY ("discourseId") REFERENCES "discourses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_discourseId_fkey" FOREIGN KEY ("discourseId") REFERENCES "discourses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_word_progress" ADD CONSTRAINT "user_word_progress_vocabularyWordId_fkey" FOREIGN KEY ("vocabularyWordId") REFERENCES "vocabulary_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_attempts" ADD CONSTRAINT "user_quiz_attempts_discourseId_fkey" FOREIGN KEY ("discourseId") REFERENCES "discourses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
