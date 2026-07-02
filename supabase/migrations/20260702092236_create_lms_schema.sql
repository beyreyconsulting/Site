/*
# LMS Schema — Beyrey Consulting

## Purpose
Full Learning Management System supporting:
- Dynamic course/section/lesson management by admin
- Video lessons stored in Supabase Storage
- Downloadable course files and exercises per lesson
- Multiple-choice quizzes per lesson with correct answer tracking
- Student Q&A per lesson with instructor responses
- Supabase Storage buckets for videos and files

## New Tables
1. `lms_courses` — Published courses with metadata
2. `lms_sections` — Ordered sections within a course
3. `lms_lessons` — Individual lessons inside a section (video + metadata)
4. `lms_lesson_files` — Downloadable files attached to a lesson
5. `lms_quizzes` — Quiz for a lesson
6. `lms_quiz_questions` — Questions inside a quiz
7. `lms_quiz_options` — Answer options for each question
8. `lms_qa` — Student questions for a lesson
9. `lms_qa_answers` — Answers to student questions

## Security
- RLS enabled on all tables.
- All policies use `TO anon, authenticated` — admin is protected at UI level (password modal),
  not at DB level, to avoid requiring Supabase auth for a single-admin system.
- Q&A answers also allow anon INSERT so students can interact without accounts.

## Storage
- Bucket `course-videos`: public, max 4 GB, video MIME types only
- Bucket `course-files`: public, max 500 MB, all types
*/

-- ────────────────────────────────────────
-- COURSES
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  price integer NOT NULL DEFAULT 0,
  original_price integer,
  category text,
  level text DEFAULT 'Débutant',
  icon text DEFAULT '📚',
  color text DEFAULT '#C8971A',
  thumbnail_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lms_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lms_courses" ON lms_courses;
CREATE POLICY "anon_select_lms_courses" ON lms_courses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lms_courses" ON lms_courses;
CREATE POLICY "anon_insert_lms_courses" ON lms_courses FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lms_courses" ON lms_courses;
CREATE POLICY "anon_update_lms_courses" ON lms_courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lms_courses" ON lms_courses;
CREATE POLICY "anon_delete_lms_courses" ON lms_courses FOR DELETE TO anon, authenticated USING (true);

-- ────────────────────────────────────────
-- SECTIONS
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lms_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lms_sections" ON lms_sections;
CREATE POLICY "anon_select_lms_sections" ON lms_sections FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lms_sections" ON lms_sections;
CREATE POLICY "anon_insert_lms_sections" ON lms_sections FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lms_sections" ON lms_sections;
CREATE POLICY "anon_update_lms_sections" ON lms_sections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lms_sections" ON lms_sections;
CREATE POLICY "anon_delete_lms_sections" ON lms_sections FOR DELETE TO anon, authenticated USING (true);

