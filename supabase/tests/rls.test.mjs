// npm run test:rls — à relancer après CHAQUE migration.
// Banc d'essai : toutes les migrations du site sur un Postgres jetable (PGlite),
// avec le minimum de Supabase (rôles, auth.uid(), stockage), puis chaque
// attaque de l'audit rejouée sous le rôle d'un vrai client.
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import fs from "node:fs";
import path from "node:path";

const DOSSIER = process.argv[2] || new URL("../migrations", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const SANS = process.argv[3] || ""; // migration à omettre (preuve que les tests portent)
const db = new PGlite({ extensions: { pgcrypto } });

await db.exec(`
  -- Comme chez Supabase : pgcrypto dans le schema extensions, HORS du search_path.
  -- Un appel non qualifié (gen_random_bytes) y échoue, ici aussi.
  CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto SCHEMA extensions;
  CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
  CREATE SCHEMA auth; CREATE SCHEMA storage;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]);
  CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id text, name text, owner uuid, created_at timestamptz DEFAULT now());
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
  GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
  GRANT ALL ON storage.objects, storage.buckets TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
`);

for (const f of fs.readdirSync(DOSSIER).filter((f) => f.endsWith(".sql")).sort()) {
  if (SANS && f.includes(SANS)) { console.log("  (omise)", f); continue; }
  try { await db.exec(fs.readFileSync(path.join(DOSSIER, f), "utf8")); }
  catch (e) { console.log("MIGRATION EN ÉCHEC", f, "→", e.message); process.exit(2); }
}
console.log("migrations appliquées");

// ── Données : un cours gratuit, un payant (2 leçons, 1 quiz), deux élèves, un admin
const U = { eleve: "11111111-1111-1111-1111-111111111111",
            autre: "22222222-2222-2222-2222-222222222222",
            admin: "33333333-3333-3333-3333-333333333333" };
await db.exec(`
  INSERT INTO auth.users (id, email) VALUES
   ('${U.eleve}','e@x.ml'),('${U.autre}','a@x.ml'),('${U.admin}','ad@x.ml');
  INSERT INTO admins (user_id) VALUES ('${U.admin}');
`);
const ins = async (sql) => (await db.query(sql)).rows[0];
const cols = (await db.query(`SELECT column_name FROM information_schema.columns
  WHERE table_name='lms_courses'`)).rows.map((r) => r.column_name);
const coursSql = (titre, prix) => `INSERT INTO lms_courses (${cols.includes("slug") ? "slug," : ""}title, price)
  VALUES (${cols.includes("slug") ? `'${titre}',` : ""}'${titre}', ${prix}) RETURNING id`;
const gratuit = (await ins(coursSql("gratuit", 0))).id;
const payant = (await ins(coursSql("payant", 75000))).id;
const section = (await ins(`INSERT INTO lms_sections (course_id, title) VALUES ('${payant}','S') RETURNING id`)).id;
const lecon = async (titre, apercu) => (await ins(`INSERT INTO lms_lessons (course_id, section_id, title, is_preview)
  VALUES ('${payant}','${section}','${titre}',${apercu}) RETURNING id`)).id;
const l1 = await lecon("L1", true), l2 = await lecon("L2", false);
const quiz = (await ins(`INSERT INTO lms_quizzes (lesson_id, title, pass_score) VALUES ('${l2}','Q',70) RETURNING id`)).id;
const question = (await ins(`INSERT INTO lms_quiz_questions (quiz_id, question, position) VALUES ('${quiz}','2+2 ?',0) RETURNING id`)).id;
const bonne = (await ins(`INSERT INTO lms_quiz_options (question_id, text, is_correct, position) VALUES ('${question}','4',true,0) RETURNING id`)).id;
const fausse = (await ins(`INSERT INTO lms_quiz_options (question_id, text, is_correct, position) VALUES ('${question}','5',false,1) RETURNING id`)).id;
const quizApercu = (await ins(`INSERT INTO lms_quizzes (lesson_id, title, pass_score) VALUES ('${l1}','QA',50) RETURNING id`)).id;
const qa = (await ins(`INSERT INTO lms_quiz_questions (quiz_id, question, position) VALUES ('${quizApercu}','1+1 ?',0) RETURNING id`)).id;
const bonneA = (await ins(`INSERT INTO lms_quiz_options (question_id, text, is_correct, position) VALUES ('${qa}','2',true,0) RETURNING id`)).id;
// L'élève a commandé le cours gratuit : la commande payée l'inscrit (trigger).
await db.exec(`INSERT INTO orders (student_id, student_email, course_id) VALUES ('${U.eleve}','e@x.ml','${gratuit}')`);

// ── Exécuter sous un rôle client
async function comme(qui, sql, params = []) {
  await db.exec(`RESET ROLE`);
  await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [qui ? U[qui] : ""]);
  await db.exec(`SET ROLE ${qui ? "authenticated" : "anon"}`);
  try { return { ok: true, rows: (await db.query(sql, params)).rows }; }
  catch (e) { return { ok: false, err: e.message }; }
  finally { await db.exec(`RESET ROLE`); }
}

