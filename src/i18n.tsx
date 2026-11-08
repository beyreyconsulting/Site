/* ═══════════════════════════════════════════════════════════════════════
   Trois langues : français, anglais, arabe
   ═══════════════════════════════════════════════════════════════════════

   LA CLÉ EST LE TEXTE FRANÇAIS, et ce n'est pas un raccourci. Avec des
   clés abstraites (`hero.title`), une clé oubliée affiche son code à
   l'écran — « hero.title » en gros sur la page d'accueil. Ici, le pire cas
   affiche le français : lisible pour tout le monde au Mali, et sans
   rupture visuelle. Le français n'a donc aucun dictionnaire : il EST les
   clés.

   CE QUI N'EST PAS TRADUIT, ET POURQUOI. Le contenu des cours
   (descriptions, programmes, compétences — `data.tsx`) reste en français :
   c'est de l'éditorial, il mérite un traducteur humain, pas une passe
   mécanique. L'administration non plus : une seule personne l'utilise.
   On traduit l'INTERFACE — ce qu'un visiteur rencontre.

   L'ARABE RETOURNE LA MISE EN PAGE. `dir="rtl"` sur la racine suffit
   parce que les styles emploient des propriétés LOGIQUES
   (`marginInlineStart`, `insetInlineStart`, `textAlign: "start"`) et non
   gauche/droite. Les trente-six endroits qui disaient encore
   « left »/« right » ont été convertis ; un test le garde.
   ═══════════════════════════════════════════════════════════════════════ */

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Langue = "fr" | "en" | "ar";

export const CLE_LANGUE = "beyrey:langue";

export const LANGUES: { code: Langue; nom: string; drapeau: string }[] = [
  { code: "fr", nom: "Français", drapeau: "FR" },
  { code: "en", nom: "English", drapeau: "EN" },
  { code: "ar", nom: "العربية", drapeau: "AR" },
];

