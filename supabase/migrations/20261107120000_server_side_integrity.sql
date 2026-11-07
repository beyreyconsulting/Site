/*
# Le serveur tranche ce qui vaut de l'argent ou un diplôme

L'audit du 07/11/2026 a trouvé trois portes que le navigateur ouvrait seul :

1. INSCRIPTION DÉTOURNÉE. La règle `update_own_enrollments` laissait un
   étudiant modifier TOUTE sa ligne d'inscription : inscrit à un cours
   gratuit, il changeait `course_id` pour un cours payant et y accédait.
   -> Il ne peut plus modifier que sa progression (droits par colonne).

2. CERTIFICAT À LA DEMANDE. `insert_own_certificates` laissait un étudiant
   se délivrer un certificat pour n'importe quel cours.
   -> Seule `issue_certificate()` le délivre, si l'étudiant est inscrit, a
      terminé toutes les leçons et réussi tous les quiz du cours.

3. QUIZ NOTÉ PAR L'ÉLÈVE. Les bonnes réponses (`is_correct`) étaient lisibles
   avant de répondre, et le navigateur enregistrait lui-même son score.
   -> `is_correct` n'est plus lisible par les clients ; `submit_quiz()` note
      côté serveur, enregistre la tentative et ne rend la correction
      qu'APRÈS. Les admins relisent les réponses via `admin_quiz_questions()`.
*/

-- ─────────────────────────────────────────────────────────────
-- 1. INSCRIPTIONS : la progression seulement
-- ─────────────────────────────────────────────────────────────
REVOKE UPDATE ON student_enrollments FROM anon, authenticated;
GRANT UPDATE (progress_pct, last_accessed_at, completed_at)
  ON student_enrollments TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. CERTIFICATS : délivrés par le serveur, jamais par le client
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "insert_own_certificates" ON certificates;
REVOKE INSERT, UPDATE, DELETE ON certificates FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. QUIZ : les réponses restent au serveur
-- ─────────────────────────────────────────────────────────────
REVOKE SELECT ON lms_quiz_options FROM anon, authenticated;
GRANT SELECT (id, question_id, text, position, created_at)
  ON lms_quiz_options TO anon, authenticated;

DROP POLICY IF EXISTS "insert_own_attempts" ON quiz_attempts;
REVOKE INSERT, UPDATE, DELETE ON quiz_attempts FROM anon, authenticated;

