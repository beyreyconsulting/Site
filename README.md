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

## Notes de sécurité

- Toute écriture LMS (cours/leçons/quiz/storage) est réservée aux admins par RLS.
- Le contenu payant n'est plus inscriptible gratuitement côté client :
  l'inscription passe par la fonction `enroll`. **TODO** : y ajouter la
  vérification d'un paiement confirmé (webhook Orange/Wave/Stripe) avant
  d'inscrire.
- Le paiement mobile money / carte de la landing reste une démonstration
  (aucun PSP branché).
