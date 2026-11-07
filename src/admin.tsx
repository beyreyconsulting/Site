import { useState, useEffect, useRef, useCallback } from "react";
import { C, F, btn, textOn } from "./data.tsx";
import { supabase } from "./supabase";

/* ─────────────── TYPES ─────────────── */
interface Course { id: string; title: string; subtitle: string; description: string; price: number; original_price: number; category: string; level: string; icon: string; color: string; thumbnail_url: string; is_published: boolean; }
interface Section { id: string; course_id: string; title: string; position: number; }
interface Lesson { id: string; section_id: string; course_id: string; title: string; description: string; video_url: string; video_storage_path: string; duration_seconds: number; is_preview: boolean; position: number; }
interface LessonFile { id: string; lesson_id: string; name: string; file_url: string; storage_path?: string; size_bytes: number; mime_type: string; }
interface Quiz { id: string; lesson_id: string; title: string; pass_score: number; }
interface Question { id: string; quiz_id: string; question: string; explanation: string; position: number; options: Option[]; }
interface Option { id: string; question_id: string; text: string; is_correct: boolean; position: number; }
interface QA { id: string; lesson_id: string; author_name: string; author_email: string; question: string; is_answered: boolean; created_at: string; answers: QAAnswer[]; }
interface QAAnswer { id: string; qa_id: string; author_name: string; answer: string; is_from_instructor: boolean; created_at: string; }

/* ─────────────── HELPERS ─────────────── */
const genUUID = () => crypto.randomUUID();
function Toast({ msg, type, onDismiss }: { msg: string; type: "ok" | "err"; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: type === "ok" ? C.grn : C.red, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,.4)", display: "flex", alignItems: "center", gap: 10 }}>
      {type === "ok" ? "✓" : "✕"} {msg}
    </div>
  );
}
const fmtBytes = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;
const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const LEVELS = ["Débutant", "Intermédiaire", "Expert"];
const CATS = ["Power BI", "Excel", "Gouvernance", "Python", "SQL", "Data Analytics"];
const COLORS = ["#C8971A", "#00C896", "#2062E8", "#E060C0", "#F08040", "#00B884"];
const ICONS = ["📊", "📗", "🏛️", "🐍", "🗄️", "🎯", "📈", "🔍", "⚙️", "🎓", "📋", "💡"];

/* ─────────────── INPUT COMPONENT ─────────────── */
function Field({ label, value, onChange, placeholder, type = "text", textarea = false, required = false }:
  { label: string; value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string; textarea?: boolean; required?: boolean }) {
  const style: React.CSSProperties = {
    width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 8,
    padding: "10px 12px", color: C.t, fontSize: 13, fontFamily: F.sans, outline: "none", boxSizing: "border-box", resize: "vertical" as const,
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontFamily: F.mono, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </div>
      {textarea
        ? <textarea value={String(value)} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={style} />
        : <input type={type} value={String(value)} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />}
    </div>
  );
}

/* ─────────────── ADMIN LOGIN (real Supabase Auth + is_admin check) ─────────────── */
function AdminLogin({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setLoading(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pw });
    if (error) { setErr("Identifiants incorrects"); setLoading(false); return; }
    const { data: isAdmin } = await supabase.rpc("is_current_user_admin");
    if (!isAdmin) { await supabase.auth.signOut(); setErr("Compte non autorisé"); setLoading(false); return; }
    setLoading(false);
    onAuth();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 20, padding: 40, width: 360, boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.gold}18`, border: `1px solid ${C.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔐</div>
          <div>
            <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 600, color: "#fff" }}>Espace Éditeur</div>
            <div style={{ fontSize: 11, color: C.t2, fontFamily: F.mono }}>Beyrey Consulting LMS</div>
          </div>
        </div>
        <Field label="Email admin" value={email} onChange={setEmail} type="email" placeholder="admin@beyrey.consulting" />
        <Field label="Mot de passe" value={pw} onChange={setPw} type="password" placeholder="••••••••••••" />
        {err && <div style={{ fontSize: 12, color: C.red, marginBottom: 12 }}>{err}</div>}
        <button onClick={submit} disabled={loading}
          style={btn({ width: "100%", background: "linear-gradient(135deg,#C8971A,#E0A820)", color: C.bg, padding: 13, borderRadius: 10, fontWeight: 800, fontSize: 14 })}>
          {loading ? "Connexion…" : "Accéder au panneau →"}
        </button>
        <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: C.t3 }}>
          <a href="#" onClick={e => { e.preventDefault(); window.location.hash = ""; }} style={{ color: C.t2, textDecoration: "none" }}>← Retour au site</a>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── PROGRESS BAR ─────────────── */
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ background: C.bdr, borderRadius: 4, height: 6, overflow: "hidden", marginTop: 8 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: C.gold, borderRadius: 4, transition: "width .2s" }} />
    </div>
  );
}

