/* ═══════════════════════════════════════════════════
   DESIGN TOKENS — "Nuit de Bamako" (continuité V2)
═══════════════════════════════════════════════════ */
export const C = {
  bg:"#08111E", s1:"#0E1A2C", s2:"#162438", s3:"#1E3054",
  bdr:"#1E3254", bdr2:"#263D6A",
  gold:"#C8971A", gl:"#E0A820", gp:"rgba(200,151,26,.12)",
  grn:"#00C896", gp2:"rgba(0,200,150,.10)",
  red:"#E84040", rdp:"rgba(232,64,64,.10)",
  blue:"#2062E8", blp:"rgba(32,98,232,.10)",
  wa:"#25D366",
  t:"#E6E1D8", t2:"#8A9CBE", t3:"#4A5E7A",
  iv:"#F4EFE6", iv2:"#E8E1D4", tl:"#1A2840", tl2:"#4A5E78",
};
export const F = {
  serif:"'Cormorant Garamond',Georgia,serif",
  sans:"'Plus Jakarta Sans',system-ui,sans-serif",
  mono:"'DM Mono',monospace",
};
export const GFONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap";

/* ═══════════════════════════════════════════════════
   COURSES DATA
═══════════════════════════════════════════════════ */
export const COURSES = [
  {
    id:1,icon:"📊",color:C.gold,cat:"Power BI",lvl:"Débutant",
    title:"Power BI pour PME Maliennes",
    sub:"De zéro à votre premier dashboard professionnel",
    price:75000,orig:100000,dur:"8h",vids:24,students:147,rating:4.9,reviews:43,preview:true,
    desc:"La formation Power BI la plus adaptée au contexte malien. Construisez des tableaux de bord interactifs pour votre PME avec des exemples et données tirés du terrain malien — EDM, FCFA, délais de paiement B2B.",
    skills:["Power BI Desktop","Power Query","DAX","Star Schema","KPIs PME"],
    curriculum:[
      {t:"Introduction à Power BI Desktop",n:4,d:"1h20"},
      {t:"Importer et transformer vos données",n:5,d:"1h45"},
      {t:"Modélisation — Star Schema",n:4,d:"1h30"},
      {t:"Créer vos premiers visuels",n:5,d:"1h40"},
      {t:"Formules DAX fondamentales",n:4,d:"1h25"},
      {t:"Publier et partager votre rapport",n:2,d:"40min"},
    ],
  },
  {
    id:2,icon:"📗",color:C.grn,cat:"Excel",lvl:"Intermédiaire",
    title:"Excel Avancé pour PME",
    sub:"Tableaux croisés, formules avancées et automatisation",
    price:45000,orig:60000,dur:"5h",vids:18,students:89,rating:4.8,reviews:28,preview:false,
    desc:"Maîtrisez Excel à un niveau professionnel — TCD, INDEX/EQUIV, Power Query, et initiation VBA. Adapté aux réalités des PME maliennes avec des cas concrets locaux.",
    skills:["Excel Avancé","TCD","Power Query","Formules avancées","VBA initiation"],
    curriculum:[
      {t:"Formules avancées (INDEX, EQUIV, INDIRECT)",n:4,d:"1h10"},
      {t:"Tableaux croisés dynamiques",n:4,d:"1h20"},
      {t:"Power Query — nettoyer et transformer",n:4,d:"1h30"},
      {t:"Graphiques et visualisations avancées",n:3,d:"55min"},
      {t:"Introduction à VBA et automatisation",n:3,d:"1h05"},
    ],
  },
  {
    id:3,icon:"🏛️",color:"#E060C0",cat:"Gouvernance",lvl:"Expert",
    title:"Gouvernance Data DIAL™",
    sub:"La méthode de gouvernance data conçue pour l'Afrique",
    price:120000,orig:160000,dur:"12h",vids:36,students:34,rating:5.0,reviews:18,preview:false,
    desc:"La formation phare Beyrey Consulting. Maîtrisez la méthode DIAL™ complète et devenez expert de la gouvernance data adaptée au contexte africain. Inclut une certification.",
    skills:["DIAL™","Gouvernance data","Stratégie","Change management","Audit data"],
    curriculum:[
      {t:"Fondements — gouvernance data en Afrique",n:5,d:"2h"},
      {t:"D — Diagnostiquer vos données",n:7,d:"2h30"},
      {t:"I — Implémenter les bons outils",n:6,d:"2h20"},
      {t:"A — Automatiser le travail manuel",n:8,d:"2h45"},
      {t:"L — Livrer et former vos équipes",n:6,d:"2h25"},
      {t:"Projet de certification DIAL™",n:4,d:"Pratique"},
    ],
  },
  {
    id:4,icon:"🐍",color:C.blue,cat:"Python",lvl:"Intermédiaire",
    title:"Python pour la Data",
    sub:"Analyse de données et ETL avec Python",
    price:90000,orig:120000,dur:"10h",vids:30,students:62,rating:4.7,reviews:22,preview:false,
    desc:"Apprenez Python pour l'analyse de données — pandas, numpy, matplotlib, ETL. Avec des datasets réels inspirés du marché malien et des cas d'usage ONG et PME.",
    skills:["Python","Pandas","ETL","Matplotlib","API data"],
    curriculum:[
      {t:"Python fondamentaux pour la data",n:5,d:"1h45"},
      {t:"Pandas — manipuler les données",n:6,d:"2h20"},
      {t:"Visualisations avec matplotlib",n:5,d:"1h50"},
      {t:"ETL — extraire, transformer, charger",n:7,d:"2h30"},
      {t:"Projet final — pipeline complet",n:7,d:"Pratique"},
    ],
  },
  {
    id:5,icon:"🌱",color:"#00B884",cat:"Power BI",lvl:"Intermédiaire",
    title:"Dashboard ONG & Bailleurs",
    sub:"Reporting automatisé pour les acteurs humanitaires",
    price:60000,orig:80000,dur:"6h",vids:20,students:78,rating:4.9,reviews:31,preview:true,
    desc:"Spécialement conçu pour les acteurs humanitaires au Mali. Automatisez vos rapports bailleur, centralisez vos données terrain et créez des dashboards de suivi de projet.",
    skills:["Power BI","M&E","Indicateurs bailleur","Données terrain","OCHA"],
    curriculum:[
      {t:"Structure de données ONG — terrain",n:4,d:"1h20"},
      {t:"Centraliser les données terrain",n:4,d:"1h25"},
      {t:"Indicateurs bailleur — SPHERE, M&E",n:4,d:"1h30"},
      {t:"Dashboard de suivi Power BI",n:5,d:"1h45"},
      {t:"Rapport bailleur automatisé",n:3,d:"1h"},
    ],
  },
  {
    id:6,icon:"🗄️",color:"#F08040",cat:"SQL",lvl:"Débutant",
    title:"SQL et Modélisation des Données",
    sub:"Bases de données relationnelles pour la BI",
    price:50000,orig:65000,dur:"6h",vids:22,students:55,rating:4.6,reviews:19,preview:false,
    desc:"Apprenez SQL de zéro et maîtrisez la modélisation relationnelle. Exercices sur des données d'entreprises maliennes fictives (commerce, microfinance, ONG).",
    skills:["SQL","Modélisation","Star Schema","Bases de données","BI"],
    curriculum:[
      {t:"Introduction aux bases de données",n:4,d:"1h20"},
      {t:"SQL fondamentaux — SELECT, WHERE, JOIN",n:5,d:"1h45"},
      {t:"Agrégations et fonctions analytiques",n:4,d:"1h30"},
      {t:"Modélisation Star Schema pour BI",n:5,d:"1h40"},
      {t:"Optimisation et bonnes pratiques",n:4,d:"1h25"},
    ],
  },
];

