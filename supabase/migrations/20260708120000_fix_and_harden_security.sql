/*
# Fix & Harden Security — Beyrey Consulting

## Purpose
Correct broken enrollment check and close the open-write holes introduced by the
"TO anon ... WITH CHECK (true)" policies.

## Changes
1. Fix `is_enrolled()` — referenced non-existent column `user_id` (table uses `student_id`).
2. New `admins` table + `is_admin()` / `is_current_user_admin()` helpers.
3. Restrict every LMS write policy (INSERT/UPDATE/DELETE) and Storage write to admins only.
4. Q&A: keep public question INSERT, restrict answers + moderation to admins.
5. Remove client-side self-enrollment (paid content was enrollable for free).
   Enrollment is now created server-side by the `enroll` Edge Function (service role).

## Post-deploy (REQUIRED)
- Create an admin user in Supabase Auth, then:
    INSERT INTO admins (user_id) VALUES ('<auth-user-uuid>');
- Set Edge Function secrets: ANTHROPIC_API_KEY (see functions/kalan).
*/

-- ────────────────────────────────────────
-- 1. FIX is_enrolled (student_id, not user_id)
-- ────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_enrolled(course_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM student_enrollments
    WHERE course_id = course_uuid
    AND student_id = auth.uid()
  );
$$;

-- ────────────────────────────────────────
-- 2. ADMINS + helpers
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_self" ON admins;
CREATE POLICY "admin_select_self" ON admins FOR SELECT
TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = uid);
$$;

-- Callable from the client to gate the admin UI.
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon;

-- ────────────────────────────────────────
-- 3. LMS WRITE POLICIES → admin only
-- ────────────────────────────────────────

-- COURSES
DROP POLICY IF EXISTS "anon_insert_lms_courses" ON lms_courses;
DROP POLICY IF EXISTS "anon_update_lms_courses" ON lms_courses;
DROP POLICY IF EXISTS "anon_delete_lms_courses" ON lms_courses;
CREATE POLICY "admin_insert_lms_courses" ON lms_courses FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_lms_courses" ON lms_courses FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_lms_courses" ON lms_courses FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- SECTIONS
DROP POLICY IF EXISTS "anon_insert_lms_sections" ON lms_sections;
DROP POLICY IF EXISTS "anon_update_lms_sections" ON lms_sections;
DROP POLICY IF EXISTS "anon_delete_lms_sections" ON lms_sections;
CREATE POLICY "admin_insert_lms_sections" ON lms_sections FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_lms_sections" ON lms_sections FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_lms_sections" ON lms_sections FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- LESSONS
DROP POLICY IF EXISTS "anon_insert_lms_lessons" ON lms_lessons;
DROP POLICY IF EXISTS "anon_update_lms_lessons" ON lms_lessons;
DROP POLICY IF EXISTS "anon_delete_lms_lessons" ON lms_lessons;
CREATE POLICY "admin_insert_lms_lessons" ON lms_lessons FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_lms_lessons" ON lms_lessons FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_lms_lessons" ON lms_lessons FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- LESSON FILES
DROP POLICY IF EXISTS "anon_insert_lms_lesson_files" ON lms_lesson_files;
DROP POLICY IF EXISTS "anon_delete_lms_lesson_files" ON lms_lesson_files;
CREATE POLICY "admin_insert_lms_lesson_files" ON lms_lesson_files FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_lms_lesson_files" ON lms_lesson_files FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- QUIZZES
DROP POLICY IF EXISTS "anon_insert_lms_quizzes" ON lms_quizzes;
DROP POLICY IF EXISTS "anon_update_lms_quizzes" ON lms_quizzes;
DROP POLICY IF EXISTS "anon_delete_lms_quizzes" ON lms_quizzes;
CREATE POLICY "admin_insert_lms_quizzes" ON lms_quizzes FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_lms_quizzes" ON lms_quizzes FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_lms_quizzes" ON lms_quizzes FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- QUIZ QUESTIONS
DROP POLICY IF EXISTS "anon_insert_lms_quiz_questions" ON lms_quiz_questions;
DROP POLICY IF EXISTS "anon_update_lms_quiz_questions" ON lms_quiz_questions;
DROP POLICY IF EXISTS "anon_delete_lms_quiz_questions" ON lms_quiz_questions;
CREATE POLICY "admin_insert_lms_quiz_questions" ON lms_quiz_questions FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_lms_quiz_questions" ON lms_quiz_questions FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_lms_quiz_questions" ON lms_quiz_questions FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- QUIZ OPTIONS
DROP POLICY IF EXISTS "anon_insert_lms_quiz_options" ON lms_quiz_options;
DROP POLICY IF EXISTS "anon_update_lms_quiz_options" ON lms_quiz_options;
DROP POLICY IF EXISTS "anon_delete_lms_quiz_options" ON lms_quiz_options;
CREATE POLICY "admin_insert_lms_quiz_options" ON lms_quiz_options FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_lms_quiz_options" ON lms_quiz_options FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_lms_quiz_options" ON lms_quiz_options FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Q&A: keep public question submission, restrict moderation/answers to admins
DROP POLICY IF EXISTS "anon_update_lms_qa" ON lms_qa;
DROP POLICY IF EXISTS "anon_delete_lms_qa" ON lms_qa;
CREATE POLICY "admin_update_lms_qa" ON lms_qa FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_lms_qa" ON lms_qa FOR DELETE TO authenticated USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "anon_insert_lms_qa_answers" ON lms_qa_answers;
DROP POLICY IF EXISTS "anon_delete_lms_qa_answers" ON lms_qa_answers;
CREATE POLICY "admin_insert_lms_qa_answers" ON lms_qa_answers FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_lms_qa_answers" ON lms_qa_answers FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- ────────────────────────────────────────
-- 4. STORAGE WRITE → admin only
-- ────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_course_storage" ON storage.objects;
DROP POLICY IF EXISTS "anon_delete_course_storage" ON storage.objects;
CREATE POLICY "admin_insert_course_storage" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id IN ('course-videos','course-files') AND is_admin(auth.uid()));
CREATE POLICY "admin_delete_course_storage" ON storage.objects FOR DELETE
TO authenticated USING (bucket_id IN ('course-videos','course-files') AND is_admin(auth.uid()));

-- ────────────────────────────────────────
-- 4b. TIGHTEN course-files READ (was: any authenticated user)
-- Only enrolled students (or preview lessons, or admins) may read files.
-- ────────────────────────────────────────
DROP POLICY IF EXISTS "read_course_files_enrolled" ON storage.objects;
CREATE POLICY "read_course_files_enrolled" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-files' AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM lms_lesson_files f
      JOIN lms_lessons l ON l.id = f.lesson_id
      WHERE f.storage_path = storage.objects.name
      AND (l.is_preview = true OR is_enrolled(l.course_id))
    )
  )
);

-- ────────────────────────────────────────
-- 5. BLOCK FREE SELF-ENROLLMENT
-- Enrollment is created server-side (service role) by the `enroll` Edge Function
-- after payment verification. No direct client INSERT.
-- ────────────────────────────────────────
DROP POLICY IF EXISTS "insert_own_enrollments" ON student_enrollments;
