import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, F, btn, textOn } from "./data.tsx";
import { supabase, enrollInCourse } from "./supabase";
import { useDialog } from "./a11y";
import { staggerContainer, staggerItem } from "./motion";

/* ─────────────── TYPES ─────────────── */
interface User { id: string; email: string; }
interface StudentProfile { id: string; full_name: string; avatar_url?: string; phone?: string; }
interface Course { id: string; title: string; subtitle: string; icon: string; color: string; price: number; original_price: number; category: string; level: string; }
interface Enrollment { id: string; course_id: string; enrolled_at: string; completed_at?: string; progress_pct: number; course: Course; }
interface Certificate { id: string; course_id: string; issued_at: string; certificate_number: string; verification_code: string; course: Course; }
interface CartItem { id: string; course_id: string; created_at: string; course: Course; }

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
  const dialogRef = useDialog(onClose);
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "verify">("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

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
      // Supabase returns an error if the email is already registered.
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

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(4,8,16,.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Connexion / Inscription" tabIndex={-1} style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 22, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.7)", maxHeight: "90vh", overflowY: "auto" }}>
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
            <button onClick={onClose} aria-label="Fermer" style={btn({ background: C.bdr, color: C.t2, width: 30, height: 30, borderRadius: "50%", fontSize: 14 })}>✕</button>
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
    setItems((data || []) as unknown as CartItem[]);
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
    setEnrollments((data || []) as unknown as Enrollment[]);
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
    setCertificates((data || []) as unknown as Certificate[]);
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
  const dialogRef = useDialog(onClose);
  const { user } = useAuth();
  const { items, loading, removeFromCart, clearCart, total, count } = useCart(user);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState("");

  const doCheckout = async () => {
    if (checkingOut || items.length === 0) return;
    setCheckingOut(true); setCheckoutErr("");
    // NOTE: real payment must be confirmed before enrollment. The `enroll`
    // Edge Function is the single server-side choke point where that check lives.
    for (const it of items) {
      const r = await enrollInCourse(it.course_id);
      if (!r.ok) { setCheckoutErr("Échec de l'inscription. Réessayez."); setCheckingOut(false); return; }
    }
    await clearCart();
    setCheckingOut(false);
    onCheckout();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(4,8,16,.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Votre panier" tabIndex={-1} style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 22, width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", overflowX: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.7)" }}>
        <div style={{ background: "linear-gradient(135deg,#0E1A2C,#162438)", padding: "20px 24px", borderBottom: `1px solid ${C.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 600, color: "#fff" }}>Panier</div>
            <div style={{ fontSize: 12, color: C.t2 }}>{count} formation{count > 1 ? "s" : ""}</div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={btn({ background: C.bdr, color: C.t2, width: 32, height: 32, borderRadius: "50%", fontSize: 14 })}>✕</button>
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
            {checkoutErr && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>{checkoutErr}</div>}
            <button onClick={doCheckout} disabled={checkingOut} style={btn({ width: "100%", background: "linear-gradient(135deg,#C8971A,#E0A820)", color: C.bg, padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 14 })}>
              {checkingOut ? "Traitement…" : "Proceder au paiement"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── CERTIFICATE VIEW ─────────────── */
function CertificateView({ certificate, onClose, onShare }: { certificate: Certificate; onClose: () => void; onShare: () => void }) {
  const dialogRef = useDialog(onClose);
  const course = certificate.course;
  const [copied, setCopied] = useState(false);
  const verifyUrl = `${window.location.origin}/#verify-cert/${certificate.verification_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(4,8,16,.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflowY: "auto" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Certificat" tabIndex={-1} style={{ background: "#fff", borderRadius: 0, width: "100%", maxWidth: 800, maxHeight: "92vh", overflowY: "auto", overflowX: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.5)" }}>
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
  const { enrollments, loading: enrollLoading } = useEnrollments(user);
  const { certificates, hasCertificate, generateCertificate } = useCertificates(user);
  const [tab, setTab] = useState<"courses" | "certificates">("courses");
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [copied, setCopied] = useState(false);

  const completedCount = enrollments.filter(e => e.completed_at).length;
  const totalProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((acc, e) => acc + e.progress_pct, 0) / enrollments.length)
    : 0;

  const shareCertificate = (cert: Certificate) => {
    const url = `${window.location.origin}/#verify-cert/${cert.verification_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ minHeight: "100vh", background: C.bg, fontFamily: F.sans }}
    >
      {/* Top Navigation Bar */}
      <motion.div
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(8,17,30,.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.bdr}` }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <motion.div
            onClick={() => { window.location.hash = ""; }}
            whileHover={{ scale: 1.02 }}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          >
            <img src="/logo.png" alt="Beyrey Consulting" style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 8 }} />
            <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: "#fff" }}>Beyrey Consulting</div>
          </motion.div>
          <nav style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {[
              { label: "Accueil", hash: "", hoverColor: C.t },
              { label: "Catalogue", hash: "lms", hoverColor: C.gold },
              { label: "Contact", hash: "", hoverColor: C.t },
            ].map((item, i) => (
              <motion.button
                key={i}
                onClick={() => { window.location.hash = item.hash; }}
                whileHover={{ y: -2 }}
                style={{ background: "none", border: "none", color: C.t2, fontSize: 13, fontWeight: 600, padding: "6px 0", cursor: "pointer" }}
              >
                {item.label}
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#0E1A2C,#162438)", borderBottom: `1px solid ${C.bdr}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px 40px" }}>
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#C8971A,#E0A820)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: C.bg, fontWeight: 800, flexShrink: 0, boxShadow: "0 8px 32px rgba(200,151,26,.3)" }}
              >
                {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </motion.div>
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ fontSize: 28, fontFamily: F.serif, fontWeight: 600, color: "#fff" }}
                >
                  {profile?.full_name || "Étudiant"}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{ fontSize: 13, color: C.t2, fontFamily: F.mono }}
                >
                  {user.email}
                </motion.div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <motion.button
                onClick={() => { window.location.hash = "lms"; }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ background: C.gold, border: "none", color: C.bg, padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,151,26,.3)" }}
              >
                Explorer les formations
              </motion.button>
              <motion.button
                onClick={onSignOut}
                whileHover={{ backgroundColor: C.s3 }}
                whileTap={{ scale: 0.95 }}
                style={{ background: C.s2, border: `1px solid ${C.bdr}`, color: C.t2, padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Se déconnecter
              </motion.button>
            </div>
          </motion.div>

          {/* Stats with Animation */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginTop: 32 }}
          >
            {[
              { label: "Formations inscrites", value: enrollments.length, color: C.gold, icon: "📚" },
              { label: "Formations complétées", value: completedCount, color: C.grn, icon: "🎓" },
              { label: "Certificats obtenus", value: certificates.length, color: C.blue, icon: "🏆" },
              { label: "Progression globale", value: `${totalProgress}%`, color: C.gold, icon: "📈" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                whileHover={{ y: -4, boxShadow: `0 12px 40px ${stat.color}20` }}
                style={{ padding: "20px 24px", background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 16, position: "relative", overflow: "hidden" }}
              >
                <div style={{ position: "absolute", top: 12, right: 12, fontSize: 24, opacity: 0.3 }}>{stat.icon}</div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 150 }}
                  style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: stat.color }}
                >
                  {stat.value}
                </motion.div>
                <div style={{ fontSize: 11, color: C.t2, fontFamily: F.mono, letterSpacing: ".06em", textTransform: "uppercase", marginTop: 4 }}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Overall Progress Bar */}
          {enrollments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{ marginTop: 24, padding: "20px 24px", background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 16 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.t }}>Progression globale</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.gold, fontFamily: F.mono }}>{totalProgress}%</span>
              </div>
              <div style={{ height: 10, background: C.bdr, borderRadius: 5, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                  style={{ height: "100%", background: "linear-gradient(90deg, #C8971A, #E0A820)", borderRadius: 5 }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ display: "flex", gap: 8, marginBottom: 24 }}
        >
          {[
            { id: "courses", label: "Mes formations", icon: "📚" },
            { id: "certificates", label: `Certificats (${certificates.length})`, icon: "🏆" },
          ].map((t) => (
            <motion.button
              key={t.id}
              onClick={() => setTab(t.id as "courses" | "certificates")}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: tab === t.id ? C.gold : C.s2,
                border: `1px solid ${tab === t.id ? C.gold : C.bdr}`,
                color: tab === t.id ? C.bg : C.t2,
                padding: "12px 24px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{t.icon}</span>
              {t.label}
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {tab === "courses" && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {enrollLoading ? (
                <div style={{ textAlign: "center", padding: 60 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 40, height: 40, border: `3px solid ${C.bdr}`, borderTopColor: C.gold, borderRadius: "50%", margin: "0 auto 16px" }}
                  />
                  <div style={{ color: C.t3 }}>Chargement...</div>
                </div>
              ) : enrollments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: "center", padding: 60 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    style={{ fontSize: 64, marginBottom: 20 }}
                  >📚</motion.div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.t, marginBottom: 10 }}>Aucune formation</div>
                  <div style={{ fontSize: 14, color: C.t2, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
                    Explorez notre catalogue et inscrivez-vous à une formation pour commencer votre apprentissage.
                  </div>
                  <motion.button
                    onClick={() => { window.location.hash = "lms"; }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ background: C.gold, border: "none", color: C.bg, padding: "14px 28px", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 8px 24px rgba(200,151,26,.3)" }}
                  >
                    Découvrir le catalogue
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}
                >
                  {enrollments.map((en, idx) => (
                    <motion.div
                      key={en.id}
                      variants={staggerItem}
                      whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(0,0,0,.3)" }}
                      style={{ background: C.s1, border: `1px solid ${C.bdr}`, borderRadius: 20, overflow: "hidden" }}
                    >
                      {/* Card Header */}
                      <div style={{ padding: 24, background: `linear-gradient(135deg,${en.course?.color || C.gold}15,transparent)`, borderBottom: `1px solid ${C.bdr}` }}>
                        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                          <motion.div
                            whileHover={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.4 }}
                            style={{ width: 56, height: 56, borderRadius: 14, background: `${en.course?.color || C.gold}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}
                          >
                            {en.course?.icon || "📚"}
                          </motion.div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 17, fontWeight: 700, color: C.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{en.course?.title}</div>
                            <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: en.course?.color || C.gold, fontFamily: F.mono, fontWeight: 600, background: `${en.course?.color || C.gold}15`, padding: "3px 8px", borderRadius: 4 }}>{en.course?.category}</span>
                              <span style={{ fontSize: 11, color: C.t3, fontFamily: F.mono }}>{en.course?.level}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: 24 }}>
                        {/* Progress */}
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: C.t2, fontFamily: F.mono, letterSpacing: ".04em" }}>Progression</span>
                            <motion.span
                              key={en.progress_pct}
                              initial={{ scale: 1.3 }}
                              animate={{ scale: 1 }}
                              style={{ fontSize: 15, fontWeight: 800, color: en.progress_pct >= 100 ? C.grn : C.gold, fontFamily: F.mono }}
                            >
                              {en.progress_pct}%
                            </motion.span>
                          </div>
                          <div style={{ height: 8, background: C.bdr, borderRadius: 4, overflow: "hidden" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${en.progress_pct}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                              style={{ height: "100%", background: en.progress_pct >= 100 ? `linear-gradient(90deg, ${C.grn}, #4ade80)` : `linear-gradient(90deg, ${C.gold}, #E0A820)`, borderRadius: 4 }}
                            />
                          </div>
                        </div>

                        {/* Action Button */}
                        {en.completed_at && hasCertificate(en.course_id) ? (
                          <motion.button
                            onClick={() => {
                              const cert = certificates.find(c => c.course_id === en.course_id);
                              if (cert) setSelectedCert(cert);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ width: "100%", background: C.grn, border: "none", color: textOn(C.grn), padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                          >
                            <span>🏆</span> Voir mon certificat
                          </motion.button>
                        ) : en.progress_pct >= 100 && !hasCertificate(en.course_id) ? (
                          <motion.button
                            onClick={async () => { await generateCertificate(en.course_id); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ width: "100%", background: "linear-gradient(135deg,#C8971A,#E0A820)", border: "none", color: C.bg, padding: 14, borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 24px rgba(200,151,26,.3)" }}
                          >
                            <span>🏆</span> Obtenir mon certificat
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={() => onViewCourse(en.course_id)}
                            whileHover={{ scale: 1.02, backgroundColor: C.s3 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ width: "100%", background: C.s2, border: `1px solid ${C.bdr2}`, color: C.t, padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                          >
                            Continuer la formation →
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {tab === "certificates" && (
            <motion.div
              key="certificates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {certificates.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: "center", padding: 60 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    style={{ fontSize: 64, marginBottom: 20 }}
                  >🏆</motion.div>
                  <motion.div style={{ fontSize: 20, fontWeight: 700, color: C.t, marginBottom: 10 }}>Aucun certificat</motion.div>
                  <div style={{ fontSize: 14, color: C.t2, maxWidth: 400, margin: "0 auto" }}>
                    Complétez une formation pour obtenir votre premier certificat.
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}
                >
                  {certificates.map((cert, idx) => (
                    <motion.div
                      key={cert.id}
                      variants={staggerItem}
                      whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(200,151,26,.2)" }}
                      style={{ background: "linear-gradient(135deg,#fffdf8,#f5f0e8)", border: `2px solid #C8971A`, borderRadius: 20, padding: 28, textAlign: "center", position: "relative", overflow: "hidden" }}
                    >
                      <div style={{ position: "absolute", top: 16, right: 16, fontSize: 12, fontFamily: F.mono, color: "#8B7355", opacity: 0.5 }}>N° {cert.certificate_number}</div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
                        style={{ fontSize: 48, marginBottom: 16 }}
                      >🏆</motion.div>
                      <div style={{ fontSize: 10, color: "#8B7355", letterSpacing: ".2em", textTransform: "uppercase", fontFamily: F.mono, marginBottom: 8 }}>Certificat de Réussite</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", fontFamily: F.serif, marginBottom: 12 }}>{cert.course?.title}</div>
                      <div style={{ fontSize: 11, color: "#666", fontFamily: F.mono, marginBottom: 20 }}>
                        Délivré le {new Date(cert.issued_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                        <motion.button
                          onClick={() => setSelectedCert(cert)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ background: C.gold, border: "none", color: C.bg, padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                        >
                          Voir
                        </motion.button>
                        <motion.button
                          onClick={() => { shareCertificate(cert); }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ background: C.blue, border: "none", color: "#fff", padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                        >
                          {copied ? "✓ Copié" : "Partager"}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Certificate Modal */}
      <AnimatePresence>
        {selectedCert && (
          <CertificateView
            certificate={selectedCert}
            onClose={() => setSelectedCert(null)}
            onShare={() => { shareCertificate(selectedCert); setSelectedCert(null); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