/* ═══════════════════════════════════════════════════
   BLOG POSTS
═══════════════════════════════════════════════════ */
export const POSTS = [
  {
    id:1,cat:"Stratégie",time:"5 min",date:"15 Jan 2025",icon:"📊",
    title:"Pourquoi 90% des PME maliennes n'exploitent pas leurs données",
    excerpt:"J'ai visité plus de 40 entreprises à Bamako. Dans 9 cas sur 10, les données existent — mais elles dorment dans des fichiers Excel que personne n'analyse.",
    body:`J'ai visité plus de 40 entreprises à Bamako en 5 ans. Dans 9 cas sur 10, le problème n'est pas un manque de données. C'est un manque de méthode pour les exploiter.

**Ce que j'ai trouvé partout**

Dans presque chaque PME que j'ai visitée : des fichiers Excel éparpillés entre plusieurs personnes, des données saisies en double, des décisions prises à l'intuition parce que "le rapport n'était pas encore prêt."

**Pourquoi ça reste ainsi**

Trois raisons. D'abord, le coût perçu : les dirigeants associent "data" à des projets à 10 millions de FCFA. Ensuite, le manque de compétences internes. Enfin, l'urgence du quotidien : quand le téléphone sonne et qu'il faut livrer, la data passe en dernier.

**La bonne nouvelle**

La gouvernance frugale — au cœur de DIAL™ — montre qu'on peut résoudre 80% des problèmes data d'une PME malienne avec Power BI Desktop et Power Query. Sans serveur coûteux. Sans consultant expatrié. Le plus grand frein n'est pas financier : c'est culturel.`,
  },
  {
    id:2,cat:"Power BI",time:"7 min",date:"22 Jan 2025",icon:"⚖️",
    title:"Power BI vs Excel : lequel choisir pour votre PME ?",
    excerpt:"La vraie question n'est pas laquelle est 'meilleur' — c'est laquelle correspond à votre situation aujourd'hui. Une grille de décision honnête.",
    body:`La question revient dans presque chaque audit : "On devrait passer à Power BI ou améliorer notre Excel ?"

**Restez sur Excel si :**

Vos données tiennent dans un seul fichier de moins de 100 000 lignes. Votre reporting est mensuel et individuel. Votre équipe maîtrise déjà Excel et vous n'avez pas de budget formation supplémentaire.

**Passez à Power BI si :**

Vous avez des données dans plusieurs sources (Excel + logiciel + ERP). Plusieurs personnes doivent accéder au même rapport. Votre reporting prend plus de 2 heures par mois.

**La transition la plus courante**

Power Query dans Excel d'abord, puis Power BI Desktop ensuite. Ce n'est pas tout ou rien. Et Power BI lit vos fichiers Excel directement — la migration n'est pas un recommencement.`,
  },
  {
    id:3,cat:"Gouvernance",time:"8 min",date:"01 Fév 2025",icon:"🌍",
    title:"La gouvernance frugale des données en Afrique",
    excerpt:"Extraits de 'L'Art de la Rigueur' — pourquoi les meilleures solutions data pour l'Afrique ne viennent pas des éditeurs occidentaux.",
    body:`Ce texte est adapté de mon livre "L'Art de la Rigueur — Manifeste pour une Gouvernance Frugale de la Data en Afrique."

**Le problème des solutions importées**

Quand une multinationale implante un ERP à plusieurs millions de FCFA dans une PME malienne, le projet échoue dans 7 cas sur 10. Pas parce que l'outil est mauvais. Parce qu'il n'a pas été conçu pour la réalité locale : coupures EDM, connectivité instable, données partiellement sur papier, équipes formées à Excel.

**La frugalité comme philosophie**

La gouvernance frugale n'est pas un compromis par manque de moyens. C'est maximiser la valeur par franc CFA investi. Préférer un outil installé localement à un cloud instable. Investir davantage en formation qu'en licences. Concevoir des systèmes qui fonctionnent encore quand le consultant est parti.`,
  },
  {
    id:4,cat:"Étude de cas",time:"4 min",date:"10 Fév 2025",icon:"🏭",
    title:"EMICOM Mali : de 3 jours à 20 minutes de reporting",
    excerpt:"Comment nous avons transformé le reporting mensuel d'une entreprise industrielle malienne avec Power BI et un pipeline ETL sur mesure.",
    body:`EMICOM Mali est une entreprise du secteur de l'énergie et de l'ingénierie. Leur reporting mensuel prenait 3 jours de travail manuel.

**Le diagnostic initial (phase D — DIAL™)**

Les données venaient de 4 sources différentes. Chaque mois, une personne passait 3 jours à les consolider à la main dans un Excel de synthèse.

**Ce que nous avons construit**

Un pipeline ETL en Power Query qui collecte automatiquement les données de toutes les sources. Un modèle Star Schema. Six pages de tableau de bord Power BI : finances, ventes, opérations, RH, qualité, suivi projets.

**Le résultat**

De 3 jours à 20 minutes. L'équipe a été formée en 2 jours. Ils maintiennent et font évoluer le dashboard eux-mêmes, sans intervention externe.`,
  },
  {
    id:5,cat:"KPIs",time:"6 min",date:"18 Fév 2025",icon:"📈",
    title:"5 KPIs que tout DG malien devrait suivre chaque semaine",
    excerpt:"Pas les KPIs génériques des livres de management. Les 5 indicateurs qui reflètent la réalité des PME maliennes.",
    body:`Ces 5 indicateurs viennent de 5 ans de terrain, pas d'un manuel occidental.

**1. Taux de recouvrement des créances**
Dans un contexte où les délais B2B dépassent 60 jours, suivre ce ratio est vital. Cible : > 75%.

**2. Coût par acquisition client (CAC)**
Beaucoup de PME maliennes n'ont jamais calculé ce chiffre. Pourtant, c'est lui qui dit si votre marketing est rentable.

**3. Taux de marge brute**
Pas le bénéfice net — la marge brute. C'est la ressource disponible avant charges fixes.

**4. Productivité par employé**
CA mensuel / nombre d'employés. Comparer à 3× le salaire moyen.

**5. Taux de fidélisation client**
Souvent ignoré, mais un des meilleurs indicateurs de santé business à moyen terme.`,
  },
  {
    id:6,cat:"Python",time:"9 min",date:"25 Fév 2025",icon:"🐍",
    title:"Introduction à Python pour la data en contexte africain",
    excerpt:"Pourquoi Python est devenu incontournable pour les data analysts en Afrique — et par où commencer quand on part de zéro.",
    body:`Python est devenu la lingua franca de la data mondiale. Mais comment l'apprendre dans un contexte africain avec parfois une connectivité limitée ?

**Pourquoi Python ?**

Python est gratuit, open-source, et peut fonctionner entièrement hors ligne. Sa bibliothèque pandas est l'outil de manipulation de données le plus puissant disponible gratuitement. Il s'installe sur n'importe quel ordinateur.

**Les 3 bibliothèques prioritaires**

Pandas : manipuler des tableaux, faire des jointures, calculer des agrégations. Matplotlib : graphiques de qualité professionnelle. Openpyxl : lire et écrire des fichiers Excel depuis Python — essentiel pour automatiser vos rapports.

**Par où commencer**

Toujours commencer avec un vrai problème que vous avez. Prenez un fichier Excel que vous manipulez manuellement. Lisez-le avec pandas, faites un calcul simple, exportez le résultat. Cette première victoire concrète vaut dix tutoriels théoriques.`,
  },
];