/* ─────────────── VIDEO UPLOADER ─────────────── */
function VideoUploader({ lessonId, currentUrl, onSaved }: { lessonId: string; currentUrl: string; onSaved: (url: string, path: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const upload = async (file: File) => {
    if (!file || !file.type.startsWith("video/")) { setToast({ msg: "Fichier vidéo requis (MP4, WebM…)", type: "err" }); return; }
    setUploading(true);
    setProgress(10);
    const path = `lessons/${lessonId}/${genUUID()}.${file.name.split(".").pop()}`;
    setProgress(30);
    const { data, error } = await supabase.storage.from("course-videos").upload(path, file, { upsert: true });
    if (error) { setToast({ msg: `Erreur upload: ${error.message}`, type: "err" }); setUploading(false); return; }
    setProgress(80);
    const { data: urlData } = supabase.storage.from("course-videos").getPublicUrl(data.path);
    await supabase.from("lms_lessons").update({ video_url: urlData.publicUrl, video_storage_path: data.path }).eq("id", lessonId);
    setProgress(100);
    onSaved(urlData.publicUrl, data.path);
    setToast({ msg: "Vidéo uploadée avec succès !", type: "ok" });
    setUploading(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [lessonId]);

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      {currentUrl && (
        <div style={{ marginBottom: 12, background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>🎬</span>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 12, color: C.grn, fontWeight: 700 }}>Vidéo active</div>
            <div style={{ fontSize: 10, color: C.t3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUrl}</div>
          </div>
        </div>
      )}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{ border: `2px dashed ${drag ? C.gold : C.bdr}`, borderRadius: 12, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: drag ? `${C.gold}08` : "transparent", transition:"background-color .2s ease, border-color .2s ease, color .2s ease, box-shadow .2s ease, transform .2s cubic-bezier(.23,1,.32,1)" }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t, marginBottom: 4 }}>
          {uploading ? "Upload en cours…" : "Glisser-déposer ou cliquer pour uploader"}
        </div>
        <div style={{ fontSize: 11, color: C.t2 }}>MP4, WebM, MOV — max 4 GB</div>
        {uploading && <ProgressBar pct={progress} />}
      </div>
      <input ref={inputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </div>
  );
}

/* ─────────────── FILES MANAGER ─────────────── */
function FilesManager({ lessonId }: { lessonId: string }) {
  const [files, setFiles] = useState<LessonFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("lms_lesson_files").select("*").eq("lesson_id", lessonId);
    setFiles(data || []);
  };
  useEffect(() => { load(); }, [lessonId]);

  const upload = async (file: File) => {
    setUploading(true); setProgress(20);
    const path = `lessons/${lessonId}/${genUUID()}-${file.name}`;
    const { data, error } = await supabase.storage.from("course-files").upload(path, file, { upsert: true });
    if (error) { setToast({ msg: `Erreur: ${error.message}`, type: "err" }); setUploading(false); return; }
    setProgress(70);
    const { data: urlData } = supabase.storage.from("course-files").getPublicUrl(data.path);
    await supabase.from("lms_lesson_files").insert({ lesson_id: lessonId, name: file.name, file_url: urlData.publicUrl, storage_path: data.path, size_bytes: file.size, mime_type: file.type });
    setProgress(100);
    setToast({ msg: `${file.name} ajouté !`, type: "ok" });
    setUploading(false);
    load();
  };

  const remove = async (f: LessonFile) => {
    if (!confirm(`Supprimer "${f.name}" ?`)) return;
    if (f.storage_path) await supabase.storage.from("course-files").remove([f.storage_path]);
    await supabase.from("lms_lesson_files").delete().eq("id", f.id);
    load();
  };

  const fileIcon = (m: string) => m?.includes("pdf") ? "📄" : m?.includes("word") || m?.includes("document") ? "📝" : m?.includes("sheet") || m?.includes("excel") ? "📊" : m?.includes("zip") || m?.includes("rar") ? "📦" : "📎";

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>
          + Ajouter fichier
        </button>
        {uploading && <ProgressBar pct={progress} />}
      </div>
      <input ref={inputRef} type="file" multiple style={{ display: "none" }}
        onChange={e => { Array.from(e.target.files || []).forEach(upload); e.target.value = ""; }} />
      {files.length === 0 && <div style={{ fontSize: 12, color: C.t3, padding: "10px 0" }}>Aucun fichier. Ajoutez des cours, exercices, PDF…</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {files.map(f => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "8px 12px" }}>
            <span style={{ fontSize: 18 }}>{fileIcon(f.mime_type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
              <div style={{ fontSize: 10, color: C.t2 }}>{f.size_bytes ? fmtBytes(f.size_bytes) : ""}</div>
            </div>
            <button onClick={() => remove(f)} style={btn({ background: `${C.red}18`, color: C.red, padding: "4px 8px", borderRadius: 6, fontSize: 11, border: `1px solid ${C.red}30` })}>Suppr.</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── QUIZ BUILDER ─────────────── */
function QuizBuilder({ lessonId }: { lessonId: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [quizForm, setQuizForm] = useState({ title: "Quiz de la leçon", pass_score: 70 });

  const load = async () => {
    const { data: qz } = await supabase.from("lms_quizzes").select("*").eq("lesson_id", lessonId).maybeSingle();
    setQuiz(qz);
    if (qz) {
      // `is_correct` n'est lisible que par admin_quiz_questions() (réservée aux admins).
      const { data: qs } = await supabase.rpc("admin_quiz_questions", { p_quiz_id: qz.id });
      setQuestions((qs || []).map((q: any) => ({ ...q, options: (q.options || []).sort((a: Option, b: Option) => a.position - b.position) })));
      setQuizForm({ title: qz.title, pass_score: qz.pass_score });
    }
  };
  useEffect(() => { load(); }, [lessonId]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      id: `new-${Date.now()}`, quiz_id: quiz?.id || "", question: "", explanation: "", position: prev.length,
      options: [
        { id: `o1-${Date.now()}`, question_id: "", text: "", is_correct: true, position: 0 },
        { id: `o2-${Date.now()}`, question_id: "", text: "", is_correct: false, position: 1 },
      ]
    }]);
  };

  const removeQuestion = (idx: number) => setQuestions(prev => prev.filter((_, i) => i !== idx));

  const addOption = (qIdx: number) => {
    setQuestions(prev => prev.map((q, i) => i !== qIdx ? q : {
      ...q, options: [...q.options, { id: `o${Date.now()}`, question_id: "", text: "", is_correct: false, position: q.options.length }]
    }));
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions(prev => prev.map((q, i) => i !== qIdx ? q : { ...q, options: q.options.filter((_, j) => j !== oIdx) }));
  };

  const setCorrect = (qIdx: number, oIdx: number) => {
    setQuestions(prev => prev.map((q, i) => i !== qIdx ? q : {
      ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oIdx }))
    }));
  };

  const save = async () => {
    setSaving(true);
    let qzId = quiz?.id;
    if (!qzId) {
      const { data } = await supabase.from("lms_quizzes").insert({ lesson_id: lessonId, title: quizForm.title, pass_score: quizForm.pass_score }).select().single();
      qzId = data?.id;
      setQuiz(data);
    } else {
      await supabase.from("lms_quizzes").update({ title: quizForm.title, pass_score: quizForm.pass_score }).eq("id", qzId);
    }
    for (const q of questions) {
      let qId = q.id;
      if (qId.startsWith("new-")) {
        const { data } = await supabase.from("lms_quiz_questions").insert({ quiz_id: qzId, question: q.question, explanation: q.explanation, position: q.position }).select().single();
        qId = data?.id;
      } else {
        await supabase.from("lms_quiz_questions").update({ question: q.question, explanation: q.explanation, position: q.position }).eq("id", qId);
        await supabase.from("lms_quiz_options").delete().eq("question_id", qId);
      }
      for (let j = 0; j < q.options.length; j++) {
        await supabase.from("lms_quiz_options").insert({ question_id: qId, text: q.options[j].text, is_correct: q.options[j].is_correct, position: j });
      }
    }
    setSaving(false);
    setToast({ msg: "Quiz sauvegardé !", type: "ok" });
    load();
  };

  const deleteQuiz = async () => {
    if (!quiz || !confirm("Supprimer ce quiz ?")) return;
    await supabase.from("lms_quizzes").delete().eq("id", quiz.id);
    setQuiz(null); setQuestions([]);
    setToast({ msg: "Quiz supprimé", type: "ok" });
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12, marginBottom: 16 }}>
        <Field label="Titre du quiz" value={quizForm.title} onChange={v => setQuizForm(f => ({ ...f, title: v }))} />
        <Field label="Score min (%)" value={quizForm.pass_score} onChange={v => setQuizForm(f => ({ ...f, pass_score: parseInt(v) || 0 }))} type="number" />
      </div>

      {questions.map((q, qi) => (
        <div key={q.id} style={{ background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontFamily: F.mono, color: C.gold }}>QUESTION {qi + 1}</div>
            <button onClick={() => removeQuestion(qi)} style={btn({ background: `${C.red}18`, color: C.red, padding: "3px 8px", borderRadius: 6, fontSize: 11, border: `1px solid ${C.red}30` })}>Suppr.</button>
          </div>
          <Field label="Question" value={q.question} onChange={v => setQuestions(prev => prev.map((x, i) => i === qi ? { ...x, question: v } : x))} placeholder="Ex: Quel est le rôle du DAX dans Power BI ?" />
          <Field label="Explication (affiché après réponse)" value={q.explanation} onChange={v => setQuestions(prev => prev.map((x, i) => i === qi ? { ...x, explanation: v } : x))} placeholder="Optionnel — explique la bonne réponse" />
          <div style={{ fontSize: 10, fontFamily: F.mono, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Options (cochez la bonne réponse)</div>
          {q.options.map((opt, oi) => (
            <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <input type="radio" name={`q-${qi}`} checked={opt.is_correct} onChange={() => setCorrect(qi, oi)} style={{ accentColor: C.gold, width: 16, height: 16, cursor: "pointer" }} />
              <input value={opt.text} onChange={e => setQuestions(prev => prev.map((x, i) => i !== qi ? x : { ...x, options: x.options.map((o, j) => j === oi ? { ...o, text: e.target.value } : o) }))}
                placeholder={`Option ${oi + 1}`}
                style={{ flex: 1, background: opt.is_correct ? `${C.grn}12` : C.bg, border: `1px solid ${opt.is_correct ? C.grn : C.bdr}`, borderRadius: 7, padding: "7px 10px", color: C.t, fontSize: 12, fontFamily: F.sans, outline: "none" }} />
              {q.options.length > 2 && <button onClick={() => removeOption(qi, oi)} style={btn({ color: C.t3, background: "none", fontSize: 16, padding: "0 4px" })}>✕</button>}
            </div>
          ))}
          {q.options.length < 5 && (
            <button onClick={() => addOption(qi)} style={btn({ background: "none", color: C.t2, fontSize: 12, padding: "4px 0", border: "none" })}>+ Ajouter une option</button>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={addQuestion} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>+ Question</button>
        <button onClick={save} disabled={saving || questions.length === 0}
          style={btn({ background: questions.length > 0 ? C.gold : C.bdr, color: questions.length > 0 ? C.bg : C.t3, padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 800 })}>
          {saving ? "Sauvegarde…" : "💾 Sauvegarder le quiz"}
        </button>
        {quiz && <button onClick={deleteQuiz} style={btn({ background: `${C.red}18`, color: C.red, padding: "8px 14px", borderRadius: 8, fontSize: 12, border: `1px solid ${C.red}30` })}>Supprimer quiz</button>}
      </div>
    </div>
  );
}

/* ─────────────── Q&A MANAGER ─────────────── */
function QAManager({ lessonId }: { lessonId: string }) {
  const [qas, setQas] = useState<QA[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const load = async () => {
    // author_email n'est lisible que par admin_lms_questions() (réservée aux admins).
    const { data } = await supabase.rpc("admin_lms_questions", { p_lesson_id: lessonId });
    setQas((data || []).map((q: any) => ({ ...q, answers: (q.answers || []).sort((a: QAAnswer, b: QAAnswer) => a.created_at.localeCompare(b.created_at)) })));
  };
  useEffect(() => { load(); }, [lessonId]);

  const reply = async (qa: QA) => {
    const text = replyText[qa.id]?.trim();
    if (!text) return;
    await supabase.from("lms_qa_answers").insert({ qa_id: qa.id, author_name: "Ibrahim Seydou", answer: text, is_from_instructor: true });
    await supabase.from("lms_qa").update({ is_answered: true }).eq("id", qa.id);
    setReplyText(r => ({ ...r, [qa.id]: "" }));
    setToast({ msg: "Réponse envoyée !", type: "ok" });
    load();
  };

  const deleteQA = async (id: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    await supabase.from("lms_qa").delete().eq("id", id);
    load();
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      {qas.length === 0 && <div style={{ fontSize: 13, color: C.t3, padding: "12px 0" }}>Aucune question pour cette leçon.</div>}
      {qas.map(qa => (
        <div key={qa.id} style={{ background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${C.blue}20`, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>
                {qa.author_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.t }}>{qa.author_name}</div>
                <div style={{ fontSize: 10, color: C.t3, fontFamily: F.mono }}>{new Date(qa.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {qa.is_answered && <span style={{ fontSize: 10, color: C.grn, fontFamily: F.mono }}>✓ RÉPONDU</span>}
              <button onClick={() => deleteQA(qa.id)} style={btn({ background: `${C.red}18`, color: C.red, padding: "3px 8px", borderRadius: 6, fontSize: 11, border: `1px solid ${C.red}30` })}>Suppr.</button>
            </div>
          </div>
          <p style={{ fontSize: 13, color: C.t, lineHeight: 1.6, margin: "0 0 12px" }}>{qa.question}</p>
          {qa.answers.map(ans => (
            <div key={ans.id} style={{ marginLeft: 20, background: ans.is_from_instructor ? `${C.gold}10` : C.bg, border: `1px solid ${ans.is_from_instructor ? C.gold + "30" : C.bdr}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: ans.is_from_instructor ? `${C.gold}20` : C.s2, color: ans.is_from_instructor ? C.gold : C.t2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                  {ans.author_name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: ans.is_from_instructor ? C.gold : C.t }}>{ans.author_name}</span>
                {ans.is_from_instructor && <span style={{ fontSize: 9, color: C.gold, fontFamily: F.mono, background: `${C.gold}18`, padding: "2px 6px", borderRadius: 4 }}>FORMATEUR</span>}
              </div>
              <p style={{ fontSize: 12, color: C.t, lineHeight: 1.6, margin: 0 }}>{ans.answer}</p>
            </div>
          ))}
          <div style={{ marginLeft: 20, display: "flex", gap: 8, marginTop: 8 }}>
            <textarea value={replyText[qa.id] || ""} onChange={e => setReplyText(r => ({ ...r, [qa.id]: e.target.value }))}
              placeholder="Votre réponse (formateur)…" rows={2}
              style={{ flex: 1, background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "8px 10px", color: C.t, fontSize: 12, fontFamily: F.sans, outline: "none", resize: "vertical" }} />
            <button onClick={() => reply(qa)} style={btn({ background: C.gold, color: C.bg, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 800 })}>Répondre</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── LESSON EDITOR PANEL ─────────────── */
function LessonEditorPanel({ lesson, onBack, onSaved }: { lesson: Lesson; onBack: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: lesson.title, description: lesson.description || "", duration_seconds: lesson.duration_seconds || 0, is_preview: lesson.is_preview });
  const [videoUrl, setVideoUrl] = useState(lesson.video_url || "");
  const [tab, setTab] = useState<"info" | "video" | "files" | "quiz" | "qa">("video");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const save = async () => {
    await supabase.from("lms_lessons").update({ title: form.title, description: form.description, duration_seconds: form.duration_seconds, is_preview: form.is_preview }).eq("id", lesson.id);
    setToast({ msg: "Leçon sauvegardée !", type: "ok" });
    onSaved();
  };

  const tabs = [
    { id: "video", label: "🎬 Vidéo" },
    { id: "files", label: "📁 Fichiers" },
    { id: "quiz", label: "🧠 Quiz" },
    { id: "qa", label: "💬 Q&A" },
    { id: "info", label: "📝 Infos" },
  ] as const;

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "6px 12px", borderRadius: 8, fontSize: 12 })}>← Retour</button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.t }}>{form.title}</div>
          <div style={{ fontSize: 11, color: C.t3, fontFamily: F.mono }}>Leçon · {videoUrl ? "🎬 Vidéo" : "❌ Pas de vidéo"}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={btn({ background: tab === t.id ? C.gold : C.s2, color: tab === t.id ? C.bg : C.t2, border: `1px solid ${tab === t.id ? C.gold : C.bdr}`, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div>
          <Field label="Titre de la leçon" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} required />
          <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} textarea />
          <Field label="Durée (secondes)" value={form.duration_seconds} onChange={v => setForm(f => ({ ...f, duration_seconds: parseInt(v) || 0 }))} type="number" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <input type="checkbox" id="preview" checked={form.is_preview} onChange={e => setForm(f => ({ ...f, is_preview: e.target.checked }))} style={{ accentColor: C.gold }} />
            <label htmlFor="preview" style={{ fontSize: 13, color: C.t, cursor: "pointer" }}>Leçon accessible gratuitement (aperçu)</label>
          </div>
          <button onClick={save} style={btn({ background: C.gold, color: C.bg, padding: "10px 20px", borderRadius: 8, fontWeight: 800, fontSize: 13 })}>💾 Sauvegarder</button>
        </div>
      )}
      {tab === "video" && <VideoUploader lessonId={lesson.id} currentUrl={videoUrl} onSaved={(url) => setVideoUrl(url)} />}
      {tab === "files" && <FilesManager lessonId={lesson.id} />}
      {tab === "quiz" && <QuizBuilder lessonId={lesson.id} />}
      {tab === "qa" && <QAManager lessonId={lesson.id} />}
    </div>
  );
}

/* ─────────────── SECTION EDITOR ─────────────── */
function SectionEditor({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [editSection, setEditSection] = useState<Partial<Section> | null>(null);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [newLesson, setNewLesson] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const loadSections = async () => {
    const { data } = await supabase.from("lms_sections").select("*").eq("course_id", courseId).order("position");
    setSections(data || []);
  };
  const loadLessons = async (sectionId: string) => {
    const { data } = await supabase.from("lms_lessons").select("*").eq("section_id", sectionId).order("position");
    setLessons(prev => ({ ...prev, [sectionId]: data || [] }));
  };
  useEffect(() => { loadSections(); }, [courseId]);

  const saveSection = async () => {
    if (!editSection?.title?.trim()) return;
    if (editSection.id) {
      await supabase.from("lms_sections").update({ title: editSection.title, position: editSection.position || 0 }).eq("id", editSection.id);
    } else {
      await supabase.from("lms_sections").insert({ course_id: courseId, title: editSection.title, position: sections.length });
    }
    setEditSection(null);
    loadSections();
    setToast({ msg: "Section sauvegardée !", type: "ok" });
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Supprimer cette section et toutes ses leçons ?")) return;
    await supabase.from("lms_sections").delete().eq("id", id);
    loadSections();
  };

  const addLesson = async (sectionId: string) => {
    const title = newLesson[sectionId]?.trim();
    if (!title) return;
    const pos = (lessons[sectionId] || []).length;
    await supabase.from("lms_lessons").insert({ section_id: sectionId, course_id: courseId, title, position: pos });
    setNewLesson(n => ({ ...n, [sectionId]: "" }));
    loadLessons(sectionId);
    setToast({ msg: "Leçon ajoutée !", type: "ok" });
  };

  const deleteLesson = async (id: string, sectionId: string) => {
    if (!confirm("Supprimer cette leçon ?")) return;
    await supabase.from("lms_lessons").delete().eq("id", id);
    loadLessons(sectionId);
  };

  if (editLesson) return <LessonEditorPanel lesson={editLesson} onBack={() => { setEditLesson(null); loadLessons(editLesson.section_id); }} onSaved={() => loadLessons(editLesson.section_id)} />;

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "6px 12px", borderRadius: 8, fontSize: 12 })}>← Retour</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.t }}>Sections & Leçons</div>
      </div>

      {/* Section form */}
      {editSection !== null && (
        <div style={{ background: C.s2, border: `1px solid ${C.gold}30`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Field label="Titre de la section" value={editSection.title || ""} onChange={v => setEditSection(s => ({ ...s, title: v }))} placeholder="Ex: Introduction à Power BI" required />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveSection} style={btn({ background: C.gold, color: C.bg, padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12 })}>Sauvegarder</button>
            <button onClick={() => setEditSection(null)} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "8px 14px", borderRadius: 8, fontSize: 12 })}>Annuler</button>
          </div>
        </div>
      )}

      <button onClick={() => setEditSection({ title: "", position: sections.length })}
        style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 16 })}>
        + Nouvelle section
      </button>

      {sections.length === 0 && <div style={{ fontSize: 13, color: C.t3 }}>Aucune section. Créez-en une pour commencer.</div>}

      {sections.map((sec, si) => (
        <div key={sec.id} style={{ background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer" }}
            onClick={() => { setExpandedSection(expandedSection === sec.id ? null : sec.id); loadLessons(sec.id); }}>
            <span style={{ fontSize: 14, color: C.t3, fontFamily: F.mono, minWidth: 20 }}>{si + 1}.</span>
            <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: C.t }}>{sec.title}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={e => { e.stopPropagation(); setEditSection(sec); }} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "4px 8px", borderRadius: 6, fontSize: 11 })}>Éditer</button>
              <button onClick={e => { e.stopPropagation(); deleteSection(sec.id); }} style={btn({ background: `${C.red}18`, color: C.red, padding: "4px 8px", borderRadius: 6, fontSize: 11, border: `1px solid ${C.red}30` })}>Suppr.</button>
            </div>
            <span style={{ color: C.t2, fontSize: 14 }}>{expandedSection === sec.id ? "▲" : "▼"}</span>
          </div>

          {expandedSection === sec.id && (
            <div style={{ borderTop: `1px solid ${C.bdr}`, padding: 16 }}>
              {(lessons[sec.id] || []).map((les, li) => (
                <div key={les.id} style={{ display: "flex", alignItems: "center", gap: 10, background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: C.t3, fontFamily: F.mono, minWidth: 18 }}>{li + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.t }}>{les.title}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                      {les.video_url && <span style={{ fontSize: 10, color: C.grn, fontFamily: F.mono }}>🎬 Vidéo</span>}
                      {les.duration_seconds > 0 && <span style={{ fontSize: 10, color: C.t3 }}>{fmtSecs(les.duration_seconds)}</span>}
                      {les.is_preview && <span style={{ fontSize: 10, color: C.gold, fontFamily: F.mono }}>Aperçu gratuit</span>}
                    </div>
                  </div>
                  <button onClick={() => setEditLesson(les)} style={btn({ background: C.gold, color: C.bg, padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700 })}>Éditer leçon</button>
                  <button onClick={() => deleteLesson(les.id, sec.id)} style={btn({ background: `${C.red}18`, color: C.red, padding: "5px 8px", borderRadius: 6, fontSize: 11, border: `1px solid ${C.red}30` })}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input value={newLesson[sec.id] || ""} onChange={e => setNewLesson(n => ({ ...n, [sec.id]: e.target.value }))}
                  placeholder="Titre de la nouvelle leçon…" onKeyDown={e => e.key === "Enter" && addLesson(sec.id)}
                  style={{ flex: 1, background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "8px 12px", color: C.t, fontSize: 12, fontFamily: F.sans, outline: "none" }} />
                <button onClick={() => addLesson(sec.id)} style={btn({ background: C.gold, color: C.bg, padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12 })}>+ Ajouter</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────── COURSE FORM ─────────────── */
function CourseForm({ initial, onSave, onCancel }: { initial?: Course; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: initial?.title || "", subtitle: initial?.subtitle || "", description: initial?.description || "",
    price: initial?.price || 0, original_price: initial?.original_price || 0,
    category: initial?.category || CATS[0], level: initial?.level || LEVELS[0],
    icon: initial?.icon || "📊", color: initial?.color || COLORS[0],
    is_published: initial?.is_published || false,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    if (initial?.id) {
      await supabase.from("lms_courses").update({ ...form, updated_at: new Date().toISOString() }).eq("id", initial.id);
    } else {
      await supabase.from("lms_courses").insert(form);
    }
    setSaving(false);
    onSave();
  };

  const f = (k: keyof typeof form) => ({ value: String(form[k]), onChange: (v: string) => setForm(x => ({ ...x, [k]: v })) });

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Titre de la formation" {...f("title")} required />
        <Field label="Sous-titre" {...f("subtitle")} />
      </div>
      <Field label="Description" textarea {...f("description")} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <Field label="Prix (FCFA)" type="number" {...f("price")} />
        <Field label="Prix original (FCFA)" type="number" {...f("original_price")} />
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontFamily: F.mono, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 5 }}>Catégorie</div>
          <select value={form.category} onChange={e => setForm(x => ({ ...x, category: e.target.value }))}
            style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "10px 10px", color: C.t, fontSize: 13, fontFamily: F.sans, outline: "none" }}>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontFamily: F.mono, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 5 }}>Niveau</div>
          <select value={form.level} onChange={e => setForm(x => ({ ...x, level: e.target.value }))}
            style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "10px 10px", color: C.t, fontSize: 13, fontFamily: F.sans, outline: "none" }}>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontFamily: F.mono, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Icône</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ICONS.map(ic => (
            <button key={ic} onClick={() => setForm(x => ({ ...x, icon: ic }))}
              style={btn({ fontSize: 22, padding: "6px 10px", borderRadius: 8, background: form.icon === ic ? `${C.gold}25` : C.s2, border: `2px solid ${form.icon === ic ? C.gold : C.bdr}` })}>
              {ic}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontFamily: F.mono, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Couleur</div>
        <div style={{ display: "flex", gap: 8 }}>
          {COLORS.map(col => (
            <button key={col} onClick={() => setForm(x => ({ ...x, color: col }))}
              style={btn({ width: 32, height: 32, borderRadius: 8, background: col, border: `3px solid ${form.color === col ? "#fff" : "transparent"}`, boxShadow: form.color === col ? `0 0 0 2px ${col}` : "none" })} />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <input type="checkbox" id="pub" checked={form.is_published} onChange={e => setForm(x => ({ ...x, is_published: e.target.checked }))} style={{ accentColor: C.gold }} />
        <label htmlFor="pub" style={{ fontSize: 13, color: C.t, cursor: "pointer" }}>Publier la formation (visible par les apprenants)</label>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={save} disabled={saving || !form.title.trim()}
          style={btn({ background: form.title.trim() ? C.gold : C.bdr, color: form.title.trim() ? C.bg : C.t3, padding: "10px 22px", borderRadius: 10, fontWeight: 800, fontSize: 14 })}>
          {saving ? "Sauvegarde…" : initial ? "💾 Mettre à jour" : "✓ Créer la formation"}
        </button>
        <button onClick={onCancel} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "10px 18px", borderRadius: 10, fontSize: 13 })}>Annuler</button>
      </div>
    </div>
  );
}

