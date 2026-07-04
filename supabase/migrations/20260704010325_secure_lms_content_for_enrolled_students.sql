/*
# Secure LMS Content for Enrolled Students

## Purpose
Protect course content (lessons, videos, files, quizzes) so that only enrolled students can access them.
- Course listings remain public (marketing)
- Lessons, videos, files restricted to enrolled students
- Quizzes restricted to enrolled students

## Strategy
- Use student_enrollments table to check access
- Lessons with is_preview=true remain public (free previews)
- All other content requires enrollment check
*/

-- Helper function to check if user is enrolled in a course
CREATE OR REPLACE FUNCTION is_enrolled(course_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM student_enrollments 
    WHERE course_id = course_uuid 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ────────────────────────────────────────
-- UPDATE LESSON POLICIES
-- ────────────────────────────────────────
-- Lessons: Public if preview, otherwise enrolled only
DROP POLICY IF EXISTS "anon_select_lms_lessons" ON lms_lessons;

CREATE POLICY "select_lms_lessons" ON lms_lessons FOR SELECT
TO authenticated
USING (is_preview = true OR is_enrolled(course_id));

CREATE POLICY "select_preview_lms_lessons" ON lms_lessons FOR SELECT
TO anon
USING (is_preview = true);

-- ────────────────────────────────────────
-- UPDATE LESSON FILES POLICIES  
-- ────────────────────────────────────────
-- Files: Only enrolled students can download
DROP POLICY IF EXISTS "anon_select_lms_lesson_files" ON lms_lesson_files;

CREATE POLICY "select_lms_lesson_files" ON lms_lesson_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lms_lessons 
    WHERE lms_lessons.id = lms_lesson_files.lesson_id
    AND (lms_lessons.is_preview = true OR is_enrolled(lms_lessons.course_id))
  )
);

CREATE POLICY "select_preview_lesson_files" ON lms_lesson_files FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM lms_lessons 
    WHERE lms_lessons.id = lms_lesson_files.lesson_id
    AND lms_lessons.is_preview = true
  )
);

-- ────────────────────────────────────────
-- UPDATE QUIZ POLICIES
-- ────────────────────────────────────────
-- Quizzes: Only enrolled students
DROP POLICY IF EXISTS "anon_select_lms_quizzes" ON lms_quizzes;

CREATE POLICY "select_lms_quizzes" ON lms_quizzes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lms_lessons 
    WHERE lms_lessons.id = lms_quizzes.lesson_id
    AND (lms_lessons.is_preview = true OR is_enrolled(lms_lessons.course_id))
  )
);

-- ────────────────────────────────────────
-- UPDATE QUIZ QUESTIONS POLICIES
-- ────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_lms_quiz_questions" ON lms_quiz_questions;

CREATE POLICY "select_lms_quiz_questions" ON lms_quiz_questions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lms_quizzes q
    JOIN lms_lessons l ON l.id = q.lesson_id
    WHERE q.id = lms_quiz_questions.quiz_id
    AND (l.is_preview = true OR is_enrolled(l.course_id))
  )
);

-- ────────────────────────────────────────
-- UPDATE QUIZ OPTIONS POLICIES
-- ────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_lms_quiz_options" ON lms_quiz_options;

CREATE POLICY "select_lms_quiz_options" ON lms_quiz_options FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lms_quiz_questions qq
    JOIN lms_quizzes q ON q.id = qq.quiz_id
    JOIN lms_lessons l ON l.id = q.lesson_id
    WHERE qq.id = lms_quiz_options.question_id
    AND (l.is_preview = true OR is_enrolled(l.course_id))
  )
);

-- ────────────────────────────────────────
-- STORAGE POLICIES UPDATE
-- ────────────────────────────────────────
-- Videos: Only enrolled students or preview lessons
DROP POLICY IF EXISTS "anon_read_course_storage" ON storage.objects;

CREATE POLICY "read_course_videos_enrolled" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-videos' AND (
    -- Check if video belongs to a preview lesson or user is enrolled
    EXISTS (
      SELECT 1 FROM lms_lessons 
      WHERE lms_lessons.video_storage_path = storage.objects.name
      AND (lms_lessons.is_preview = true OR is_enrolled(lms_lessons.course_id))
    )
  )
);

CREATE POLICY "read_course_videos_preview" ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'course-videos' AND (
    EXISTS (
      SELECT 1 FROM lms_lessons 
      WHERE lms_lessons.video_storage_path = storage.objects.name
      AND lms_lessons.is_preview = true
    )
  )
);

-- Files bucket: Enrolled or preview
CREATE POLICY "read_course_files_enrolled" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-files'
);

CREATE POLICY "read_course_files_preview" ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'course-files' AND (
    EXISTS (
      SELECT 1 FROM lms_lesson_files 
      JOIN lms_lessons ON lms_lessons.id = lms_lesson_files.lesson_id
      WHERE lms_lesson_files.storage_path = storage.objects.name
      AND lms_lessons.is_preview = true
    )
  )
);

-- ────────────────────────────────────────
-- UPDATE SECTION POLICIES
-- ────────────────────────────────────────
-- Sections: Show if enrolled or if any lessons are previews
DROP POLICY IF EXISTS "anon_select_lms_sections" ON lms_sections;

CREATE POLICY "select_lms_sections" ON lms_sections FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lms_courses 
    WHERE lms_courses.id = lms_sections.course_id
    AND is_enrolled(lms_courses.id)
  )
  OR EXISTS (
    SELECT 1 FROM lms_lessons 
    WHERE lms_lessons.section_id = lms_sections.id
    AND lms_lessons.is_preview = true
  )
);

CREATE POLICY "select_preview_sections" ON lms_sections FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM lms_lessons 
    WHERE lms_lessons.section_id = lms_sections.id
    AND lms_lessons.is_preview = true
  )
);