let echecs = 0;
function verifie(nom, cond, detail = "") {
  console.log(`${cond ? "OK  " : "ÉCHEC"} ${nom}${cond ? "" : "  → " + detail}`);
  if (!cond) echecs++;
}

// 1. Inscription détournée
let r = await comme("eleve", `UPDATE student_enrollments SET course_id=$1 WHERE student_id=$2 RETURNING id`, [payant, U.eleve]);
verifie("un élève ne bascule pas son inscription sur un cours payant", !r.ok || r.rows.length === 0, JSON.stringify(r));
r = await comme("eleve", `UPDATE student_enrollments SET progress_pct=40, last_accessed_at=now() WHERE student_id=$1 RETURNING progress_pct`, [U.eleve]);
verifie("il met toujours à jour sa progression", r.ok && r.rows[0]?.progress_pct === 40, JSON.stringify(r));
r = await comme("eleve", `INSERT INTO student_enrollments (student_id, course_id) VALUES ($1,$2)`, [U.eleve, payant]);
verifie("il ne s'inscrit pas lui-même au cours payant", !r.ok, JSON.stringify(r));

// 2. Certificat à la demande
r = await comme("eleve", `INSERT INTO certificates (student_id, course_id) VALUES ($1,$2)`, [U.eleve, payant]);
verifie("un élève ne se délivre pas de certificat", !r.ok, JSON.stringify(r));
r = await comme("eleve", `SELECT issue_certificate($1)`, [payant]);
verifie("pas de certificat sans inscription", !r.ok && /inscription/.test(r.err), JSON.stringify(r));

// 3. Quiz noté par l'élève
r = await comme("eleve", `SELECT is_correct FROM lms_quiz_options`);
verifie("les bonnes réponses ne se lisent pas", !r.ok, JSON.stringify(r));
r = await comme("autre", `SELECT id, text FROM lms_quiz_options WHERE question_id=$1`, [qa]);
verifie("le texte des options d'un aperçu reste lisible (connecté)", r.ok && r.rows.length === 1, JSON.stringify(r));
r = await comme("eleve", `INSERT INTO quiz_attempts (student_id, quiz_id, score, passed, answers) VALUES ($1,$2,100,true,'{}')`, [U.eleve, quiz]);
verifie("un élève n'écrit pas son propre score", !r.ok, JSON.stringify(r));
r = await comme("eleve", `SELECT submit_quiz($1, $2)`, [quiz, { [question]: bonne }]);
verifie("pas de quiz d'un cours payant sans inscription", !r.ok && /inscription/.test(r.err), JSON.stringify(r));
r = await comme(null, `SELECT submit_quiz($1, $2) AS res`, [quizApercu, { [qa]: bonneA }]);
verifie("un visiteur s'essaie au quiz d'aperçu", r.ok && r.rows[0].res.passed === true, JSON.stringify(r));

// L'admin confirme le paiement du cours payant → inscription
await db.exec(`INSERT INTO orders (student_id, student_email, course_id) VALUES ('${U.eleve}','e@x.ml','${payant}')`);
await db.exec(`UPDATE orders SET status='paid' WHERE course_id='${payant}'`);
r = await comme("eleve", `SELECT submit_quiz($1, $2) AS res`, [quiz, { [question]: fausse }]);
verifie("une mauvaise réponse échoue, notée par le serveur",
  r.ok && r.rows[0].res.score === 0 && r.rows[0].res.passed === false && r.rows[0].res.correct[question] === bonne, JSON.stringify(r));
