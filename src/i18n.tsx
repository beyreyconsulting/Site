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

    // ----- Academie, paiement, livre blanc -----
    "QUIZ": "QUIZ",
    "Score minimum": "Minimum score",
    "Explication :": "Explanation:",
    "QUESTIONS & REPONSES": "QUESTIONS & ANSWERS",
    "Zone de discussion": "Discussion area",
    "Posez votre question": "Ask your question",
    "Posez votre question…": "Ask your question…",
    "Votre question...": "Your question...",
    "Question envoyee ! Un formateur vous repondra bientot.": "Question sent! An instructor will reply shortly.",
    "Aucune question pour cette lecon. Soyez le premier a poser la votre !": "No questions on this lesson yet. Be the first to ask!",
    "REPONDU": "ANSWERED",
    "FORMATEUR": "INSTRUCTOR",
    "RESSOURCES": "RESOURCES",
    "Fichiers du cours": "Course files",
    "Aucune video pour cette lecon": "No video for this lesson",
    "A propos de cette lecon": "About this lesson",
    "Sélectionnez votre mode de paiement": "Choose your payment method",
    "Numéro de téléphone": "Phone number",
    "Numéro de carte": "Card number",
    "Expiration": "Expiry",
    "CVC": "CVC",
    "Traitement du paiement en cours...": "Processing payment…",
    "Vous avez maintenant accès à la formation.": "You now have access to the course.",
    "Livre blanc · Gratuit": "White paper · Free",
    "Manifeste pour une gouvernance frugale de la data en Afrique": "A manifesto for frugal data governance in Africa",
    "Télécharger le livre blanc": "Download the white paper",
    "Préparation du téléchargement…": "Preparing your download…",
    "Votre téléchargement a démarré !": "Your download has started!",
    "cliquez ici": "click here",
    "Entreprise": "Company",
    "Poste": "Role",
    "Compétences acquises": "Skills you'll gain",
    "Approche pédagogique": "Teaching approach",
    "Accès à vie · Certification incluse": "Lifetime access · Certificate included",
    "Partagez cet article": "Share this article",
    "Ouvrir Kalan": "Open Kalan",
    "Votre question à Kalan": "Your question for Kalan",
    "aide les entreprises maliennes à exploiter la puissance de leurs données.": "helps Malian businesses put their data to work.",

    // ----- Espace etudiant -----
    "Connexion / Inscription": "Sign in / Sign up",
    "Email": "Email",
    "Email *": "Email *",
    "Mot de passe *": "Password *",
    "Confirmer le mot de passe *": "Confirm password *",
    "Minimum 8 caracteres": "At least 8 characters",
    "Retapez le mot de passe": "Re-enter your password",
    "Panier": "Cart",
    "Votre panier": "Your cart",
    "Votre panier est vide": "Your cart is empty",
    "Retirer": "Remove",
    "Total": "Total",
    "Inscription confirmée !": "Enrolment confirmed!",
    "Vous avez maintenant accès à vos formations.": "You now have access to your courses.",
    "Commande enregistrée": "Order recorded",
    "J'ai compris": "Got it",
    "Chargement...": "Loading…",
    "Certificat": "Certificate",
    "Certificat de Reussite": "Certificate of Completion",
    "Certificat de Réussite": "Certificate of Completion",
    "atteste que": "certifies that",
    "a suivi avec succes la formation": "has successfully completed the course",
    "Date": "Date",
    "N° Certificat": "Certificate no.",
    "Code Verification": "Verification code",
    "Lien de verification": "Verification link",
    "Progression": "Progress",
    "Progression globale": "Overall progress",
    "Aucune formation": "No courses yet",
    "Aucun certificat": "No certificates yet",

    // ----- Libelles accessibles et formulaire -----
    "Organisation": "Organisation",
    "Email pro *": "Work email *",
    "Email professionnel": "Work email",
    "Téléphone": "Phone",
    "Votre besoin *": "What you need *",
    "Votre besoin": "What you need",
    "— Sélectionnez —": "— Select —",
    "Vos blocages actuels": "What is blocking you",
    "Décrivez brièvement votre situation...": "Briefly describe your situation…",
    "Votre nom": "Your name",
    "Contacter sur WhatsApp": "Contact us on WhatsApp",
    "Langue": "Language",
    "Section": "Section",
    "Thème du système": "System theme",
    "Thème clair": "Light theme",
    "Thème sombre": "Dark theme",
    "Cliquer pour passer au thème du système.": "Click to switch to the system theme.",
    "Cliquer pour passer au thème clair.": "Click to switch to the light theme.",
    "Cliquer pour passer au thème sombre.": "Click to switch to the dark theme.",
    "Cette formation n'existe pas ou n'est pas encore publiee.": "This course does not exist, or is not published yet.",
    "A PROPOS DE LA FORMATION": "ABOUT THIS COURSE",
    "Contenu du cours": "Course content",
    "Le contenu de cette formation sera bientot disponible.": "This course's content is coming soon.",
    "Catalogue des formations": "Course catalogue",
    "Explorez nos formations disponibles et lancez-vous.": "Browse the courses on offer and get started.",
    "Les formations seront bientot publiees.": "Courses will be published soon.",
    "Aller à mon espace": "Go to my dashboard",
    "ou": "or",
    "Formation introuvable": "Course not found",
    "Aucune formation disponible": "No courses available",

    // ----- Etiquettes et chapeaux de section -----
    "Catalogue · 6 formations": "Catalogue · 6 courses",
    "Des formations conçues pour le contexte malien. 80% de pratique, 100% de terrain.": "Courses built for the Malian context. 80% practice, 100% from the field.",
    "Méthode propriétaire": "Proprietary method",
    "Diagnostiquer, Implémenter, Automatiser, Livrer. Une méthode conçue pour la réalité africaine, pas pour les éditeurs occidentaux.": "Diagnose, Implement, Automate, Deliver. A method built for African realities, not for Western vendors.",
    "Ils nous font confiance": "They trust us",
    "PME, ONG, institutions financières. 465+ professionnels formés au Mali.": "SMEs, NGOs, financial institutions. 465+ professionals trained in Mali.",
    "Le journal · Beyrey": "The journal · Beyrey",
    "Stratégie, méthodes, études de cas. 5 ans de terrain malien racontés sans filtre.": "Strategy, methods, case studies. Five years of Malian fieldwork, told plainly.",
    "Le cabinet": "The firm",
    "Travaillons ensemble": "Let us work together",
    "Directeur Data": "Head of Data",
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

    // ----- Academie, paiement, livre blanc -----
    "QUIZ": "اختبار",
    "Score minimum": "الدرجة الدنيا",
    "Explication :": "الشرح:",
    "QUESTIONS & REPONSES": "أسئلة وأجوبة",
    "Zone de discussion": "مساحة النقاش",
    "Posez votre question": "اطرح سؤالك",
    "Posez votre question…": "اطرح سؤالك…",
    "Votre question...": "سؤالك...",
    "Question envoyee ! Un formateur vous repondra bientot.": "تم إرسال السؤال! سيردّ عليك أحد المدرّبين قريباً.",
    "Aucune question pour cette lecon. Soyez le premier a poser la votre !": "لا توجد أسئلة على هذا الدرس بعد. كن أول من يسأل!",
    "REPONDU": "تمت الإجابة",
    "FORMATEUR": "المدرّب",
    "RESSOURCES": "الموارد",
    "Fichiers du cours": "ملفات الدورة",
    "Aucune video pour cette lecon": "لا يوجد فيديو لهذا الدرس",
    "A propos de cette lecon": "عن هذا الدرس",
    "Sélectionnez votre mode de paiement": "اختر طريقة الدفع",
    "Numéro de téléphone": "رقم الهاتف",
    "Numéro de carte": "رقم البطاقة",
    "Expiration": "تاريخ الانتهاء",
    "CVC": "رمز التحقق",
    "Traitement du paiement en cours...": "جارٍ معالجة الدفع…",
    "Vous avez maintenant accès à la formation.": "أصبح لديك وصول إلى الدورة.",
    "Livre blanc · Gratuit": "ورقة بيضاء · مجاناً",
    "Manifeste pour une gouvernance frugale de la data en Afrique": "بيان من أجل حوكمة رشيدة للبيانات في أفريقيا",
    "Télécharger le livre blanc": "تحميل الورقة البيضاء",
    "Préparation du téléchargement…": "جارٍ تجهيز التحميل…",
    "Votre téléchargement a démarré !": "بدأ التحميل!",
    "cliquez ici": "اضغط هنا",
    "Entreprise": "الشركة",
    "Poste": "المنصب",
    "Compétences acquises": "المهارات المكتسبة",
    "Approche pédagogique": "المنهج التعليمي",
    "Accès à vie · Certification incluse": "وصول مدى الحياة · مع شهادة",
    "Partagez cet article": "شارك هذا المقال",
    "Ouvrir Kalan": "افتح كالان",
    "Votre question à Kalan": "سؤالك لكالان",
    "aide les entreprises maliennes à exploiter la puissance de leurs données.": "يساعد المؤسسات المالية على الاستفادة من بياناتها.",

    // ----- Espace etudiant -----
    "Connexion / Inscription": "تسجيل الدخول / إنشاء حساب",
    "Email": "البريد الإلكتروني",
    "Email *": "البريد الإلكتروني *",
    "Mot de passe *": "كلمة المرور *",
    "Confirmer le mot de passe *": "تأكيد كلمة المرور *",
    "Minimum 8 caracteres": "٨ أحرف على الأقل",
    "Retapez le mot de passe": "أعد كتابة كلمة المرور",
    "Panier": "السلة",
    "Votre panier": "سلتك",
    "Votre panier est vide": "سلتك فارغة",
    "Retirer": "إزالة",
    "Total": "المجموع",
    "Inscription confirmée !": "تم تأكيد التسجيل!",
    "Vous avez maintenant accès à vos formations.": "أصبح لديك وصول إلى دوراتك.",
    "Commande enregistrée": "تم تسجيل الطلب",
    "J'ai compris": "فهمت",
    "Chargement...": "جارٍ التحميل…",
    "Certificat": "الشهادة",
    "Certificat de Reussite": "شهادة إتمام",
    "Certificat de Réussite": "شهادة إتمام",
    "atteste que": "تشهد بأن",
    "a suivi avec succes la formation": "قد أتمّ بنجاح دورة",
    "Date": "التاريخ",
    "N° Certificat": "رقم الشهادة",
    "Code Verification": "رمز التحقق",
    "Lien de verification": "رابط التحقق",
    "Progression": "التقدّم",
    "Progression globale": "التقدّم الإجمالي",
    "Aucune formation": "لا توجد دورات بعد",
    "Aucun certificat": "لا توجد شهادات بعد",

    // ----- Libelles accessibles et formulaire -----
    "Organisation": "المؤسسة",
    "Email pro *": "البريد المهني *",
    "Email professionnel": "البريد المهني",
    "Téléphone": "الهاتف",
    "Votre besoin *": "ما الذي تحتاجه *",
    "Votre besoin": "ما الذي تحتاجه",
    "— Sélectionnez —": "— اختر —",
    "Vos blocages actuels": "ما الذي يعيقك",
    "Décrivez brièvement votre situation...": "صف وضعك باختصار…",
    "Votre nom": "اسمك",
    "Contacter sur WhatsApp": "تواصل عبر واتساب",
    "Langue": "اللغة",
    "Section": "القسم",
    "Thème du système": "سمة النظام",
    "Thème clair": "السمة الفاتحة",
    "Thème sombre": "السمة الداكنة",
    "Cliquer pour passer au thème du système.": "اضغط للتبديل إلى سمة النظام.",
    "Cliquer pour passer au thème clair.": "اضغط للتبديل إلى السمة الفاتحة.",
    "Cliquer pour passer au thème sombre.": "اضغط للتبديل إلى السمة الداكنة.",
    "Cette formation n'existe pas ou n'est pas encore publiee.": "هذه الدورة غير موجودة أو لم تُنشر بعد.",
    "A PROPOS DE LA FORMATION": "عن هذه الدورة",
    "Contenu du cours": "محتوى الدورة",
    "Le contenu de cette formation sera bientot disponible.": "سيتوفر محتوى هذه الدورة قريباً.",
    "Catalogue des formations": "دليل الدورات",
    "Explorez nos formations disponibles et lancez-vous.": "تصفّح الدورات المتاحة وابدأ.",
    "Les formations seront bientot publiees.": "ستُنشر الدورات قريباً.",
    "Aller à mon espace": "اذهب إلى مساحتي",
    "ou": "أو",
    "Formation introuvable": "الدورة غير موجودة",
    "Aucune formation disponible": "لا توجد دورات متاحة",

    // ----- Etiquettes et chapeaux de section -----
    "Catalogue · 6 formations": "الدليل · ٦ دورات",
    "Des formations conçues pour le contexte malien. 80% de pratique, 100% de terrain.": "دورات مصمّمة للسياق المالي. ٨٠٪ تطبيق، ١٠٠٪ من الميدان.",
    "Méthode propriétaire": "منهجية خاصة",
    "Diagnostiquer, Implémenter, Automatiser, Livrer. Une méthode conçue pour la réalité africaine, pas pour les éditeurs occidentaux.": "التشخيص، التنفيذ، الأتمتة، التسليم. منهجية مصمّمة للواقع الأفريقي، لا لموردي الغرب.",
    "Ils nous font confiance": "يثقون بنا",
    "PME, ONG, institutions financières. 465+ professionnels formés au Mali.": "شركات صغيرة ومتوسطة، منظمات غير حكومية، مؤسسات مالية. أكثر من ٤٦٥ مهنياً تدرّبوا في مالي.",
    "Le journal · Beyrey": "المدوّنة · بيري",
    "Stratégie, méthodes, études de cas. 5 ans de terrain malien racontés sans filtre.": "استراتيجية ومنهجيات ودراسات حالة. خمس سنوات من العمل الميداني في مالي، بلا تجميل.",
    "Le cabinet": "المكتب",
    "Travaillons ensemble": "لنعمل معاً",
    "Directeur Data": "مدير البيانات",
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
  const { langue, choisir, t } = useLangue();
  return (
    <div
      role="group"
      aria-label={t("Langue")}
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