-- ────────────────────────────────────────
-- LESSONS
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES lms_sections(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text,
  video_storage_path text,
  duration_seconds integer,
  is_preview boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lms_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lms_lessons" ON lms_lessons;
CREATE POLICY "anon_select_lms_lessons" ON lms_lessons FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lms_lessons" ON lms_lessons;
CREATE POLICY "anon_insert_lms_lessons" ON lms_lessons FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lms_lessons" ON lms_lessons;
CREATE POLICY "anon_update_lms_lessons" ON lms_lessons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lms_lessons" ON lms_lessons;
CREATE POLICY "anon_delete_lms_lessons" ON lms_lessons FOR DELETE TO anon, authenticated USING (true);

-- ────────────────────────────────────────
-- LESSON FILES
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms_lesson_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lms_lessons(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  storage_path text,
  size_bytes bigint,
  mime_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lms_lesson_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lms_lesson_files" ON lms_lesson_files;
CREATE POLICY "anon_select_lms_lesson_files" ON lms_lesson_files FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lms_lesson_files" ON lms_lesson_files;
CREATE POLICY "anon_insert_lms_lesson_files" ON lms_lesson_files FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lms_lesson_files" ON lms_lesson_files;
CREATE POLICY "anon_delete_lms_lesson_files" ON lms_lesson_files FOR DELETE TO anon, authenticated USING (true);

-- ────────────────────────────────────────
-- QUIZZES
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lms_lessons(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Quiz',
  pass_score integer NOT NULL DEFAULT 70,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lms_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lms_quizzes" ON lms_quizzes;
CREATE POLICY "anon_select_lms_quizzes" ON lms_quizzes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lms_quizzes" ON lms_quizzes;
CREATE POLICY "anon_insert_lms_quizzes" ON lms_quizzes FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lms_quizzes" ON lms_quizzes;
CREATE POLICY "anon_update_lms_quizzes" ON lms_quizzes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lms_quizzes" ON lms_quizzes;
CREATE POLICY "anon_delete_lms_quizzes" ON lms_quizzes FOR DELETE TO anon, authenticated USING (true);

-- ────────────────────────────────────────
-- QUIZ QUESTIONS
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES lms_quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  explanation text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lms_quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lms_quiz_questions" ON lms_quiz_questions;
CREATE POLICY "anon_select_lms_quiz_questions" ON lms_quiz_questions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lms_quiz_questions" ON lms_quiz_questions;
CREATE POLICY "anon_insert_lms_quiz_questions" ON lms_quiz_questions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lms_quiz_questions" ON lms_quiz_questions;
CREATE POLICY "anon_update_lms_quiz_questions" ON lms_quiz_questions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lms_quiz_questions" ON lms_quiz_questions;
CREATE POLICY "anon_delete_lms_quiz_questions" ON lms_quiz_questions FOR DELETE TO anon, authenticated USING (true);

-- ────────────────────────────────────────
-- QUIZ OPTIONS
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms_quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES lms_quiz_questions(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lms_quiz_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lms_quiz_options" ON lms_quiz_options;
CREATE POLICY "anon_select_lms_quiz_options" ON lms_quiz_options FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lms_quiz_options" ON lms_quiz_options;
CREATE POLICY "anon_insert_lms_quiz_options" ON lms_quiz_options FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lms_quiz_options" ON lms_quiz_options;
CREATE POLICY "anon_update_lms_quiz_options" ON lms_quiz_options FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lms_quiz_options" ON lms_quiz_options;
CREATE POLICY "anon_delete_lms_quiz_options" ON lms_quiz_options FOR DELETE TO anon, authenticated USING (true);

-- ────────────────────────────────────────
-- Q&A QUESTIONS
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lms_lessons(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text,
  question text NOT NULL,
  is_answered boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lms_qa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lms_qa" ON lms_qa;
CREATE POLICY "anon_select_lms_qa" ON lms_qa FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lms_qa" ON lms_qa;
CREATE POLICY "anon_insert_lms_qa" ON lms_qa FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lms_qa" ON lms_qa;
CREATE POLICY "anon_update_lms_qa" ON lms_qa FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lms_qa" ON lms_qa;
CREATE POLICY "anon_delete_lms_qa" ON lms_qa FOR DELETE TO anon, authenticated USING (true);

-- ────────────────────────────────────────
-- Q&A ANSWERS
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms_qa_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qa_id uuid NOT NULL REFERENCES lms_qa(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Ibrahim Seydou',
  answer text NOT NULL,
  is_from_instructor boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lms_qa_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lms_qa_answers" ON lms_qa_answers;
CREATE POLICY "anon_select_lms_qa_answers" ON lms_qa_answers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lms_qa_answers" ON lms_qa_answers;
CREATE POLICY "anon_insert_lms_qa_answers" ON lms_qa_answers FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lms_qa_answers" ON lms_qa_answers;
CREATE POLICY "anon_delete_lms_qa_answers" ON lms_qa_answers FOR DELETE TO anon, authenticated USING (true);

-- ────────────────────────────────────────
-- STORAGE BUCKETS
-- ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('course-videos', 'course-videos', true, 4294967296,
   ARRAY['video/mp4','video/webm','video/ogg','video/quicktime','video/x-msvideo','video/mpeg']),
  ('course-files', 'course-files', true, 524288000, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
DROP POLICY IF EXISTS "anon_read_course_storage" ON storage.objects;
CREATE POLICY "anon_read_course_storage" ON storage.objects FOR SELECT
TO anon, authenticated USING (bucket_id IN ('course-videos','course-files'));

DROP POLICY IF EXISTS "anon_insert_course_storage" ON storage.objects;
CREATE POLICY "anon_insert_course_storage" ON storage.objects FOR INSERT
TO anon, authenticated WITH CHECK (bucket_id IN ('course-videos','course-files'));

DROP POLICY IF EXISTS "anon_delete_course_storage" ON storage.objects;
CREATE POLICY "anon_delete_course_storage" ON storage.objects FOR DELETE
TO anon, authenticated USING (bucket_id IN ('course-videos','course-files'));
