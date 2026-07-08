import { useState, useEffect, useRef, useCallback } from "react";
import { C, F, btn, clickable, textOn } from "./data.tsx";
import { supabase } from "./supabase";

/* ─────────────── TYPES ─────────────── */
interface Course { id: string; title: string; subtitle: string; description: string; price: number; original_price: number; category: string; level: string; icon: string; color: string; thumbnail_url: string; is_published: boolean; }
interface Section { id: string; course_id: string; title: string; position: number; }
interface Lesson { id: string; section_id: string; course_id: string; title: string; description: string; video_url: string; video_storage_path: string; duration_seconds: number; is_preview: boolean; position: number; }
interface LessonFile { id: string; lesson_id: string; name: string; file_url: string; size_bytes: number; mime_type: string; }
interface Quiz { id: string; lesson_id: string; title: string; pass_score: number; }
interface Question { id: string; quiz_id: string; question: string; explanation: string; position: number; options: Option[]; }
interface Option { id: string; question_id: string; text: string; is_correct: boolean; position: number; }
interface QA { id: string; lesson_id: string; author_name: string; author_email: string; question: string; is_answered: boolean; created_at: string; answers: QAAnswer[]; }
interface QAAnswer { id: string; qa_id: string; author_name: string; answer: string; is_from_instructor: boolean; created_at: string; }
interface LessonProgress { lesson_id: string; completed_at?: string; video_progress_seconds: number; quiz_passed: boolean; }
interface User { id: string; email: string; }