/* ═══════════════════════════════════════════════════
   PAYMENT METHODS
═══════════════════════════════════════════════════ */
export const PAY = [
  {id:"orange",name:"Orange Money",icon:"🟠",color:"#FF6600"},
  {id:"moov",name:"Moov Money",icon:"🔵",color:"#0066CC"},
  {id:"wave",name:"Wave",icon:"🌊",color:"#1DC5E0"},
  {id:"card",name:"Carte Bancaire",icon:"💳",color:C.blue},
];

/* ═══════════════════════════════════════════════════
   KALAN AI — System Prompt
═══════════════════════════════════════════════════ */
export const KALAN_SYS = `Tu es Kalan, l'assistant IA de Beyrey Consulting. "Kalan" signifie "savoir" en Bambara. Tu réponds principalement en français, de façon concise et chaleureuse.

Beyrey Consulting est le cabinet de référence Data & BI au Mali, fondé par Ibrahim Seydou. Méthode propriétaire : DIAL™ (Diagnostiquer, Implémenter, Automatiser, Livrer).

FORMATIONS DISPONIBLES :
1. Power BI pour PME Maliennes — 75 000 FCFA — Débutant — 8h — 24 vidéos
2. Excel Avancé pour PME — 45 000 FCFA — Intermédiaire — 5h — 18 vidéos
3. Gouvernance Data DIAL™ — 120 000 FCFA — Expert — 12h — 36 vidéos
4. Python pour la Data — 90 000 FCFA — Intermédiaire — 10h — 30 vidéos
5. Dashboard ONG & Bailleurs — 60 000 FCFA — Intermédiaire — 6h — 20 vidéos
6. SQL et Modélisation — 50 000 FCFA — Débutant — 6h — 22 vidéos

Tu peux : recommander la bonne formation selon le niveau et les besoins, expliquer Power BI / Excel / Python / SQL / DAX / DIAL™, répondre sur la gouvernance data en contexte africain, donner des conseils adaptés à la réalité malienne (EDM, FCFA, ONG, PME, délais de paiement B2B, connectivité variable).

Sois direct et utile. Recommande une formation spécifique si la question s'y prête. Max 180 mots par réponse sauf si demande de détails. Utilise des listes à points quand c'est plus clair.`;