/** Dictionnaires. Le français est absent : il est la clé. */
const TRADUCTIONS: Record<Exclude<Langue, "fr">, Record<string, string>> = {
  en: {
    // ----- Navigation et en-tête -----
    "Services": "Services",
    "Méthode DIAL™": "DIAL™ Method",
    "Témoignages": "Testimonials",
    "Blog": "Blog",
    "À propos": "About",
    "Contact": "Contact",
    "Connexion": "Sign in",
    "Nous contacter": "Contact us",
    "Espace": "Account",
    "Académie Kalan": "Kalan Academy",
    "Navigation principale": "Main navigation",

    // ----- Héros -----
    "Cabinet Data & BI — Bamako": "Data & BI consultancy — Bamako",
    "Transformez vos": "Turn your",
    "données en décisions.": "data into decisions.",
    "Réserver un appel": "Book a call",
    "Voir nos services": "See our services",
    "Gain d'efficacité": "Efficiency gain",
    "Entreprises formées": "Companies trained",
    "ROI moyen": "Average ROI",
    "PME aidées": "SMEs helped",
    "Étudiants formés": "Students trained",
    "de terrain à Bamako": "on the ground in Bamako",

    // ----- Académie -----
    "Aperçu gratuit": "Free preview",
    "S'inscrire": "Enrol",
    "étudiants": "students",
    "Formation phare": "Flagship course",
    "vidéos": "videos",
    "Programme": "Curriculum",
    "Leçon": "Lesson",
    "Contenu verrouillé": "Locked content",
    "Connexion requise": "Sign-in required",
    "Choisir le paiement": "Choose payment",
    "Paiement réussi !": "Payment successful!",
    "Progression du module": "Module progress",

    // ----- Formulaires et messages -----
    "Nom complet": "Full name",
    "Adresse email": "Email address",
    "Mot de passe": "Password",
    "Créer un compte": "Create an account",
    "Se connecter": "Sign in",
    "Mot de passe oublié ?": "Forgot your password?",
    "Envoyer": "Send",
    "Annuler": "Cancel",
    "Fermer": "Close",
    "Message envoyé !": "Message sent!",
    "Une erreur s'est produite": "Something went wrong",
    "Chargement…": "Loading…",

    // ----- Pied de page -----
    "Tous droits réservés": "All rights reserved",
    "Le livre": "The book",
    "Télécharger": "Download",

    // ----- Page d'accueil -----
    "CABINET DATA & BI · BAMAKO": "DATA & BI CONSULTANCY · BAMAKO",
    "ROI prouvé, méthodologie éprouvée DIAL™.": "Proven ROI, proven DIAL™ method.",
    "De zéro à votre premier dashboard professionnel": "From zero to your first professional dashboard",
    "RESSOURCE GRATUITE": "FREE RESOURCE",
    "LIVRE BLANC": "WHITE PAPER",
    "Le cadre exact que nous déployons chez nos clients pour poser une gouvernance data rigoureuse. Téléchargement immédiat.": "The exact framework we deploy with our clients to establish rigorous data governance. Instant download.",
    "C'est envoyé !": "Sent!",
    "Vérifiez votre boîte mail.": "Check your inbox.",
    "Email invalide. Réessayez.": "Invalid email. Try again.",
    "Choisissez votre": "Choose your",
    "prochaine compétence": "next skill",
    "Détails": "Details",
    "la gouvernance frugale": "frugal governance",
    "Ce que disent": "What our clients",
    "nos clients": "say",
    "Carnet de": "Field",
    "terrain": "notes",
    "Fondateur · Consultant Principal": "Founder · Principal Consultant",
    "Un projet data ?": "A data project?",
    "Parlons-en.": "Let's talk.",
    "Nous vous répondrons sous 24h.": "We'll reply within 24 hours.",
    "Nom complet *": "Full name *",
    "Ouvrir le menu": "Open menu",
    "Fermer le menu": "Close menu",
    "Votre email": "Your email",
  },

  ar: {
    // ----- Navigation et en-tête -----
    "Services": "الخدمات",
    "Méthode DIAL™": "منهج DIAL™",
    "Témoignages": "آراء العملاء",
    "Blog": "المدونة",
    "À propos": "من نحن",
    "Contact": "اتصل بنا",
    "Connexion": "تسجيل الدخول",
    "Nous contacter": "اتصل بنا",
    "Espace": "حسابي",
    "Académie Kalan": "أكاديمية كالان",
    "Navigation principale": "التنقل الرئيسي",

    // ----- Héros -----
    "Cabinet Data & BI — Bamako": "مكتب البيانات وذكاء الأعمال — باماكو",
    "Transformez vos": "حوّلوا",
    "données en décisions.": "بياناتكم إلى قرارات.",
    "Réserver un appel": "احجز مكالمة",
    "Voir nos services": "اطّلع على خدماتنا",
    "Gain d'efficacité": "تحسّن الأداء",
    "Entreprises formées": "شركة مدرَّبة",
    "ROI moyen": "متوسط العائد",
    "PME aidées": "مؤسسة مستفيدة",
    "Étudiants formés": "طالب مدرَّب",
    "de terrain à Bamako": "من الخبرة الميدانية في باماكو",

    // ----- Académie -----
    "Aperçu gratuit": "معاينة مجانية",
    "S'inscrire": "سجّل الآن",
    "étudiants": "طالباً",
    "Formation phare": "الدورة الأبرز",
    "vidéos": "فيديو",
    "Programme": "المحتوى",
    "Leçon": "درس",
    "Contenu verrouillé": "محتوى مقفل",
    "Connexion requise": "يلزم تسجيل الدخول",
    "Choisir le paiement": "اختر طريقة الدفع",
    "Paiement réussi !": "تم الدفع بنجاح!",
    "Progression du module": "تقدّم الوحدة",

    // ----- Formulaires et messages -----
    "Nom complet": "الاسم الكامل",
    "Adresse email": "البريد الإلكتروني",
    "Mot de passe": "كلمة المرور",
    "Créer un compte": "إنشاء حساب",
    "Se connecter": "تسجيل الدخول",
    "Mot de passe oublié ?": "هل نسيت كلمة المرور؟",
    "Envoyer": "إرسال",
    "Annuler": "إلغاء",
    "Fermer": "إغلاق",
    "Message envoyé !": "تم إرسال الرسالة!",
    "Une erreur s'est produite": "حدث خطأ ما",
    "Chargement…": "جارٍ التحميل…",

    // ----- Pied de page -----
    "Tous droits réservés": "جميع الحقوق محفوظة",
    "Le livre": "الكتاب",
    "Télécharger": "تحميل",

    // ----- Page d'accueil -----
    "CABINET DATA & BI · BAMAKO": "مكتب البيانات وذكاء الأعمال · باماكو",
    "ROI prouvé, méthodologie éprouvée DIAL™.": "عائد مثبت، ومنهج DIAL™ مجرَّب.",
    "De zéro à votre premier dashboard professionnel": "من الصفر إلى أول لوحة معلومات مهنية",
    "RESSOURCE GRATUITE": "مورد مجاني",
    "LIVRE BLANC": "ورقة بيضاء",
    "Le cadre exact que nous déployons chez nos clients pour poser une gouvernance data rigoureuse. Téléchargement immédiat.": "الإطار نفسه الذي نطبّقه لدى عملائنا لإرساء حوكمة بيانات صارمة. تحميل فوري.",
    "C'est envoyé !": "تم الإرسال!",
    "Vérifiez votre boîte mail.": "تحقّقوا من بريدكم.",
    "Email invalide. Réessayez.": "بريد غير صالح. حاولوا مجدداً.",
    "Choisissez votre": "اختاروا",
    "prochaine compétence": "مهارتكم التالية",
    "Détails": "التفاصيل",
    "la gouvernance frugale": "الحوكمة الرشيدة",
    "Ce que disent": "ما يقوله",
    "nos clients": "عملاؤنا",
    "Carnet de": "دفتر",
    "terrain": "الميدان",
    "Fondateur · Consultant Principal": "المؤسس · المستشار الرئيسي",
    "Un projet data ?": "لديكم مشروع بيانات؟",
    "Parlons-en.": "لنتحدّث.",
    "Nous vous répondrons sous 24h.": "سنردّ عليكم خلال ٢٤ ساعة.",
    "Nom complet *": "الاسم الكامل *",
    "Ouvrir le menu": "فتح القائمة",
    "Fermer le menu": "إغلاق القائمة",
    "Votre email": "بريدكم الإلكتروني",
  },
};

