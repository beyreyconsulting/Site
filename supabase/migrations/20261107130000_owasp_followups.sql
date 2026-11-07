/*
# Contrôle OWASP du 07/11/2026 : ce que la première passe n'avait pas fermé

1. EMAILS DES ÉLÈVES LISIBLES PAR TOUS (A01). `lms_qa` était lisible par
   n'importe quel visiteur, `author_email` compris.
   -> `author_email` n'est plus lisible par les clients ; les admins relisent
      les questions par `admin_lms_questions()`.

2. QUESTIONS SOUS UN FAUX NOM (A01/A06). N'importe quel visiteur postait,
   avec l'email qu'il voulait.
   -> Il faut être connecté et inscrit au cours (ou sur une leçon en aperçu) ;
      l'email est celui du compte, posé par le serveur.

3. STATISTIQUES SANS LIMITE (A06). `analytics_events` acceptait n'importe
   quelle taille : de quoi remplir les 500 Mo de l'offre gratuite.
   -> Tailles bornées.

4. EMAIL DE COMMANDE FOURNI PAR LE CLIENT (A01). L'admin confirmait un
   paiement au vu d'un email que l'élève avait pu inventer.
   -> L'email vient du compte.
*/

-- 1 + 2. Questions des élèves ───────────────────────────────────────────
REVOKE SELECT ON lms_qa FROM anon, authenticated;
GRANT SELECT (id, lesson_id, author_name, question, is_answered, created_at)
  ON lms_qa TO anon, authenticated;

DROP POLICY IF EXISTS "anon_insert_lms_qa" ON lms_qa;
CREATE POLICY "enrolled_insert_lms_qa" ON lms_qa FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM lms_lessons l
  WHERE l.id = lms_qa.lesson_id
    AND (COALESCE(l.is_preview, false) OR is_enrolled(l.course_id)
         OR is_admin(auth.uid()))));
REVOKE INSERT ON lms_qa FROM anon;

CREATE OR REPLACE FUNCTION lms_qa_author_from_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.author_email := (SELECT email FROM auth.users WHERE id = auth.uid());
  NEW.author_name := left(btrim(COALESCE(NEW.author_name, '')), 80);
  NEW.question := left(btrim(COALESCE(NEW.question, '')), 2000);
  IF NEW.author_name = '' OR NEW.question = '' THEN
    RAISE EXCEPTION 'nom et question requis' USING ERRCODE = '23514';
  END IF;
  NEW.is_answered := false;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_lms_qa_author ON lms_qa;
CREATE TRIGGER trg_lms_qa_author BEFORE INSERT ON lms_qa
  FOR EACH ROW EXECUTE FUNCTION lms_qa_author_from_account();

CREATE OR REPLACE FUNCTION admin_lms_questions(p_lesson_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(q) || jsonb_build_object('answers', COALESCE((
             SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at)
             FROM lms_qa_answers a WHERE a.qa_id = q.id), '[]'::jsonb))
           ORDER BY q.created_at DESC)
    FROM lms_qa q WHERE q.lesson_id = p_lesson_id), '[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION admin_lms_questions(uuid) FROM public;
GRANT EXECUTE ON FUNCTION admin_lms_questions(uuid) TO authenticated;

-- 3. Statistiques bornées ───────────────────────────────────────────────
ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_event_court CHECK (char_length(event) <= 64),
  ADD CONSTRAINT analytics_path_court CHECK (path IS NULL OR char_length(path) <= 300),
  ADD CONSTRAINT analytics_payload_petit CHECK (payload IS NULL OR pg_column_size(payload) <= 2048);

-- 4. Email de commande pris du compte ───────────────────────────────────
CREATE OR REPLACE FUNCTION order_email_from_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.student_email := (SELECT email FROM auth.users WHERE id = NEW.student_id);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_order_email ON orders;
CREATE TRIGGER trg_order_email BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION order_email_from_account();
