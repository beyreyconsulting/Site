# Beyrey Consulting — Site & Académie Kalan

Site vitrine + LMS (React + TypeScript + Vite + Tailwind + Supabase).

## Développement

```bash
npm install
cp .env.example .env   # renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

Scripts : `npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint`

## Déploiement Supabase (requis)

1. **Migrations** (tables, RLS, helpers `is_admin`/`is_enrolled`) :
   ```bash
   supabase db push
   ```

2. **Edge Functions** :
   ```bash
   supabase functions deploy kalan
   supabase functions deploy enroll
   supabase functions deploy sign-media
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   # optionnel : verrouille le CORS des fonctions sur ton domaine
   supabase secrets set ALLOWED_ORIGIN=https://beyrey.consulting
   ```
   `kalan` = proxy de l'assistant IA (clé Anthropic côté serveur, rate-limit par IP).
   `enroll` = crée les inscriptions côté serveur (service role) — seul point où
   brancher la vérification de paiement.
   `sign-media` = délivre des URLs signées courtes pour les vidéos/fichiers des
   buckets **privés**, uniquement aux inscrits (ou preview/admin).

3. **Créer un compte admin** : créer l'utilisateur dans Supabase Auth, puis :
   ```sql
   INSERT INTO admins (user_id) VALUES ('<uuid-de-l-utilisateur>');
   ```
   L'accès à `#admin` passe par une vraie authentification Supabase + contrôle
   `is_admin` (plus de mot de passe en dur).

## Déploiement Netlify (frontend)

Le repo contient un [`netlify.toml`](netlify.toml) prêt à l'emploi (build, fallback
SPA, en-têtes de sécurité + CSP).

1. Netlify → **Add new site → Import from Git** → ce repo (branche `main`).
   Build/publish sont déjà lus depuis `netlify.toml` (`npm run build` → `dist`).
2. **Site settings → Environment variables** — ajouter :
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```
3. Déployer. Le CSP autorise `*.supabase.co` (DB, Auth, Edge Functions, médias
   signés) et Google Fonts. Si un domaine custom est ajouté, penser à
   `supabase secrets set ALLOWED_ORIGIN=https://ton-domaine`.

### Alternative : Vercel

[`vercel.json`](vercel.json) fournit le même comportement (fallback SPA + en-têtes
+ CSP). Import du repo sur Vercel → framework **Vite** auto-détecté, puis ajouter
les mêmes variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` dans
**Project Settings → Environment Variables**. Utiliser **soit** Netlify **soit**
Vercel, pas les deux.

## Notes de sécurité

- Toute écriture LMS (cours/leçons/quiz/storage) est réservée aux admins par RLS.
- **Paiement = validation manuelle** : le checkout crée une commande (`orders`).
  Les cours gratuits sont auto-validés ; les cours payants restent `pending`
  jusqu'à ce qu'un **admin** confirme le paiement mobile money (onglet
  *Commandes*), ce qui déclenche l'inscription. Le client ne peut pas se
  déclarer payé (triggers + RLS).
- **Médias privés** : vidéos/fichiers servis via URLs signées (`sign-media`),
  jamais par URL publique permanente.
- **Kalan** : proxy serveur (clé Anthropic cachée) avec rate-limit par IP.
- À activer côté dashboard Supabase : longueur mini de mot de passe (12) +
  détection des mots de passe compromis.
