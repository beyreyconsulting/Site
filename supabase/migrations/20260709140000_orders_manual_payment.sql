/*
# Orders + manual payment validation (#2 — Broken Access Control)

Closes the "free enrollment" hole. Enrollment is now granted ONLY when an order
is marked 'paid':
- free courses (price 0) are auto-paid on creation,
- paid courses stay 'pending' until an ADMIN confirms the mobile-money payment.

The student can never self-grant: a BEFORE trigger overrides amount/status server
-side, and only admins can UPDATE an order to 'paid' (RLS). Enrollment rows are
inserted by a SECURITY DEFINER trigger (direct client INSERT stays blocked).
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_email text,
  course_id uuid NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  amount int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_ref text,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON orders;
CREATE POLICY "orders_select_own_or_admin" ON orders FOR SELECT
TO authenticated USING (student_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT
TO authenticated WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "orders_admin_update" ON orders;
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE
TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "orders_admin_delete" ON orders;
CREATE POLICY "orders_admin_delete" ON orders FOR DELETE
TO authenticated USING (is_admin(auth.uid()));

-- Force amount + status from the course price (student cannot self-set 'paid').
CREATE OR REPLACE FUNCTION set_order_terms()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p int;
BEGIN
  SELECT price INTO p FROM lms_courses WHERE id = NEW.course_id;
  IF p IS NULL THEN RAISE EXCEPTION 'unknown course'; END IF;
  NEW.amount := p;
  IF p = 0 THEN NEW.status := 'paid'; NEW.paid_at := now();
  ELSE NEW.status := 'pending'; NEW.paid_at := NULL;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_set_order_terms ON orders;
CREATE TRIGGER trg_set_order_terms BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_terms();

-- Stamp paid_at when an admin flips status to 'paid'.
CREATE OR REPLACE FUNCTION stamp_paid_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'paid' AND NEW.paid_at IS NULL THEN NEW.paid_at := now(); END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_stamp_paid_at ON orders;
CREATE TRIGGER trg_stamp_paid_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION stamp_paid_at();

-- Grant enrollment when an order is paid (insert + admin-confirm paths).
CREATE OR REPLACE FUNCTION fulfill_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'paid' THEN
    INSERT INTO student_enrollments (student_id, course_id)
      VALUES (NEW.student_id, NEW.course_id)
      ON CONFLICT (student_id, course_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_fulfill_order_ins ON orders;
CREATE TRIGGER trg_fulfill_order_ins AFTER INSERT ON orders
  FOR EACH ROW WHEN (NEW.status = 'paid') EXECUTE FUNCTION fulfill_order();

DROP TRIGGER IF EXISTS trg_fulfill_order_upd ON orders;
CREATE TRIGGER trg_fulfill_order_upd AFTER UPDATE OF status ON orders
  FOR EACH ROW WHEN (NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid')
  EXECUTE FUNCTION fulfill_order();
