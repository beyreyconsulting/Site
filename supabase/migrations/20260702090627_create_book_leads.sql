/*
# Create book_leads table

## Purpose
Capture lead information for users who want to download "L'Art de la Rigueur".
Users must fill a form before getting the PDF download link.

## New Tables
- `book_leads`
  - `id` (uuid, primary key)
  - `nom` (text, not null) — full name
  - `email` (text, not null) — email address
  - `entreprise` (text) — company or organisation name
  - `poste` (text) — job title / role
  - `created_at` (timestamptz, default now())

## Security
- RLS enabled.
- anon + authenticated can INSERT (capturing lead info before any login).
- No SELECT/UPDATE/DELETE policies — only the service role can read leads.
*/

CREATE TABLE IF NOT EXISTS book_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  email text NOT NULL,
  entreprise text,
  poste text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE book_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_book_leads" ON book_leads;
CREATE POLICY "anon_insert_book_leads" ON book_leads FOR INSERT
TO anon, authenticated WITH CHECK (true);