export function langueMemorisee(): Langue {
  try {
    const v = localStorage.getItem(CLE_LANGUE);
    if (v === "fr" || v === "en" || v === "ar") return v;
  } catch { /* stockage refusé : on part du français */ }
  return "fr";
}

/** Pose la langue ET le sens de lecture sur la racine.
 *
 *  `lang` sert aux lecteurs d'écran et à la césure ; `dir` retourne la
 *  mise en page. Les deux vont ensemble : un texte arabe dans une page
 *  déclarée `ltr` se lit de travers, ponctuation comprise.
 */
export function appliquerLangue(langue: Langue): void {
  const racine = document.documentElement;
  racine.setAttribute("lang", langue);
  racine.setAttribute("dir", langue === "ar" ? "rtl" : "ltr");
  try {
    if (langue === "fr") localStorage.removeItem(CLE_LANGUE);
    else localStorage.setItem(CLE_LANGUE, langue);
  } catch { /* la langue s'applique quand même, sans survivre au rechargement */ }
}

type Contexte = { langue: Langue; choisir: (l: Langue) => void; t: (cle: string) => string };

const ContexteLangue = createContext<Contexte>({
  langue: "fr", choisir: () => {}, t: (cle) => cle,
});

export function FournisseurLangue({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>(langueMemorisee);

  useEffect(() => { appliquerLangue(langue); }, [langue]);

  /** Traduit, ou rend la clé — c'est-à-dire le français. Une chaîne
   *  oubliée au dictionnaire reste donc lisible, au lieu d'afficher un
   *  code à la place du texte. */
  const t = (cle: string): string => {
    if (langue === "fr") return cle;
    return TRADUCTIONS[langue][cle] ?? cle;
  };

  return (
    <ContexteLangue.Provider value={{ langue, choisir: setLangue, t }}>
      {children}
    </ContexteLangue.Provider>
  );
}

export function useLangue(): Contexte {
  return useContext(ContexteLangue);
}

/** Les clés que le dictionnaire connaît — sert au test de complétude. */
export function clesTraduites(langue: Exclude<Langue, "fr">): string[] {
  return Object.keys(TRADUCTIONS[langue]);
}

/* ───────────────────────────────────────────────────────────────────────
   Le sélecteur de langue
   ─────────────────────────────────────────────────────────────────────── */

/** Trois boutons plutôt qu'une liste déroulante : à trois entrées, la
 *  liste coûte un geste de plus pour rien, et cache deux langues sur
 *  trois. Chacune s'écrit DANS SA PROPRE LANGUE — « العربية », pas
 *  « Arabe » : quelqu'un qui cherche l'arabe ne lit pas le français. */
export function SelecteurLangue() {
  const { langue, choisir } = useLangue();
  return (
    <div
      role="group"
      aria-label="Langue"
      style={{ display: "inline-flex", gap: 2, alignItems: "center" }}
    >
      {LANGUES.map(l => {
        const actif = l.code === langue;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => choisir(l.code)}
            aria-pressed={actif}
            lang={l.code}
            title={l.nom}
            style={{
              cursor: "pointer",
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              letterSpacing: ".06em",
              minHeight: 40,
              minWidth: 34,
              padding: "0 7px",
              borderRadius: 8,
              border: "1px solid",
              borderColor: actif
                ? "rgb(var(--or-rgb) / 45%)"
                : "rgb(var(--bordure-rgb))",
              background: actif ? "rgb(var(--or-rgb) / 12%)" : "none",
              color: actif
                ? "rgb(var(--or-rgb))"
                : "rgb(var(--texte3-rgb))",
            }}
          >
            {l.drapeau}
          </button>
        );
      })}
    </div>
  );
}
