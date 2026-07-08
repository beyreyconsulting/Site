/*
# Contact leads + analytics events

## Purpose
- `contact_leads` : capture des demandes B2B qualifiées (formulaire "Centre de commande").
- `analytics_events` : suivi des objectifs de conversion (audit_requested,
  lead_magnet_download, course_registration).

## Security
- RLS activée sur les deux tables.
- anon + authenticated peuvent INSERT uniquement (capture avant login).
- Aucune policy SELECT/UPDATE/DELETE — seul le service role lit les données.
*/

CREATE TABLE IF NOT EXISTS contact_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  entreprise text,
  email text NOT NULL,
  telephone text,
  besoin text,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact_leads" ON contact_leads;
CREATE POLICY "anon_insert_contact_leads" ON contact_leads FOR INSERT
TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  payload jsonb,
  path text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_analytics_events" ON analytics_events;
CREATE POLICY "anon_insert_analytics_events" ON analytics_events FOR INSERT
TO anon, authenticated WITH CHECK (true);