r = await comme("eleve", `SELECT issue_certificate($1)`, [payant]);
verifie("pas de certificat tant que les leçons ne sont pas finies", !r.ok && /leçons/.test(r.err), JSON.stringify(r));
for (const l of [l1, l2]) {
  const p = await comme("eleve", `INSERT INTO lesson_progress (student_id, lesson_id, completed_at) VALUES ($1,$2,now())`, [U.eleve, l]);
  verifie("l'élève marque une leçon terminée", p.ok, JSON.stringify(p));
}
r = await comme("eleve", `SELECT issue_certificate($1)`, [payant]);
verifie("pas de certificat tant que le quiz n'est pas réussi", !r.ok && /quiz/.test(r.err), JSON.stringify(r));
r = await comme("eleve", `SELECT submit_quiz($1, $2) AS res`, [quiz, { [question]: bonne }]);
verifie("la bonne réponse réussit", r.ok && r.rows[0].res.score === 100 && r.rows[0].res.passed, JSON.stringify(r));
r = await comme("eleve", `SELECT submit_quiz($1, $2) AS res`, [quizApercu, { [qa]: bonneA }]);
verifie("il réussit aussi le quiz de la leçon d'aperçu", r.ok && r.rows[0].res.passed, JSON.stringify(r));
r = await comme("eleve", `SELECT (issue_certificate($1)).certificate_number AS n`, [payant]);
verifie("le cours terminé donne son certificat", r.ok && /^CERT-/.test(r.rows[0].n), JSON.stringify(r));
const r2 = await comme("eleve", `SELECT (issue_certificate($1)).certificate_number AS n`, [payant]);
verifie("le redemander rend le même certificat", r2.ok && r2.rows[0].n === r.rows[0]?.n, JSON.stringify(r2));

// 4. Édition admin
r = await comme("eleve", `SELECT admin_quiz_questions($1)`, [quiz]);
verifie("un élève ne lit pas le corrigé par la fonction admin", !r.ok, JSON.stringify(r));
r = await comme("admin", `SELECT admin_quiz_questions($1) AS q`, [quiz]);
verifie("l'admin relit les bonnes réponses", r.ok && r.rows[0].q[0].options.some((o) => o.is_correct), JSON.stringify(r));
r = await comme("admin", `INSERT INTO lms_quiz_options (question_id, text, is_correct, position) VALUES ($1,'6',false,2)`, [question]);
verifie("l'admin ajoute toujours des options", r.ok, JSON.stringify(r));

// 5. Contrôle OWASP : questions, statistiques, commandes
r = await comme(null, `INSERT INTO lms_qa (lesson_id, author_name, author_email, question) VALUES ($1,'Bot','x@y.z','spam')`, [l2]);
verifie("un visiteur anonyme ne poste pas de question", !r.ok, JSON.stringify(r));
r = await comme("autre", `INSERT INTO lms_qa (lesson_id, author_name, question) VALUES ($1,'Autre','?')`, [l2]);
verifie("un non-inscrit ne poste pas sur une leçon payante", !r.ok, JSON.stringify(r));
r = await comme("eleve", `INSERT INTO lms_qa (lesson_id, author_name, author_email, question) VALUES ($1,'Élève','usurpe@z.ml','Bonne question') RETURNING id`, [l2]);
verifie("un inscrit pose sa question", r.ok, JSON.stringify(r));
const email = (await db.query(`SELECT author_email FROM lms_qa WHERE author_name='Élève'`)).rows[0]?.author_email;
verifie("l'email est celui du compte, pas celui tapé", email === "e@x.ml", email);
r = await comme(null, `SELECT author_email FROM lms_qa`);
verifie("les emails des élèves ne se lisent pas", !r.ok, JSON.stringify(r));
r = await comme(null, `SELECT author_name, question FROM lms_qa`);
verifie("les questions restent lisibles", r.ok && r.rows.length >= 1, JSON.stringify(r));
r = await comme("admin", `SELECT admin_lms_questions($1) AS q`, [l2]);
verifie("l'admin relit les emails", r.ok && r.rows[0].q[0]?.author_email === "e@x.ml", JSON.stringify(r));
r = await comme(null, `INSERT INTO analytics_events (event, payload) VALUES ('clic', $1)`, [{ x: "a".repeat(5000) }]);
verifie("une statistique géante est refusée", !r.ok, JSON.stringify(r));
r = await comme(null, `INSERT INTO analytics_events (event, payload, path) VALUES ('clic', '{"a":1}', '/')`);
verifie("une statistique normale passe", r.ok, JSON.stringify(r));
r = await comme("autre", `INSERT INTO orders (student_id, student_email, course_id) VALUES ($1,'faux@z.ml',$2) RETURNING student_email`, [U.autre, payant]);
verifie("l'email d'une commande est celui du compte", r.ok && r.rows[0]?.student_email === "a@x.ml", JSON.stringify(r));

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