/* ─────────────── HELPERS ─────────────── */
const fmtSecs = (s: number) => { if (!s || s <= 0) return ""; const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${String(sec).padStart(2, "0")}`; };
const fmtBytes = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;
const fileIcon = (m: string) => m?.includes("pdf") ? "📄" : m?.includes("word") || m?.includes("document") ? "📝" : m?.includes("sheet") || m?.includes("excel") ? "📊" : m?.includes("zip") || m?.includes("rar") ? "📦" : "📎";

/* ─────────────── PROGRESS TRACKING HOOK ─────────────── */
function useProgress(user: User | null, courseId: string) {
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(0);

  const loadProgress = useCallback(async () => {
    if (!user || !courseId) return;
    // Get enrollment
    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("id, progress_pct")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();
    if (enrollment) {
      setEnrollmentId(enrollment.id);
      setProgressPct(enrollment.progress_pct || 0);
    }
    // Get lesson progress
    const { data: lp } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed_at, video_progress_seconds, quiz_passed")
      .eq("student_id", user.id);
    const map: Record<string, LessonProgress> = {};
    (lp || []).forEach((p: any) => { map[p.lesson_id] = p; });
    setProgress(map);
  }, [user, courseId]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  const markComplete = async (lessonId: string) => {
    if (!user) return;
    const existing = progress[lessonId];
    if (existing?.completed_at) return; // Already complete

    const { error } = await supabase.from("lesson_progress").upsert({
      student_id: user.id,
      lesson_id: lessonId,
      completed_at: new Date().toISOString(),
      video_progress_seconds: existing?.video_progress_seconds || 0,
      quiz_passed: existing?.quiz_passed || false,
    }, { onConflict: "student_id,lesson_id" });
    if (!error) loadProgress();
  };

  const updateVideoProgress = async (lessonId: string, seconds: number) => {
    if (!user) return;
    const existing = progress[lessonId];
    await supabase.from("lesson_progress").upsert({
      student_id: user.id,
      lesson_id: lessonId,
      video_progress_seconds: seconds,
      completed_at: existing?.completed_at || null,
      quiz_passed: existing?.quiz_passed || false,
    }, { onConflict: "student_id,lesson_id" });
  };

  const markQuizPassed = async (lessonId: string) => {
    if (!user) return;
    const existing = progress[lessonId];
    await supabase.from("lesson_progress").upsert({
      student_id: user.id,
      lesson_id: lessonId,
      video_progress_seconds: existing?.video_progress_seconds || 0,
      completed_at: existing?.completed_at || new Date().toISOString(),
      quiz_passed: true,
    }, { onConflict: "student_id,lesson_id" });
    loadProgress();
  };

  const updateCourseProgress = async (totalLessons: number) => {
    if (!user || !enrollmentId || totalLessons === 0) return;
    const completedLessons = Object.values(progress).filter(p => p.completed_at).length;
    const pct = Math.round((completedLessons / totalLessons) * 100);
    setProgressPct(pct);
    const update: any = { progress_pct: pct, last_accessed_at: new Date().toISOString() };
    if (pct >= 100) update.completed_at = new Date().toISOString();
    await supabase.from("student_enrollments").update(update).eq("id", enrollmentId);
  };

  return { progress, progressPct, markComplete, updateVideoProgress, markQuizPassed, updateCourseProgress, loadProgress, enrollmentId };
}

/* ─────────────── PROTECTED VIDEO PLAYER ─────────────── */
function ProtectedVideoPlayer({ url, isPreview, onComplete, onProgress }: { url: string; isPreview?: boolean; onComplete?: () => void; onProgress?: (seconds: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play();
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    onProgress?.(Math.floor(t));
  };

  const handleEnded = () => {
    setPlaying(false);
    onComplete?.();
  };

  return (
    <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", position: "relative" }}>
      {isPreview && (
        <div style={{ position: "absolute", top: 12, left: 12, background: `${C.grn}20`, color: C.grn, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontFamily: F.mono, fontWeight: 700, zIndex: 10, border: `1px solid ${C.grn}40` }}>
          APERCU GRATUIT
        </div>
      )}

      <video
        ref={videoRef}
        src={url}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={e => e.preventDefault()}
        onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); setLoading(false); }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        style={{ width: "100%", display: "block", background: "#000" }}
      />

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,.85))", padding: "20px 16px 12px" }}>
        <div onClick={seek} style={{ height: 4, background: "rgba(255,255,255,.15)", borderRadius: 4, cursor: "pointer", marginBottom: 10 }}>
          <div style={{ height: "100%", width: `${(currentTime / duration) * 100 || 0}%`, background: C.gold, borderRadius: 4, transition: "width .05s linear" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={togglePlay} style={btn({ background: "none", color: "#fff", fontSize: 18, padding: 4 })}>
            {playing ? "⏸" : "▶"}
          </button>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,.7)" }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>⛶</span>
        </div>
      </div>

      {loading && url && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${C.bdr}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─────────────── QUIZ TAKER ─────────────── */
function QuizTaker({ lessonId, userId, onComplete }: { lessonId: string; userId?: string; onComplete?: () => void }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: qz } = await supabase.from("lms_quizzes").select("*").eq("lesson_id", lessonId).maybeSingle();
      if (!qz) return;
      setQuiz(qz);
      const { data: qs } = await supabase.from("lms_quiz_questions").select("*,options:lms_quiz_options(*)").eq("quiz_id", qz.id).order("position");
      setQuestions((qs || []).map((q: any) => ({ ...q, options: (q.options || []).sort((a: Option, b: Option) => a.position - b.position) })));
    };
    load();
  }, [lessonId]);

  if (!quiz) return null;

  const selectAnswer = (qId: string, oId: string) => {
    if (submitted) return;
    setAnswers(a => ({ ...a, [qId]: oId }));
  };

  const submit = async () => {
    if (submitted) return;
    let correct = 0;
    for (const q of questions) {
      const chosen = q.options.find(o => o.id === answers[q.id]);
      if (chosen?.is_correct) correct++;
    }
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setSubmitted(true);

    // Save attempt
    if (userId) {
      await supabase.from("quiz_attempts").insert({
        student_id: userId,
        quiz_id: quiz.id,
        score: pct,
        passed: pct >= quiz.pass_score,
        answers: answers,
      });
    }

    if (pct >= quiz.pass_score) onComplete?.();
  };

  const passed = score >= quiz.pass_score;

  return (
    <div style={{ background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.gold, letterSpacing: ".1em" }}>QUIZ</div>
          <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 600, color: "#fff" }}>{quiz.title}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: C.t3, fontFamily: F.mono }}>Score minimum</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>{quiz.pass_score}%</div>
        </div>
      </div>

      {submitted && (
        <div style={{ background: passed ? `${C.grn}15` : `${C.red}15`, border: `1px solid ${passed ? C.grn : C.red}30`, borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: passed ? C.grn : C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff" }}>
            {passed ? "✓" : "✕"}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: passed ? C.grn : C.red }}>
              {passed ? "Quiz reussi !" : "Quiz non reussi"}
            </div>
            <div style={{ fontSize: 12, color: C.t2 }}>
              Votre score : <strong style={{ color: passed ? C.grn : C.red, fontSize: 16 }}>{score}%</strong> ({quiz.pass_score}% requis)
            </div>
          </div>
        </div>
      )}

      {questions.map((q) => {
        const userAnswer = answers[q.id];
        const isCorrect = q.options.find(o => o.id === userAnswer)?.is_correct;

        return (
          <div key={q.id} style={{ background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.t }}>{q.question}</div>
              {submitted && (
                <div style={{ background: isCorrect ? `${C.grn}20` : `${C.red}20`, color: isCorrect ? C.grn : C.red, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {isCorrect ? "Correct" : "Incorrect"}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {q.options.map(opt => {
                const isSelected = userAnswer === opt.id;
                const showCorrect = submitted && opt.is_correct;
                return (
                  <button
                    key={opt.id}
                    onClick={() => selectAnswer(q.id, opt.id)}
                    disabled={submitted}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: submitted ? "default" : "pointer",
                      background: showCorrect ? `${C.grn}12` : isSelected ? (submitted ? `${C.red}12` : `${C.gold}12`) : C.s2,
                      border: `1px solid ${showCorrect ? C.grn : isSelected ? (submitted ? C.red : C.gold) : C.bdr}`,
                      transition: "all .15s", textAlign: "left" as const,
                    }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${showCorrect ? C.grn : isSelected ? (submitted ? C.red : C.gold) : C.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {(isSelected || showCorrect) && <div style={{ width: 8, height: 8, borderRadius: "50%", background: showCorrect ? C.grn : submitted ? C.red : C.gold }} />}
                    </div>
                    <span style={{ fontSize: 13, color: showCorrect ? C.grn : isSelected ? C.t : C.t2 }}>{opt.text}</span>
                    {showCorrect && <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <div style={{ marginTop: 10, padding: "10px 12px", background: `${C.blue}10`, borderRadius: 8, fontSize: 12, color: C.t2, lineHeight: 1.6 }}>
                <strong style={{ color: C.blue }}>Explication :</strong> {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {!submitted ? (
        <button onClick={submit} disabled={Object.keys(answers).length < questions.length}
          style={btn({ width: "100%", background: Object.keys(answers).length >= questions.length ? C.gold : C.bdr, color: Object.keys(answers).length >= questions.length ? C.bg : C.t3, padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 14 })}>
          Soumettre le quiz
        </button>
      ) : !passed ? (
        <button onClick={() => { setSubmitted(false); setAnswers({}); setScore(0); }}
          style={btn({ width: "100%", background: C.gold, color: C.bg, padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 14 })}>
          Recommencer le quiz
        </button>
      ) : null}
    </div>
  );
}

/* ─────────────── Q&A SECTION ─────────────── */
function QASection({ lessonId }: { lessonId: string }) {
  const [qas, setQas] = useState<QA[]>([]);
  const [newQuestion, setNewQuestion] = useState({ name: "", email: "", question: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submited, setSubmited] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("lms_qa").select("*,answers:lms_qa_answers(*)").eq("lesson_id", lessonId).order("created_at", { ascending: false });
    setQas((data || []).map((q: any) => ({ ...q, answers: (q.answers || []).sort((a: QAAnswer, b: QAAnswer) => a.created_at.localeCompare(b.created_at)) })));
  };
  useEffect(() => { load(); }, [lessonId]);

  const submitQuestion = async () => {
    if (!newQuestion.name.trim() || !newQuestion.email.trim() || !newQuestion.question.trim()) return;
    setSubmitting(true);
    await supabase.from("lms_qa").insert({
      lesson_id: lessonId,
      author_name: newQuestion.name.trim(),
      author_email: newQuestion.email.trim(),
      question: newQuestion.question.trim(),
    });
    setSubmitting(false);
    setSubmited(true);
    setNewQuestion({ name: "", email: "", question: "" });
    load();
    setTimeout(() => setSubmited(false), 3000);
  };

  return (
    <div style={{ background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ fontSize: 22 }}>💬</div>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.gold, letterSpacing: ".1em" }}>QUESTIONS & REPONSES</div>
          <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 600, color: "#fff" }}>Zone de discussion</div>
        </div>
      </div>

      <div style={{ background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t, marginBottom: 12 }}>Posez votre question</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input value={newQuestion.name} onChange={e => setNewQuestion(q => ({ ...q, name: e.target.value }))} placeholder="Votre nom"
            style={{ background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "10px 12px", color: C.t, fontSize: 13, outline: "none" }} />
          <input value={newQuestion.email} onChange={e => setNewQuestion(q => ({ ...q, email: e.target.value }))} placeholder="Votre email" type="email"
            style={{ background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "10px 12px", color: C.t, fontSize: 13, outline: "none" }} />
        </div>
        <textarea value={newQuestion.question} onChange={e => setNewQuestion(q => ({ ...q, question: e.target.value }))} placeholder="Votre question..." rows={3}
          style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "10px 12px", color: C.t, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
        {submited && <div style={{ fontSize: 12, color: C.grn, marginBottom: 10 }}>Question envoyee ! Un formateur vous repondra bientot.</div>}
        <button onClick={submitQuestion} disabled={submitting || !newQuestion.name.trim() || !newQuestion.email.trim() || !newQuestion.question.trim()}
          style={btn({ background: submitting || !newQuestion.question.trim() ? C.bdr : C.gold, color: submitting || !newQuestion.question.trim() ? C.t3 : C.bg, padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 12 })}>
          {submitting ? "Envoi..." : "Envoyer la question"}
        </button>
      </div>

      {qas.length === 0 && <div style={{ fontSize: 13, color: C.t3, textAlign: "center", padding: 20 }}>Aucune question pour cette lecon. Soyez le premier a poser la votre !</div>}
      {qas.map(qa => (
        <div key={qa.id} style={{ background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${C.blue}20`, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
              {qa.author_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t }}>{qa.author_name}</div>
              <div style={{ fontSize: 10, color: C.t3, fontFamily: F.mono }}>{new Date(qa.created_at).toLocaleDateString("fr-FR")}</div>
            </div>
            {qa.is_answered && <div style={{ marginLeft: "auto", fontSize: 10, color: C.grn, fontFamily: F.mono, background: `${C.grn}15`, padding: "3px 8px", borderRadius: 4 }}>REPONDU</div>}
          </div>
          <p style={{ fontSize: 13, color: C.t, lineHeight: 1.65, margin: 0 }}>{qa.question}</p>

          {qa.answers.map(ans => (
            <div key={ans.id} style={{ marginTop: 12, marginLeft: 16, padding: 12, background: ans.is_from_instructor ? `${C.gold}08` : C.s1, border: `1px solid ${ans.is_from_instructor ? C.gold + "30" : C.bdr}`, borderRadius: 10 }}>
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
        </div>
      ))}
    </div>
  );
}