/* ─────────────── COURSE LIST ─────────────── */
function CourseList({ onManageSections }: { onManageSections: (c: Course) => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const load = async () => {
    const { data } = await supabase.from("lms_courses").select("*").order("created_at", { ascending: false });
    setCourses(data || []);
  };
  useEffect(() => { load(); }, []);

  const deleteCourse = async (id: string) => {
    if (!confirm("Supprimer cette formation et tout son contenu ?")) return;
    await supabase.from("lms_courses").delete().eq("id", id);
    load();
    setToast({ msg: "Formation supprimée", type: "ok" });
  };

  const togglePublish = async (c: Course) => {
    await supabase.from("lms_courses").update({ is_published: !c.is_published }).eq("id", c.id);
    load();
  };

  if (creating) return <div><div style={{ fontSize: 16, fontWeight: 700, color: C.t, marginBottom: 20 }}>Nouvelle formation</div><CourseForm onSave={() => { setCreating(false); load(); }} onCancel={() => setCreating(false)} /></div>;
  if (editing) return <div><div style={{ fontSize: 16, fontWeight: 700, color: C.t, marginBottom: 20 }}>Modifier : {editing.title}</div><CourseForm initial={editing} onSave={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} /></div>;

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.t }}>Mes formations ({courses.length})</div>
        <button onClick={() => setCreating(true)} style={btn({ background: "linear-gradient(135deg,#C8971A,#E0A820)", color: C.bg, padding: "10px 18px", borderRadius: 10, fontWeight: 800, fontSize: 13 })}>
          + Nouvelle formation
        </button>
      </div>
      {courses.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: C.t3 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 15 }}>Aucune formation. Créez votre première !</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {courses.map(c => (
          <div key={c.id} style={{ background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 14, padding: 18, display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${c.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{c.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                <span style={{ fontSize: 10, color: c.is_published ? C.grn : C.t3, fontFamily: F.mono, background: c.is_published ? `${C.grn}18` : C.s2, padding: "2px 7px", borderRadius: 4, border: `1px solid ${c.is_published ? C.grn + "30" : C.bdr}`, flexShrink: 0 }}>
                  {c.is_published ? "● PUBLIÉ" : "○ BROUILLON"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: C.t2, fontFamily: F.mono }}>
                <span>{c.category}</span><span>·</span><span>{c.level}</span><span>·</span>
                <span style={{ color: C.gold }}>{(c.price || 0).toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button onClick={() => onManageSections(c)} style={btn({ background: `${c.color}18`, color: c.color, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: `1px solid ${c.color}30` })}>📝 Contenu</button>
              <button onClick={() => setEditing(c)} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "6px 12px", borderRadius: 8, fontSize: 11 })}>Éditer</button>
              <button onClick={() => togglePublish(c)} style={btn({ background: c.is_published ? `${C.gold}18` : `${C.grn}18`, color: c.is_published ? C.gold : C.grn, padding: "6px 12px", borderRadius: 8, fontSize: 11, border: `1px solid ${c.is_published ? C.gold + "30" : C.grn + "30"}` })}>
                {c.is_published ? "Dépublier" : "Publier"}
              </button>
              <button onClick={() => deleteCourse(c.id)} style={btn({ background: `${C.red}18`, color: C.red, padding: "6px 12px", borderRadius: 8, fontSize: 11, border: `1px solid ${C.red}30` })}>Suppr.</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── ORDERS MANAGER ─────────────── */
function OrdersManager() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "paid" | "all">("pending");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*, course:course_id(title,icon,color)").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: "paid" | "cancelled") => {
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
  };

  const list = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const badge = (s: string) => s === "paid" ? C.grn : s === "pending" ? C.gold : C.red;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 600, color: "#fff", margin: 0 }}>Commandes</h2>
          <div style={{ fontSize: 12, color: C.t2 }}>Confirmez les paiements mobile money pour débloquer l'accès.</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["pending", "paid", "all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={btn({ background: filter === f ? C.gold : C.s2, color: filter === f ? C.bg : C.t2, border: `1px solid ${filter === f ? C.gold : C.bdr}`, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>
              {f === "pending" ? "En attente" : f === "paid" ? "Payées" : "Toutes"}
            </button>
          ))}
        </div>
      </div>
      {loading ? <div style={{ color: C.t3, padding: 20 }}>Chargement…</div> :
        list.length === 0 ? <div style={{ color: C.t3, padding: 20, textAlign: "center" }}>Aucune commande.</div> :
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map(o => (
              <div key={o.id} style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${o.course?.color || C.gold}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{o.course?.icon || "📚"}</div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.t }}>{o.course?.title || o.course_id}</div>
                  <div style={{ fontSize: 11, color: C.t2, fontFamily: F.mono }}>{o.student_email || o.student_id} · {new Date(o.created_at).toLocaleDateString("fr-FR")}</div>
                </div>
                <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: C.gold }}>{(o.amount || 0).toLocaleString("fr-FR")} F</div>
                <span style={{ fontSize: 10, fontFamily: F.mono, fontWeight: 700, color: badge(o.status), background: `${badge(o.status)}18`, padding: "4px 10px", borderRadius: 6, textTransform: "uppercase" }}>{o.status === "paid" ? "Payée" : o.status === "pending" ? "En attente" : "Annulée"}</span>
                {o.status === "pending" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setStatus(o.id, "paid")} style={btn({ background: C.grn, color: textOn(C.grn), padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>Marquer payé</button>
                    <button onClick={() => setStatus(o.id, "cancelled")} style={btn({ background: `${C.red}18`, color: C.red, border: `1px solid ${C.red}30`, padding: "7px 10px", borderRadius: 8, fontSize: 12 })}>Annuler</button>
                  </div>
                )}
              </div>
            ))}
          </div>}
    </div>
  );
}