-- Peut-on passer ce quiz ? Inscrit au cours, admin, ou leçon en aperçu.
CREATE OR REPLACE FUNCTION quiz_course(p_quiz_id uuid, OUT course_id uuid,
                                       OUT is_preview boolean, OUT pass_score int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.course_id, COALESCE(l.is_preview, false), q.pass_score
  FROM lms_quizzes q JOIN lms_lessons l ON l.id = q.lesson_id
  WHERE q.id = p_quiz_id;
$$;
REVOKE ALL ON FUNCTION quiz_course(uuid) FROM public, anon, authenticated;

/* Note un quiz. `p_answers` : {"<question_id>": "<option_id>", ...}.
   Rend {score, passed, correct: {"<question_id>": "<bonne option_id>"}}.
   Un visiteur anonyme peut s'essayer sur une leçon en aperçu : il est noté,
   rien n'est enregistré. */
CREATE OR REPLACE FUNCTION submit_quiz(p_quiz_id uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_quiz record;
  v_total int;
  v_correct int;
  v_score int;
  v_passed boolean;
  v_corrige jsonb;
BEGIN
  SELECT * INTO v_quiz FROM quiz_course(p_quiz_id);
  IF v_quiz.course_id IS NULL THEN
    RAISE EXCEPTION 'quiz introuvable' USING ERRCODE = 'P0002';
  END IF;
  IF NOT v_quiz.is_preview AND (v_uid IS NULL OR NOT (
       is_admin(v_uid) OR EXISTS (SELECT 1 FROM student_enrollments
         WHERE student_id = v_uid AND course_id = v_quiz.course_id))) THEN
    RAISE EXCEPTION 'inscription requise' USING ERRCODE = '42501';
  END IF;

  SELECT count(*),
         count(*) FILTER (WHERE o.id IS NOT NULL),
         COALESCE(jsonb_object_agg(qq.id, bonne.id) FILTER (WHERE bonne.id IS NOT NULL), '{}'::jsonb)
    INTO v_total, v_correct, v_corrige
  FROM lms_quiz_questions qq
  LEFT JOIN lms_quiz_options o
    ON o.question_id = qq.id AND o.is_correct
   AND o.id::text = (p_answers ->> qq.id::text)
  LEFT JOIN LATERAL (
    SELECT b.id FROM lms_quiz_options b
    WHERE b.question_id = qq.id AND b.is_correct
    ORDER BY b.position LIMIT 1) bonne ON true
  WHERE qq.quiz_id = p_quiz_id;

  v_score := CASE WHEN v_total = 0 THEN 0
                  ELSE round(v_correct * 100.0 / v_total)::int END;
  v_passed := v_total > 0 AND v_score >= v_quiz.pass_score;

  IF v_uid IS NOT NULL THEN
    INSERT INTO quiz_attempts (student_id, quiz_id, score, passed, answers)
    VALUES (v_uid, p_quiz_id, v_score, v_passed, COALESCE(p_answers, '{}'::jsonb));
  END IF;

  RETURN jsonb_build_object('score', v_score, 'passed', v_passed,
                            'correct', v_corrige);
END; $$;
REVOKE ALL ON FUNCTION submit_quiz(uuid, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION submit_quiz(uuid, jsonb) TO anon, authenticated;

-- Délivre le certificat d'un cours terminé. Idempotent : le rend s'il existe.
CREATE OR REPLACE FUNCTION issue_certificate(p_course_id uuid)
RETURNS certificates
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_cert certificates;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'connexion requise' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_cert FROM certificates
   WHERE student_id = v_uid AND course_id = p_course_id;
  IF FOUND THEN RETURN v_cert; END IF;

  IF NOT EXISTS (SELECT 1 FROM student_enrollments
                  WHERE student_id = v_uid AND course_id = p_course_id) THEN
    RAISE EXCEPTION 'inscription requise' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM lms_lessons WHERE course_id = p_course_id) THEN
    RAISE EXCEPTION 'cours sans leçon' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1 FROM lms_lessons l
    WHERE l.course_id = p_course_id
      AND NOT EXISTS (SELECT 1 FROM lesson_progress p
                       WHERE p.lesson_id = l.id AND p.student_id = v_uid
                         AND p.completed_at IS NOT NULL)) THEN
    RAISE EXCEPTION 'toutes les leçons ne sont pas terminées' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1 FROM lms_quizzes q JOIN lms_lessons l ON l.id = q.lesson_id
    WHERE l.course_id = p_course_id
      AND NOT EXISTS (SELECT 1 FROM quiz_attempts a
                       WHERE a.quiz_id = q.id AND a.student_id = v_uid
                         AND a.passed)) THEN
    RAISE EXCEPTION 'un quiz du cours n''est pas encore réussi' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO certificates (student_id, course_id)
  VALUES (v_uid, p_course_id) RETURNING * INTO v_cert;
  RETURN v_cert;
END; $$;
REVOKE ALL ON FUNCTION issue_certificate(uuid) FROM public;
GRANT EXECUTE ON FUNCTION issue_certificate(uuid) TO authenticated;

-- Édition des quiz par un admin : seule lecture de `is_correct` côté client.
CREATE OR REPLACE FUNCTION admin_quiz_questions(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(qq) || jsonb_build_object('options', COALESCE((
             SELECT jsonb_agg(to_jsonb(o) ORDER BY o.position)
             FROM lms_quiz_options o WHERE o.question_id = qq.id), '[]'::jsonb))
           ORDER BY qq.position)
    FROM lms_quiz_questions qq WHERE qq.quiz_id = p_quiz_id), '[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION admin_quiz_questions(uuid) FROM public;
GRANT EXECUTE ON FUNCTION admin_quiz_questions(uuid) TO authenticated;
