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

/* ─────────────── PASSWORD VALIDATION ─────────────── */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Au moins 8 caracteres");
  if (!/[a-zA-Z]/.test(password)) errors.push("Au moins une lettre");
  if (!/[0-9]/.test(password)) errors.push("Au moins un chiffre");
  return { valid: errors.length === 0, errors };
}

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

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, signOut, fetchProfile };
}

/* ─────────────── AUTH MODAL ─────────────── */
export function AuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "verify">("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const checkEmailExists = async (email: string): Promise<boolean> => {
    // Try to sign in and check if user exists
    const { error } = await supabase.auth.signInWithPassword({ email, password: "dummy-password-to-check" });
    if (error?.message?.includes("Invalid login credentials")) {
      // User might exist but wrong password - let's check with reset password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      // If no error or different error, user likely exists
      return !resetError || !resetError.message?.includes("User not found");
    }
    return false;
  };

  const handleRegister = async () => {
    // Validate
    if (!form.fullName.trim()) { setError("Le nom complet est requis"); return false; }
    if (!form.email.trim()) { setError("L'email est requis"); return false; }

    const pwdValidation = validatePassword(form.password);
    if (!pwdValidation.valid) {
      setPasswordErrors(pwdValidation.errors);
      setError("Mot de passe invalide");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return false;
    }

    setLoading(true);
    setError("");
    setPasswordErrors([]);

    try {
      // Check if email already exists
      const { data: { users }, error: listError } = await supabase.auth.admin ?
        await supabase.auth.admin.listUsers() :
        { data: { users: [] }, error: null };

      // Try signup - Supabase will return error if email exists
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: { full_name: form.fullName.trim() },
          emailRedirectTo: window.location.origin + "/#student"
        }
      });

      if (signUpError) {
        if (signUpError.message?.includes("already registered") || signUpError.message?.includes("already exists")) {
          setError("Un compte existe deja avec cet email. Connectez-vous ou reinitialisez votre mot de passe.");
          return false;
        }
        throw signUpError;
      }

      // Check if email confirmation is needed
      if (data.user && !data.session) {
        setPendingEmail(form.email.trim().toLowerCase());
        setSuccess("Un email de confirmation a ete envoye. Veuillez verifier votre boite mail et cliquer sur le lien pour activer votre compte.");
        setMode("verify");
        return true;
      }

      // User is signed in automatically (email confirmation disabled)
      setSuccess("Compte cree avec succes !");
      onAuth();
      setTimeout(() => onClose(), 500);
      return true;
    } catch (e: any) {
      setError(e.message || "Une erreur s'est produite");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password) {
      setError("Email et mot de passe requis");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (signInError) {
        if (signInError.message?.includes("Invalid login credentials")) {
          setError("Email ou mot de passe incorrect");
        } else if (signInError.message?.includes("Email not confirmed")) {
          setError("Veuillez d'abord confirmer votre email. Verifiez votre boite mail.");
          setPendingEmail(form.email.trim().toLowerCase());
          setMode("verify");
        } else {
          throw signInError;
        }
        return;
      }

      if (data.session) {
        onAuth();
        onClose();
      }
    } catch (e: any) {
      setError(e.message || "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      setError("Veuillez entrer votre email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email.trim().toLowerCase(), {
        redirectTo: window.location.origin + "/#student?reset=true"
      });

      if (resetError) throw resetError;

      setSuccess("Un email de reinitialisation a ete envoye. Verifiez votre boite mail.");
      setMode("login");
    } catch (e: any) {
      setError(e.message || "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!pendingEmail) return;

    setLoading(true);
    setError("");

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: { emailRedirectTo: window.location.origin + "/#student" }
      });

      if (resendError) throw resendError;
      setSuccess("Email de confirmation renvoye !");
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  // OTP verification (for email confirmation)
  const handleVerifyOTP = async (token: string) => {
    setLoading(true);
    setError("");

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token,
        type: "signup"
      });

      if (verifyError) throw verifyError;

      setSuccess("Email confirme ! Connexion en cours...");
      onAuth();
      setTimeout(() => onClose(), 500);
    } catch (e: any) {
      setError(e.message || "Code invalide ou expire");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(4,8,16,.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 22, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.7)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ background: "linear-gradient(135deg,#0E1A2C,#162438)", padding: "24px 28px", borderBottom: `1px solid ${C.bdr}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 600, color: "#fff" }}>
                {mode === "login" ? "Connexion" : mode === "register" ? "Creer un compte" : mode === "forgot" ? "Mot de passe oublie" : "Confirmation email"}
              </div>
              <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>
                {mode === "login" ? "Accédez à votre espace étudiant" : mode === "register" ? "Rejoignez Beyrey Consulting" : mode === "forgot" ? "Reinitialisez votre mot de passe" : "Verifiez votre adresse email"}
              </div>
            </div>
            <button onClick={onClose} style={btn({ background: C.bdr, color: C.t2, width: 30, height: 30, borderRadius: "50%", fontSize: 14 })}>✕</button>
          </div>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          {success && <div style={{ fontSize: 13, color: C.grn, marginBottom: 14, padding: 10, background: `${C.grn}10`, borderRadius: 8, border: `1px solid ${C.grn}30` }}>{success}</div>}
          {error && <div style={{ fontSize: 12, color: C.red, marginBottom: 14, padding: 10, background: `${C.red}10`, borderRadius: 8, border: `1px solid ${C.red}30` }}>{error}</div>}

          {/* LOGIN MODE */}
          {mode === "login" && (
            <>
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
              <button onClick={handleLogin} disabled={loading || !form.email || !form.password}
                style={btn({ width: "100%", background: loading || !form.email || !form.password ? C.bdr : "linear-gradient(135deg,#C8971A,#E0A820)", color: loading || !form.email || !form.password ? C.t3 : C.bg, padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 14, marginBottom: 12 })}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
              <div style={{ textAlign: "center" }}>
                <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }} style={btn({ background: "none", color: C.t2, fontSize: 12, padding: 4 })}>
                  Mot de passe oublie ?
                </button>
              </div>
              <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: C.t2 }}>
                Pas encore de compte ? <button onClick={() => { setMode("register"); setError(""); setPasswordErrors([]); }} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontWeight: 700 }}>S'inscrire</button>
              </div>
            </>
          )}

          {/* REGISTER MODE */}
          {mode === "register" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Nom complet *</div>
                <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 14px", color: C.t, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  placeholder="Ibrahim Seydou" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Email *</div>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 14px", color: C.t, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  placeholder="vous@exemple.com" type="email" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Mot de passe *</div>
                <input value={form.password} onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setPasswordErrors([]); }}
                  style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 14px", color: C.t, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  placeholder="Minimum 8 caracteres" type="password" />
                {passwordErrors.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {passwordErrors.map((e, i) => (
                      <div key={i} style={{ fontSize: 11, color: C.red }}>✗ {e}</div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 6, fontSize: 10, color: C.t3 }}>
                  Le mot de passe doit contenir au moins 8 caracteres, une lettre et un chiffre.
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Confirmer le mot de passe *</div>
                <input value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 14px", color: C.t, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  placeholder="Retapez le mot de passe" type="password" />
              </div>
              <button onClick={handleRegister} disabled={loading || !form.email || !form.password || !form.fullName || !form.confirmPassword}
                style={btn({ width: "100%", background: loading || !form.email || !form.password || !form.fullName || !form.confirmPassword ? C.bdr : "linear-gradient(135deg,#C8971A,#E0A820)", color: loading ? C.t3 : C.bg, padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 14 })}>
                {loading ? "Creation..." : "Creer mon compte"}
              </button>
              <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: C.t2 }}>
                Déjà un compte ? <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontWeight: 700 }}>Se connecter</button>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD MODE */}
          {mode === "forgot" && (
            <>
              <div style={{ marginBottom: 20, fontSize: 13, color: C.t2 }}>
                Entrez votre adresse email. Nous vous enverrons un lien pour reinitialiser votre mot de passe.
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Email</div>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 14px", color: C.t, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  placeholder="vous@exemple.com" type="email" />
              </div>
              <button onClick={handleForgotPassword} disabled={loading || !form.email}
                style={btn({ width: "100%", background: loading || !form.email ? C.bdr : "linear-gradient(135deg,#C8971A,#E0A820)", color: loading || !form.email ? C.t3 : C.bg, padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 14, marginBottom: 12 })}>
                {loading ? "Envoi..." : "Envoyer le lien"}
              </button>
              <div style={{ textAlign: "center" }}>
                <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} style={btn({ background: "none", color: C.t2, fontSize: 12, padding: 4 })}>
                  ← Retour a la connexion
                </button>
              </div>
            </>
          )}

          {/* VERIFY EMAIL MODE */}
          {mode === "verify" && (
            <>
              <div style={{ marginBottom: 20, fontSize: 13, color: C.t2, textAlign: "center" }}>
                Nous avons envoye un email de confirmation a <strong style={{ color: C.t }}>{pendingEmail}</strong>. Cliquez sur le lien dans l'email pour activer votre compte.
              </div>
              <button onClick={handleResendConfirmation} disabled={loading}
                style={btn({ width: "100%", background: C.s2, border: `1px solid ${C.bdr}`, color: C.t, padding: 14, borderRadius: 10, fontWeight: 700, fontSize: 14, marginBottom: 12 })}>
                {loading ? "Envoi..." : "Renvoyer l'email de confirmation"}
              </button>
              <div style={{ textAlign: "center" }}>
                <button onClick={() => { setMode("login"); setError(""); setSuccess(""); setPendingEmail(""); }} style={btn({ background: "none", color: C.gold, fontSize: 12, padding: 4, fontWeight: 700 })}>
                  ← Retour a la connexion
                </button>
              </div>
            </>
          )}
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
function CertificateView({ certificate, onClose, onShare }: { certificate: Certificate; onClose: () => void; onShare: () => void }) {
  const course = certificate.course;
  const [copied, setCopied] = useState(false);
  const verifyUrl = `${window.location.origin}/#verify-cert/${certificate.verification_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, borderTop: "1px solid #e0d5c5", paddingTop: 32, flexWrap: "wrap", gap: 16 }}>
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

        {/* Share section */}
        <div style={{ padding: 16, background: C.s2, borderBottom: `1px solid ${C.bdr}` }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.t2, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Lien de verification</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={verifyUrl} readOnly style={{ flex: 1, background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, color: C.t, fontFamily: F.mono }} />
            <button onClick={copyLink} style={btn({ background: copied ? C.grn : C.gold, color: copied ? "#fff" : C.bg, padding: "8px 14px", borderRadius: 6, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" })}>
              {copied ? "✓ Copié !" : "Copier"}
            </button>
          </div>
        </div>

        <div style={{ padding: 16, background: C.s1, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onShare} style={btn({ background: C.blue, color: "#fff", padding: "10px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13 })}>
              📤 Partager
            </button>
            <button onClick={() => window.print()} style={btn({ background: C.s2, color: C.t, border: `1px solid ${C.bdr}`, padding: "10px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13 })}>
              🖨️ Imprimer
            </button>
          </div>
          <button onClick={onClose} style={btn({ background: C.s2, color: C.t2, padding: "10px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13 })}>
            Fermer
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
  const [showShare, setShowShare] = useState<Certificate | null>(null);
  const [copied, setCopied] = useState(false);

  const completedCount = enrollments.filter(e => e.completed_at).length;

  const shareCertificate = (cert: Certificate) => {
    const url = `${window.location.origin}/#verify-cert/${cert.verification_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F.sans }}>
      {/* Top Navigation Bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(8,17,30,.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.bdr}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={() => { window.location.hash = ""; }} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <img src="/logo.png" alt="Beyrey Consulting" style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 8 }} />
            <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: "#fff" }}>Beyrey Consulting</div>
          </div>
          <nav style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <button onClick={() => { window.location.hash = ""; }} style={btn({ background: "none", color: C.t2, fontSize: 13, fontWeight: 600, padding: "6px 0" })}
              onMouseEnter={e => e.currentTarget.style.color = C.t}
              onMouseLeave={e => e.currentTarget.style.color = C.t2}>
              Accueil
            </button>
            <button onClick={() => { window.location.hash = "lms"; }} style={btn({ background: "none", color: C.t2, fontSize: 13, fontWeight: 600, padding: "6px 0" })}
              onMouseEnter={e => e.currentTarget.style.color = C.gold}
              onMouseLeave={e => e.currentTarget.style.color = C.t2}>
              Catalogue
            </button>
            <button onClick={() => { window.location.hash = ""; }} style={btn({ background: "none", color: C.t2, fontSize: 13, fontWeight: 600, padding: "6px 0" })}
              onMouseEnter={e => e.currentTarget.style.color = C.t}
              onMouseLeave={e => e.currentTarget.style.color = C.t2}>
              Contact
            </button>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#0E1A2C,#162438)", borderBottom: `1px solid ${C.bdr}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px 32px" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
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
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={() => { window.location.hash = "lms"; }} style={btn({ background: C.gold, color: C.bg, padding: "10px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700 })}>
                Explorer les formations
              </button>
              <button onClick={onSignOut} style={btn({ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "10px 18px", borderRadius: 8, fontSize: 12 })}>
                Se deconnecter
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 24, marginTop: 28, flexWrap: "wrap" }}>
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
                <div key={cert.id} style={{ background: "linear-gradient(135deg,#fffdf8,#f5f0e8)", border: `2px solid #C8971A`, borderRadius: 16, padding: 24, textAlign: "center", transition: "transform .2s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>🏆</div>
                  <div style={{ fontSize: 10, color: "#8B7355", letterSpacing: ".2em", textTransform: "uppercase", fontFamily: F.mono, marginBottom: 8 }}>Certificat de Reussite</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", fontFamily: F.serif, marginBottom: 8 }}>{cert.course?.title}</div>
                  <div style={{ fontSize: 11, color: "#666", fontFamily: F.mono, marginBottom: 16 }}>N° {cert.certificate_number}</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button onClick={() => setSelectedCert(cert)} style={btn({ background: C.gold, color: C.bg, padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12 })}>
                      Voir
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); shareCertificate(cert); }} style={btn({ background: C.blue, color: "#fff", padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12 })}>
                      {copied ? "✓ Copié" : "Partager"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateView
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          onShare={() => { shareCertificate(selectedCert); setSelectedCert(null); }}
        />
      )}
    </div>
  );
}