/* ─────────────── ADMIN PANEL ROOT ─────────────── */
export function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState<"courses" | "sections" | "orders">("courses");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: isAdmin } = await supabase.rpc("is_current_user_admin");
        setAuthed(!!isAdmin);
      }
      setChecking(false);
    })();
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.bdr}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F.sans }}>
      {/* Top bar */}
      <div style={{ background: C.s1, borderBottom: `1px solid ${C.bdr}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/logo.png" alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
          <div>
            <div style={{ fontFamily: F.serif, fontSize: 17, fontWeight: 600, color: "#fff", lineHeight: 1 }}>Beyrey LMS</div>
            <div style={{ fontFamily: F.mono, fontSize: 9, color: C.gold, letterSpacing: ".15em" }}>ESPACE ÉDITEUR</div>
          </div>
          {selectedCourse && page === "sections" && (
            <>
              <span style={{ color: C.t3 }}>›</span>
              <span style={{ fontSize: 13, color: C.t2, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedCourse.title}</span>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setPage("courses")} style={btn({ background: page !== "orders" ? `${C.gold}18` : "none", color: page !== "orders" ? C.gold : C.t2, border: `1px solid ${page !== "orders" ? C.gold + "30" : C.bdr}`, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>
            Formations
          </button>
          <button onClick={() => setPage("orders")} style={btn({ background: page === "orders" ? `${C.gold}18` : "none", color: page === "orders" ? C.gold : C.t2, border: `1px solid ${page === "orders" ? C.gold + "30" : C.bdr}`, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>
            Commandes
          </button>
          <a href="#" onClick={e => { e.preventDefault(); window.location.hash = ""; }} style={{ fontSize: 12, color: C.t2, textDecoration: "none", background: C.s2, border: `1px solid ${C.bdr}`, padding: "7px 14px", borderRadius: 8 }}>
            ← Site public
          </a>
          <button onClick={async () => { await supabase.auth.signOut(); setAuthed(false); }} style={btn({ background: `${C.red}18`, color: C.red, border: `1px solid ${C.red}30`, padding: "7px 14px", borderRadius: 8, fontSize: 12 })}>
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        {page === "courses" && (
          <CourseList onManageSections={c => { setSelectedCourse(c); setPage("sections"); }} />
        )}
        {page === "sections" && selectedCourse && (
          <SectionEditor courseId={selectedCourse.id} onBack={() => setPage("courses")} />
        )}
        {page === "orders" && <OrdersManager />}
      </div>
    </div>
  );
}
