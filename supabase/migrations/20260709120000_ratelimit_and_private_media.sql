/*
# Rate limiting (Kalan) + private course media

## #1 — Rate limit backing store for the Kalan Edge Function
- `edge_rate_limits` : fixed-window counter, keyed by an arbitrary bucket string.
- `rl_hit(key, limit, window_seconds)` : atomic increment; returns TRUE if the
  call is within the limit, FALSE if it should be rejected (429).
  Called only by the Edge Function via the service role.

## #3 — Course media no longer public
- Flip `course-videos` / `course-files` buckets to private so the permanent
  public CDN URLs stop working. Playback/downloads now go through the
  `sign-media` Edge Function, which verifies enrollment (or preview/admin)
  and returns a short-lived signed URL.
*/

-- ── #1 rate limiting ─────────────────────────────
CREATE TABLE IF NOT EXISTS edge_rate_limits (
  bucket text PRIMARY KEY,
  count int NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE edge_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (which bypasses RLS) may touch this table.

CREATE OR REPLACE FUNCTION rl_hit(p_key text, p_limit int, p_window_seconds int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_count int;
BEGIN
  INSERT INTO edge_rate_limits (bucket, count, window_start)
    VALUES (p_key, 1, v_now)
  ON CONFLICT (bucket) DO UPDATE
    SET count = CASE
                  WHEN edge_rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
                  THEN 1 ELSE edge_rate_limits.count + 1 END,
        window_start = CASE
                  WHEN edge_rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
                  THEN v_now ELSE edge_rate_limits.window_start END
  RETURNING count INTO v_count;
  RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION rl_hit(text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION rl_hit(text, int, int) TO service_role;

-- ── #3 private media buckets ─────────────────────
UPDATE storage.buckets SET public = false WHERE id IN ('course-videos', 'course-files');
