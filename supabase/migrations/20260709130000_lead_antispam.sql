/*
# Anti-spam throttle for public lead forms (#4)

Rejects a second insert with the same email within 30s on the public,
anon-insertable lead tables. Cheap server-side defence against form-bot floods
(complements the client-side honeypot). Keyed by email so it does not block
distinct legitimate users.
*/

CREATE OR REPLACE FUNCTION reject_rapid_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent boolean;
BEGIN
  EXECUTE format(
    'SELECT EXISTS (SELECT 1 FROM %I WHERE email = $1 AND created_at > now() - interval ''30 seconds'')',
    TG_TABLE_NAME
  ) INTO v_recent USING NEW.email;
  IF v_recent THEN
    RAISE EXCEPTION 'Trop de soumissions rapprochees. Patientez un instant.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_antispam_contact_leads ON contact_leads;
CREATE TRIGGER trg_antispam_contact_leads
  BEFORE INSERT ON contact_leads
  FOR EACH ROW EXECUTE FUNCTION reject_rapid_lead();

DROP TRIGGER IF EXISTS trg_antispam_book_leads ON book_leads;
CREATE TRIGGER trg_antispam_book_leads
  BEFORE INSERT ON book_leads
  FOR EACH ROW EXECUTE FUNCTION reject_rapid_lead();
