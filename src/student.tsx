import { useState, useEffect, useCallback } from "react";
import { C, F, btn } from "./data.tsx";
import { supabase } from "./supabase";

/* ─────────────── TYPES ─────────────── */
interface User { id: string; email: string; }
interface StudentProfile { id: string; full_name: string; avatar_url?: string; phone?: string; }
interface Course { id: string; title: string; subtitle: string; icon: string; color: string; price: number; original_price: number; category: string; level: string; }
interface Enrollment { id: string; course_id: string; enrolled_at: string; completed_at?: string; progress_pct: number; course: Course; }
interface Certificate { id: string; course_id: string; issued_at: string; certificate_number: string; verification_code: string; course: Course; }
interface CartItem { id: string; course_id: string; created_at: string; course: Course; }
interface Lesson { id: string; section_id: string; course_id: string; title: string; is_preview: boolean; position: number; }
interface LessonProgress { lesson_id: string; completed_at?: string; video_progress_seconds: number; quiz_passed: boolean; }

/* ─────────────── AUTH CONTEXT ─────────────── */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from("student_profiles").select("*").eq("id", uid).maybeSingle();
    setProfile(data);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, signUp, signIn, signOut, fetchProfile };
}

/* ─────────────── AUTH MODAL ─────────────── */
export function AuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        if (!form.fullName.trim()) { setError("Le nom est requis"); setLoading(false); return; }
        if (form.password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caracteres"); setLoading(false); return; }
        await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { full_name: form.fullName.trim() } }
        });
        // Auto sign in after signup (email confirmation disabled)
        await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      } else {
        await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      }
      onAuth();
      onClose();
    } catch (e: any) {
      setError(e.message || "Une erreur s'est produite");
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(4,8,16,.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 22, width: "100%", maxWidth: 420, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.7)" }}>
        <div style={{ background: "linear-gradient(135deg,#0E1A2C,#162438)", padding: "24px 28px", borderBottom: `1px solid ${C.bdr}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 600, color: "#fff" }}>
                {mode === "login" ? "Connexion" : "Creer un compte"}
              </div>
              <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>
                {mode === "login" ? "Accédez à votre espace étudiant" : "Rejoignez Beyrey Consulting"}
              </div>
            </div>
            <button onClick={onClose} style={btn({ background: C.bdr, color: C.t2, width: 30, height: 30, borderRadius: "50%", fontSize: 14 })}>✕</button>
          </div>
        </div>
        <div style={{ padding: "24px 28px 28px" }}>
          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Nom complet</div>
              <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 14px", color: C.t, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                placeholder="Ibrahim Seydou" />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Email</div>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 14px", color: C.t, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="vous@exemple.com" type="email" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Mot de passe</div>
            <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 14px", color: C.t, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="••••••••" type="password" />
          </div>
          {error && <div style={{ fontSize: 12, color: C.red, marginBottom: 14 }}>{error}</div>}
          <button onClick={submit} disabled={loading || !form.email || !form.password}
            style={btn({ width: "100%", background: loading || !form.email || !form.password ? C.bdr : "linear-gradient(135deg,#C8971A,#E0A820)", color: loading || !form.email || !form.password ? C.t3 : C.bg, padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 14, boxShadow: "0 6px 24px rgba(200,151,26,.3)" })}>
            {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Creer mon compte"}
          </button>
          <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: C.t2 }}>
            {mode === "login" ? (
              <>Pas encore de compte ? <button onClick={() => setMode("register")} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontWeight: 700 }}>S'inscrire</button></>
            ) : (
              <>Déjà un compte ? <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontWeight: 700 }}>Se connecter</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── CART ─────────────── */
export function useCart(user: User | null) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("cart_items")
      .select("id, course_id, created_at, course:lms_courses(id, title, subtitle, icon, color, price, original_price, category, level)")
      .eq("student_id", user.id);
    setItems((data || []) as CartItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addToCart = async (courseId: string) => {
    if (!user) return false;
    const { error } = await supabase.from("cart_items").insert({ student_id: user.id, course_id: courseId });
    if (error) { if (error.code === "23505") return true; return false; }
    load();
    return true;
  };

  const removeFromCart = async (itemId: string) => {
    await supabase.from("cart_items").delete().eq("id", itemId);
    load();
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("student_id", user.id);
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + (item.course?.price || 0), 0);
  const count = items.length;

  return { items, loading, addToCart, removeFromCart, clearCart, total, count, reload: load };
}

/* ─────────────── ENROLLMENTS ─────────────── */
export function useEnrollments(user: User | null) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setEnrollments([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("student_enrollments")
      .select("id, course_id, enrolled_at, completed_at, progress_pct, course:lms_courses(id, title, subtitle, icon, color, price, original_price, category, level)")
      .eq("student_id", user.id)
      .order("enrolled_at", { ascending: false });
    setEnrollments((data || []) as Enrollment[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const isEnrolled = (courseId: string) => enrollments.some(e => e.course_id === courseId);

  const enroll = async (courseId: string) => {
    if (!user) return false;
    const { error } = await supabase.from("student_enrollments").insert({ student_id: user.id, course_id: courseId });
    if (error) return false;
    load();
    return true;
  };

  const updateProgress = async (enrollmentId: string, progressPct: number, completed?: boolean) => {
    const update: any = { progress_pct: progressPct, last_accessed_at: new Date().toISOString() };
    if (completed) update.completed_at = new Date().toISOString();
    await supabase.from("student_enrollments").update(update).eq("id", enrollmentId);
    load();
  };

  return { enrollments, loading, isEnrolled, enroll, updateProgress, reload: load };
}

/* ─────────────── CERTIFICATES ─────────────── */
export function useCertificates(user: User | null) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const load = useCallback(async () => {
    if (!user) { setCertificates([]); return; }
    const { data } = await supabase
      .from("certificates")
      .select("id, course_id, issued_at, certificate_number, verification_code, course:lms_courses(id, title, subtitle, icon, color)")
      .eq("student_id", user.id)
      .order("issued_at", { ascending: false });
    setCertificates((data || []) as Certificate[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const hasCertificate = (courseId: string) => certificates.some(c => c.course_id === courseId);

  const generateCertificate = async (courseId: string) => {
    if (!user) return null;
    const { data, error } = await supabase.from("certificates").insert({ student_id: user.id, course_id: courseId }).select().single();
    if (error) return null;
    load();
    return data;
  };

  return { certificates, hasCertificate, generateCertificate, reload: load };
}

/* ─────────────── SHOPPING CART MODAL ─────────────── */
export function CartModal({ onClose, onCheckout }: { onClose: () => void; onCheckout: () => void }) {
  const { user } = useAuth();
  const { items, loading, removeFromCart, total, count } = useCart(user);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(4,8,16,.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 22, width: "100%", maxWidth: 480, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.7)" }}>
        <div style={{ background: "linear-gradient(135deg,#0E1A2C,#162438)", padding: "20px 24px", borderBottom: `1px solid ${C.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 600, color: "#fff" }}>Panier</div>
            <div style={{ fontSize: 12, color: C.t2 }}>{count} formation{count > 1 ? "s" : ""}</div>
          </div>
          <button onClick={onClose} style={btn({ background: C.bdr, color: C.t2, width: 32, height: 32, borderRadius: "50%", fontSize: 14 })}>✕</button>
        </div>
        <div style={{ padding: 20, maxHeight: 400, overflowY: "auto" }}>
          {loading && <div style={{ textAlign: "center", color: C.t3, padding: 20 }}>Chargement...</div>}
          {!loading && items.length === 0 && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
              <div style={{ fontSize: 14, color: C.t2 }}>Votre panier est vide</div>
            </div>
          )}
          {items.map(item => (
            <div key={item.id} style={{ display: "flex", gap: 12, padding: "12px", background: C.s2, borderRadius: 12, marginBottom: 8, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: `${item.course?.color || C.gold}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {item.course?.icon || "📚"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.course?.title}</div>
                <div style={{ fontSize: 11, color: C.t2, fontFamily: F.mono }}>{item.course?.level}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.gold }}>{(item.course?.price || 0).toLocaleString("fr-FR")} F</div>
                <button onClick={() => removeFromCart(item.id)} style={btn({ background: "none", color: C.t3, fontSize: 10, padding: "2px 4px" })}>Retirer</button>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div style={{ padding: "20px 24px", borderTop: `1px solid ${C.bdr}`, background: C.s2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: C.t2 }}>Total</span>
              <span style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 600, color: C.gold }}>{total.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <button onClick={onCheckout} style={btn({ width: "100%", background: "linear-gradient(135deg,#C8971A,#E0A820)", color: C.bg, padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 14 })}>
              Proceder au paiement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── CERTIFICATE VIEW ─────────────── */
function CertificateView({ certificate, onClose }: { certificate: Certificate; onClose: () => void }) {
  const course = certificate.course;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(4,8,16,.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 0, width: "100%", maxWidth: 800, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.5)" }}>
        {/* Certificate Content */}
        <div style={{ padding: "48px 56px", background: "#fffdf8", position: "relative", textAlign: "center" }}>
          {/* Border decorations */}
          <div style={{ position: "absolute", inset: 16, border: "3px solid #C8971A", borderRadius: 4, pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 24, border: "1px solid #C8971A", pointerEvents: "none" }} />

          <div style={{ fontSize: 12, color: "#8B7355", letterSpacing: ".3em", textTransform: "uppercase", fontFamily: F.mono }}>Certificat de Reussite</div>

          <div style={{ fontSize: 48, fontFamily: F.serif, color: "#C8971A", margin: "20px 0", fontWeight: 600, fontStyle: "italic" }}>
            Beyrey Consulting
          </div>

          <div style={{ fontSize: 14, color: "#666", marginBottom: 28 }}>atteste que</div>

          <div style={{ fontSize: 28, fontFamily: F.serif, color: "#1a1a1a", fontWeight: 700, marginBottom: 8 }}>
            {certificate.course?.title || "Étudiant"}
          </div>

          <div style={{ fontSize: 14, color: "#666", marginBottom: 28 }}>a suivi avec succes la formation</div>

          <div style={{ display: "inline-block", padding: "12px 32px", background: "linear-gradient(135deg,#C8971A,#E0A820)", color: "#fff", fontFamily: F.serif, fontSize: 22, fontWeight: 600, borderRadius: 4, marginBottom: 28 }}>
            {course?.title}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, borderTop: "1px solid #e0d5c5", paddingTop: 32 }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: ".1em" }}>Date</div>
              <div style={{ fontSize: 14, color: "#333", fontWeight: 700 }}>{new Date(certificate.issued_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: ".1em" }}>N° Certificat</div>
              <div style={{ fontSize: 14, color: "#333", fontWeight: 700, fontFamily: F.mono }}>{certificate.certificate_number}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: ".1em" }}>Code Verification</div>
              <div style={{ fontSize: 14, color: "#333", fontWeight: 700, fontFamily: F.mono }}>{certificate.verification_code}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 16, background: C.s1, borderTop: `1px solid ${C.bdr}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={btn({ background: C.s2, color: C.t, padding: "10px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13 })}>
            Fermer
          </button>
          <button onClick={() => window.print()} style={btn({ background: C.gold, color: C.bg, padding: "10px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13 })}>
            Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── STUDENT DASHBOARD ─────────────── */
export function StudentDashboard({ user, profile, onSignOut, onViewCourse }: { user: User; profile: StudentProfile | null; onSignOut: () => void; onViewCourse: (id: string) => void }) {
  const { enrollments, loading: enrollLoading, isEnrolled } = useEnrollments(user);
  const { certificates, hasCertificate, generateCertificate } = useCertificates(user);
  const [tab, setTab] = useState<"courses" | "certificates">("courses");
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const totalPages = enrollments.reduce((sum, e) => sum + 1, 0);
  const completedCount = enrollments.filter(e => e.completed_at).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F.sans }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#0E1A2C,#162438)", borderBottom: `1px solid ${C.bdr}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px 32px" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#C8971A,#E0A820)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: C.bg, fontWeight: 800, flexShrink: 0 }}>
                {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div style={{ fontSize: 24, fontFamily: F.serif, fontWeight: 600, color: "#fff" }}>
                  {profile?.full_name || "Étudiant"}
                </div>
                <div style={{ fontSize: 13, color: C.t2, fontFamily: F.mono }}>{user.email}</div>
              </div>
            </div>
            <button onClick={onSignOut} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "10px 18px", borderRadius: 8, fontSize: 12 })}>
              Se deconnecter
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 24, marginTop: 28 }}>
            <div style={{ padding: "16px 20px", background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 12 }}>
              <div style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 600, color: C.gold }}>{enrollments.length}</div>
              <div style={{ fontSize: 10, color: C.t2, fontFamily: F.mono, letterSpacing: ".08em", textTransform: "uppercase" }}>Formations inscrites</div>
            </div>
            <div style={{ padding: "16px 20px", background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 12 }}>
              <div style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 600, color: C.grn }}>{completedCount}</div>
              <div style={{ fontSize: 10, color: C.t2, fontFamily: F.mono, letterSpacing: ".08em", textTransform: "uppercase" }}>Formations completees</div>
            </div>
            <div style={{ padding: "16px 20px", background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 12 }}>
              <div style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 600, color: C.blue }}>{certificates.length}</div>
              <div style={{ fontSize: 10, color: C.t2, fontFamily: F.mono, letterSpacing: ".08em", textTransform: "uppercase" }}>Certificats obtenus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button onClick={() => setTab("courses")} style={btn({ background: tab === "courses" ? C.gold : C.s2, color: tab === "courses" ? C.bg : C.t2, border: `1px solid ${tab === "courses" ? C.gold : C.bdr}`, padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700 })}>
            📚 Mes formations
          </button>
          <button onClick={() => setTab("certificates")} style={btn({ background: tab === "certificates" ? C.gold : C.s2, color: tab === "certificates" ? C.bg : C.t2, border: `1px solid ${tab === "certificates" ? C.gold : C.bdr}`, padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700 })}>
            🏆 Certificats ({certificates.length})
          </button>
        </div>

        {tab === "courses" && (
          enrollLoading ? (
            <div style={{ textAlign: "center", padding: 60, color: C.t3 }}>Chargement...</div>
          ) : enrollments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.t, marginBottom: 8 }}>Aucune formation</div>
              <div style={{ fontSize: 13, color: C.t2, marginBottom: 20 }}>Explorez notre catalogue et inscrivez-vous à une formation.</div>
              <button onClick={() => { window.location.hash = "lms"; }} style={btn({ background: C.gold, color: C.bg, padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14 })}>
                Voir le catalogue
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
              {enrollments.map(en => (
                <div key={en.id} style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ padding: 20, background: `linear-gradient(135deg,${en.course?.color || C.gold}10,transparent)`, borderBottom: `1px solid ${C.bdr}` }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${en.course?.color || C.gold}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                        {en.course?.icon || "📚"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{en.course?.title}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: en.course?.color || C.gold, fontFamily: F.mono }}>{en.course?.category}</span>
                          <span style={{ fontSize: 10, color: C.t3, fontFamily: F.mono }}>{en.course?.level}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 20 }}>
                    {/* Progress */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: C.t2, fontFamily: F.mono }}>Progression</span>
                        <span style={{ fontSize: 11, color: en.progress_pct >= 100 ? C.grn : C.gold, fontFamily: F.mono, fontWeight: 700 }}>{en.progress_pct}%</span>
                      </div>
                      <div style={{ height: 6, background: C.bdr, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${en.progress_pct}%`, background: en.progress_pct >= 100 ? C.grn : C.gold, borderRadius: 3, transition: "width .3s" }} />
                      </div>
                    </div>

                    {en.completed_at && hasCertificate(en.course_id) ? (
                      <button onClick={() => {
                        const cert = certificates.find(c => c.course_id === en.course_id);
                        if (cert) setSelectedCert(cert);
                      }} style={btn({ width: "100%", background: C.grn, color: "#fff", padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 13 })}>
                        🏆 Voir mon certificat
                      </button>
                    ) : en.progress_pct >= 100 && !hasCertificate(en.course_id) ? (
                      <button onClick={async () => { await generateCertificate(en.course_id); }} style={btn({ width: "100%", background: C.gold, color: C.bg, padding: 12, borderRadius: 10, fontWeight: 800, fontSize: 13 })}>
                        🏆 Obtenir mon certificat
                      </button>
                    ) : (
                      <button onClick={() => onViewCourse(en.course_id)} style={btn({ width: "100%", background: C.s2, color: C.t, border: `1px solid ${C.bdr2}`, padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 13 })}>
                        Continuer la formation
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "certificates" && (
          certificates.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.t, marginBottom: 8 }}>Aucun certificat</div>
              <div style={{ fontSize: 13, color: C.t2 }}>Completez une formation pour obtenir votre premier certificat.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {certificates.map(cert => (
                <div key={cert.id} style={{ background: "linear-gradient(135deg,#fffdf8,#f5f0e8)", border: `2px solid #C8971A`, borderRadius: 16, padding: 24, textAlign: "center", cursor: "pointer", transition: "transform .2s" }}
                  onClick={() => setSelectedCert(cert)}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>🏆</div>
                  <div style={{ fontSize: 10, color: "#8B7355", letterSpacing: ".2em", textTransform: "uppercase", fontFamily: F.mono, marginBottom: 8 }}>Certificat de Reussite</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", fontFamily: F.serif, marginBottom: 8 }}>{cert.course?.title}</div>
                  <div style={{ fontSize: 11, color: "#666", fontFamily: F.mono }}>N° {cert.certificate_number}</div>
                  <div style={{ marginTop: 16, color: C.gold, fontSize: 12, fontWeight: 700 }}>Voir le certificat →</div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Certificate Modal */}
      {selectedCert && <CertificateView certificate={selectedCert} onClose={() => setSelectedCert(null)} />}
    </div>
  );
}