/* ─────────────── FILES SECTION ─────────────── */
function FilesSection({ lessonId }: { lessonId: string }) {
  const [files, setFiles] = useState<LessonFile[]>([]);

  const load = async () => {
    const { data } = await supabase.from("lms_lesson_files").select("*").eq("lesson_id", lessonId);
    setFiles(data || []);
  };
  useEffect(() => { load(); }, [lessonId]);

  if (files.length === 0) return null;

  return (
    <div style={{ background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 22 }}>📁</div>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.gold, letterSpacing: ".1em" }}>RESSOURCES</div>
          <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 600, color: "#fff" }}>Fichiers du cours</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {files.map(f => (
          <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" download={f.name}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 10, textDecoration: "none", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = `${C.gold}08`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.bdr; e.currentTarget.style.background = C.bg; }}>
            <span style={{ fontSize: 20 }}>{fileIcon(f.mime_type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
              <div style={{ fontSize: 10, color: C.t3, fontFamily: F.mono }}>{f.size_bytes ? fmtBytes(f.size_bytes) : "Fichier"}</div>
            </div>
            <span style={{ fontSize: 18, color: C.gold }}>⬇</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── LESSON VIEWER ─────────────── */
function LessonViewer({ lesson, onBack, onPrevious, onNext, hasQuiz, user, progress, onComplete, onQuizPass }: { lesson: Lesson; onBack: () => void; onPrevious?: () => void; onNext?: () => void; hasQuiz?: boolean; user: User | null; progress?: LessonProgress; onComplete: () => void; onQuizPass: () => void }) {
  const [tab, setTab] = useState<"video" | "files" | "quiz" | "qa">("video");

  const isComplete = progress?.completed_at;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "8px 14px", borderRadius: 8, fontSize: 12 })}>
          ← Retour
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.title}</div>
            {isComplete && <span style={{ background: `${C.grn}20`, color: C.grn, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontFamily: F.mono, fontWeight: 700 }}>✓ Terminee</span>}
          </div>
          {lesson.duration_seconds > 0 && <div style={{ fontSize: 11, color: C.t3, fontFamily: F.mono }}>{fmtSecs(lesson.duration_seconds)}</div>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {onPrevious && <button onClick={onPrevious} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "8px 12px", borderRadius: 8, fontSize: 12 })}>← Precedent</button>}
          {onNext && <button onClick={onNext} style={btn({ background: C.gold, color: C.bg, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>Suivant →</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setTab("video")} style={btn({ background: tab === "video" ? C.gold : C.s2, color: tab === "video" ? C.bg : C.t2, border: `1px solid ${tab === "video" ? C.gold : C.bdr}`, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>
          🎬 Video
        </button>
        <button onClick={() => setTab("files")} style={btn({ background: tab === "files" ? C.gold : C.s2, color: tab === "files" ? C.bg : C.t2, border: `1px solid ${tab === "files" ? C.gold : C.bdr}`, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>
          📁 Fichiers
        </button>
        {hasQuiz && (
          <button onClick={() => setTab("quiz")} style={btn({ background: tab === "quiz" ? C.gold : C.s2, color: tab === "quiz" ? C.bg : C.t2, border: `1px solid ${tab === "quiz" ? C.gold : C.bdr}`, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>
            🧠 Quiz {progress?.quiz_passed && <span style={{ color: C.grn }}>✓</span>}
          </button>
        )}
        <button onClick={() => setTab("qa")} style={btn({ background: tab === "qa" ? C.gold : C.s2, color: tab === "qa" ? C.bg : C.t2, border: `1px solid ${tab === "qa" ? C.gold : C.bdr}`, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>
          💬 Q&R
        </button>
      </div>

      {/* Content */}
      {tab === "video" && (
        lesson.video_url ? (
          <ProtectedVideoPlayer url={lesson.video_url} isPreview={lesson.is_preview} onComplete={onComplete} />
        ) : (
          <div style={{ background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 15, color: C.t2 }}>Aucune video pour cette lecon</div>
            <button onClick={onComplete} style={btn({ background: C.gold, color: C.bg, padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 13, marginTop: 20 })}>
              Marquer comme terminee
            </button>
          </div>
        )
      )}
      {tab === "files" && <FilesSection lessonId={lesson.id} />}
      {tab === "quiz" && <QuizTaker lessonId={lesson.id} userId={user?.id} onComplete={onQuizPass} />}
      {tab === "qa" && <QASection lessonId={lesson.id} />}

      {/* Description */}
      {lesson.description && (
        <div style={{ marginTop: 20, background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>A propos de cette lecon</div>
          <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, margin: 0 }}>{lesson.description}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────── COURSE VIEWER ─────────────── */
export function CourseViewer({ courseId, onBack, user }: { courseId: string; onBack: () => void; user: User | null }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const { progress, progressPct, markComplete, markQuizPassed, updateCourseProgress, enrollmentId } = useProgress(user, courseId);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: c } = await supabase.from("lms_courses").select("*").eq("id", courseId).eq("is_published", true).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCourse(c);

      const { data: secs } = await supabase.from("lms_sections").select("*").eq("course_id", courseId).order("position");
      setSections(secs || []);

      const lessonMap: Record<string, Lesson[]> = {};
      const quizMap: Record<string, Quiz> = {};

      for (const s of secs || []) {
        const { data: les } = await supabase.from("lms_lessons").select("*").eq("section_id", s.id).order("position");
        lessonMap[s.id] = les || [];
        for (const l of les || []) {
          const { data: qz } = await supabase.from("lms_quizzes").select("*").eq("lesson_id", l.id).maybeSingle();
          if (qz) quizMap[l.id] = qz;
        }
      }
      setLessons(lessonMap);
      setQuizzes(quizMap);
      setLoading(false);
    };
    load();
  }, [courseId]);

  // Find all lessons in order for prev/next navigation
  const allLessons = sections.flatMap(s => lessons[s.id] || []);
  const lessonIndex = selectedLesson ? allLessons.findIndex(l => l.id === selectedLesson.id) : -1;
  const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : undefined;
  const nextLesson = lessonIndex >= 0 && lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : undefined;

  // Calculate overall progress
  const totalLessons = allLessons.length;
  const completedLessons = Object.values(progress).filter(p => p.completed_at).length;

  useEffect(() => {
    if (totalLessons > 0) {
      updateCourseProgress(totalLessons);
    }
  }, [completedLessons, totalLessons]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.bdr}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48 }}>📚</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.t }}>Formation introuvable</div>
        <div style={{ fontSize: 13, color: C.t2, maxWidth: 320 }}>Cette formation n'existe pas ou n'est pas encore publiee.</div>
        <button onClick={onBack} style={btn({ background: C.gold, color: C.bg, padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13 })}>
          Retour au site
        </button>
      </div>
    );
  }

  // Lesson view
  if (selectedLesson) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F.sans }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "100px 24px 40px" }}>
          <LessonViewer
            lesson={selectedLesson}
            onBack={() => setSelectedLesson(null)}
            onPrevious={prevLesson ? () => setSelectedLesson(prevLesson) : undefined}
            onNext={nextLesson ? () => setSelectedLesson(nextLesson) : undefined}
            hasQuiz={!!quizzes[selectedLesson.id]}
            user={user}
            progress={progress[selectedLesson.id]}
            onComplete={() => markComplete(selectedLesson.id)}
            onQuizPass={() => markQuizPassed(selectedLesson.id)}
          />
        </div>
      </div>
    );
  }

  // Course overview
  const totalDuration = allLessons.reduce((sum, l) => sum + (l.duration_seconds || 0), 0);
  const totalQuizzes = Object.keys(quizzes).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F.sans }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#0E1A2C,#162438)", borderBottom: `1px solid ${C.bdr}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px 32px" }}>
          <button onClick={onBack} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "8px 14px", borderRadius: 8, fontSize: 12, marginBottom: 20 })}>
            ← Retour
          </button>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: `${course.color}18`, border: `1px solid ${course.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>
              {course.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, color: course.color, fontFamily: F.mono, background: `${course.color}18`, padding: "3px 8px", borderRadius: 4 }}>{course.category}</span>
                <span style={{ fontSize: 10, color: C.t2, fontFamily: F.mono, background: C.s2, padding: "3px 8px", borderRadius: 4 }}>{course.level}</span>
              </div>
              <h1 style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 600, color: "#fff", margin: "0 0 6px", lineHeight: 1.2 }}>{course.title}</h1>
              {course.subtitle && <div style={{ fontSize: 14, color: C.t2, marginBottom: 12 }}>{course.subtitle}</div>}
              <div style={{ display: "flex", gap: 20, fontSize: 11, color: C.t3, fontFamily: F.mono, flexWrap: "wrap", alignItems: "center" }}>
                <span>📚 {totalLessons} lecons</span>
                <span>⏱️ {totalDuration > 0 ? `${Math.floor(totalDuration / 60)} min` : "Duration variable"}</span>
                <span>🧠 {totalQuizzes} quiz</span>
                {enrollmentId && (
                  <span style={{ color: progressPct >= 100 ? C.grn : C.gold, fontWeight: 700 }}>
                    {progressPct >= 100 ? "✓ Terminee" : `${progressPct}% complete`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar if enrolled */}
          {enrollmentId && totalLessons > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.t2, fontFamily: F.mono }}>Progression</span>
                <span style={{ fontSize: 11, color: progressPct >= 100 ? C.grn : C.gold, fontFamily: F.mono, fontWeight: 700 }}>{completedLessons}/{totalLessons} lecons ({progressPct}%)</span>
              </div>
              <div style={{ height: 8, background: C.bdr, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: progressPct >= 100 ? C.grn : C.gold, borderRadius: 4, transition: "width .3s" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Description */}
        {course.description && (
          <div style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: C.gold, letterSpacing: ".1em", marginBottom: 10 }}>A PROPOS DE LA FORMATION</div>
            <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.75, margin: 0 }}>{course.description}</p>
          </div>
        )}

        {/* Sections and lessons */}
        <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".1em", marginBottom: 12, textTransform: "uppercase" }}>Contenu du cours</div>
        {sections.length === 0 && (
          <div style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📚</div>
            <div style={{ fontSize: 14, color: C.t2 }}>Le contenu de cette formation sera bientot disponible.</div>
          </div>
        )}
        {sections.map((sec, si) => {
          const secLessons = lessons[sec.id] || [];
          const isExpanded = expandedSections.has(sec.id);
          return (
            <div key={sec.id} style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 16, marginBottom: 12, overflow: "hidden" }}>
              <div
                {...clickable(() => { const next = new Set(expandedSections); if (isExpanded) next.delete(sec.id); else next.add(sec.id); setExpandedSections(next); })}
                aria-expanded={isExpanded}
                aria-label={`Section : ${sec.title}`}
                style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = `${C.gold}08`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${course.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: course.color, flexShrink: 0 }}>
                  {si + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.t }}>{sec.title}</div>
                  <div style={{ fontSize: 11, color: C.t3, fontFamily: F.mono }}>{secLessons.length} lecon{secLessons.length > 1 ? "s" : ""}</div>
                </div>
                <span style={{ color: C.t2, fontSize: 14, flexShrink: 0 }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
              {isExpanded && secLessons.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.bdr}`, padding: "0 20px 16px" }}>
                  {secLessons.map((les, li) => {
                    const hasQuiz = !!quizzes[les.id];
                    const lessonProg = progress[les.id];
                    return (
                      <div key={les.id}
                        {...clickable(() => setSelectedLesson(les))}
                        aria-label={`Leçon : ${les.title}`}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginTop: li === 0 ? 16 : 8, background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 10, cursor: "pointer", transition: "all .15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = `${C.gold}08`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.bdr; e.currentTarget.style.background = C.bg; }}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: lessonProg?.completed_at ? C.grn : les.video_url ? `${C.gold}18` : C.s2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: lessonProg?.completed_at ? "#fff" : les.video_url ? C.gold : C.t3, flexShrink: 0 }}>
                          {lessonProg?.completed_at ? "✓" : les.video_url ? "▶" : li + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{les.title}</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                            {les.duration_seconds > 0 && <span style={{ fontSize: 10, color: C.t3, fontFamily: F.mono }}>{fmtSecs(les.duration_seconds)}</span>}
                            {les.is_preview && <span style={{ fontSize: 10, color: C.grn, fontFamily: F.mono }}>Apercu gratuit</span>}
                            {hasQuiz && <span style={{ fontSize: 10, color: lessonProg?.quiz_passed ? C.grn : C.gold, fontFamily: F.mono }}>{lessonProg?.quiz_passed ? "Quiz ✓" : "Quiz"}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 14, color: C.t3 }}>→</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── COURSE CATALOG PAGE ─────────────── */
export function CourseCatalog({ onSelectCourse, onBack, user, onAddToCart }: { onSelectCourse: (id: string) => void; onBack: () => void; user: User | null; onAddToCart?: (courseId: string) => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentIds, setEnrollmentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("lms_courses").select("*").eq("is_published", true).order("created_at", { ascending: false });
      setCourses(data || []);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("student_enrollments").select("course_id").eq("student_id", user.id).then(({ data }) => {
      setEnrollmentIds(new Set((data || []).map((e: any) => e.course_id)));
    });
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.bdr}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F.sans }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#0E1A2C,#162438)", borderBottom: `1px solid ${C.bdr}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px 32px" }}>
          <button onClick={onBack} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "8px 14px", borderRadius: 8, fontSize: 12, marginBottom: 20 })}>
            ← Retour au site
          </button>
          <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 600, color: "#fff", margin: 0 }}>Catalogue des formations</h1>
          <p style={{ fontSize: 15, color: C.t2, marginTop: 8 }}>Explorez nos formations disponibles et lancez-vous.</p>
        </div>
      </div>

      {/* Courses grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {courses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.t, marginBottom: 8 }}>Aucune formation disponible</div>
            <div style={{ fontSize: 13, color: C.t2 }}>Les formations seront bientot publiees.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {courses.map(c => {
              const isEnrolled = enrollmentIds.has(c.id);
              return (
                <div key={c.id}
                  style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 18, overflow: "hidden", transition: "all .3s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 48px rgba(0,0,0,.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.bdr; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ padding: 20, background: `linear-gradient(135deg,${c.color}10,transparent)`, borderBottom: `1px solid ${C.bdr}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{c.icon}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                        <span style={{ fontSize: 10, color: c.color, fontFamily: F.mono, background: `${c.color}18`, padding: "3px 8px", borderRadius: 4 }}>{c.category}</span>
                        <span style={{ fontSize: 10, color: C.t2, fontFamily: F.mono }}>{c.level}</span>
                      </div>
                    </div>
                    <h3 style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 600, color: "#fff", margin: "0 0 6px", lineHeight: 1.25 }}>{c.title}</h3>
                    {c.subtitle && <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.5 }}>{c.subtitle}</div>}
                  </div>
                  <div style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 600, color: C.gold }}>{(c.price || 0).toLocaleString("fr-FR")}</span>
                        <span style={{ fontSize: 12, color: C.t3 }}>FCFA</span>
                        {c.original_price > c.price && (
                          <span style={{ fontSize: 12, color: C.t3, textDecoration: "line-through" }}>{c.original_price.toLocaleString("fr-FR")}</span>
                        )}
                      </div>
                    </div>
                    {isEnrolled ? (
                      <button onClick={() => onSelectCourse(c.id)} style={btn({ width: "100%", background: C.grn, color: textOn(C.grn), padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 13 })}>
                        Continuer la formation
                      </button>
                    ) : user && onAddToCart ? (
                      <button onClick={() => onAddToCart(c.id)} style={btn({ width: "100%", background: C.gold, color: C.bg, padding: 12, borderRadius: 10, fontWeight: 800, fontSize: 13 })}>
                        Ajouter au panier
                      </button>
                    ) : (
                      <button onClick={() => onSelectCourse(c.id)} style={btn({ width: "100%", background: C.s2, color: C.t, border: `1px solid ${C.bdr2}`, padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 13 })}>
                        Voir les details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