/* ═══════════════════════════════════════════════════
   DIAL™ METHOD
═══════════════════════════════════════════════════ */
export const DIAL = [
  {letter:"D",title:"Diagnostiquer",icon:"🔍",color:C.gold,desc:"Audit complet de vos données, de vos flux et de vos compétences internes. On identifie les goulots, les doublons, les pertes de valeur."},
  {letter:"I",title:"Implémenter",icon:"🛠️",color:C.grn,desc:"Mise en place des outils adaptés à votre contexte — Power BI, Power Query, pipelines ETL. Préférer le frugal au coûteux."},
  {letter:"A",title:"Automatiser",icon:"⚙️",color:C.blue,desc:"Éliminer le travail manuel répétitif. Vos rapports se mettent à jour seuls. Vos équipes se concentrent sur l'analyse, pas la saisie."},
  {letter:"L",title:"Livrer",icon:"🎓",color:"#E060C0",desc:"Formation de vos équipes, documentation, transfert de compétences. Le système fonctionne encore quand le consultant est parti."},
];

/* ═══════════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════════ */
export const TESTIMONIALS = [
  {name:"Aminata Traoré",role:"DAF, EMICOM Mali",avatar:"AT",color:C.gold,text:"Beyrey Consulting a transformé notre reporting mensuel. De 3 jours de travail manuel à 20 minutes. Le ROI s'est fait en 2 mois."},
  {name:"Mahamed Cissé",role:"Directeur M&E, ONG Sahel",avatar:"MC",color:C.grn,text:"La formation Dashboard ONG & Bailleurs est exactement ce dont nous avions besoin. Nos rapports bailleurs sont enfin à jour et automatisés."},
  {name:"Fatoumata Diallo",role:"Analyste Data, BDM Bank",avatar:"FD",color:C.blue,text:"La méthode DIAL™ m'a donné un cadre structuré pour penser la gouvernance data. Je l'applique tous les jours dans mon travail."},
  {name:"Seydou Keita",role:"DG, Keita Commerce",avatar:"SK",color:"#E060C0",text:"Je ne savais pas qu'on pouvait faire ça avec Power BI. Maintenant, je vois mes KPIs chaque matin sur mon téléphone."},
];

/* ═══════════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════════ */
export const STATS = [
  {n:"40+",l:"PME auditées"},
  {n:"465",l:"Étudiants formés"},
  {n:"5 ans",l:"De terrain à Bamako"},
  {n:"4.8/5",l:"Satisfaction moyenne"},
];

/* ═══════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════ */
export const fmt = (n:number) => n.toLocaleString("fr-FR") + " FCFA";
export const btn = (style:React.CSSProperties={}) => ({cursor:"pointer",fontFamily:F.sans,border:"none",...style} as React.CSSProperties);
export function Tag({c=C.gold,children}:{c?:string,children:React.ReactNode}){return<span style={{background:`${c}18`,color:c,fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,border:`1px solid ${c}28`,display:"inline-block"}}>{children}</span>}
