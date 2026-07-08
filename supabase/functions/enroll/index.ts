// enroll — creates a course enrollment server-side using the service role.
// This is the ONLY path that writes to student_enrollments (direct client
// INSERT is blocked by RLS), so it is the single place to enforce payment.
//
// Deploy: supabase functions deploy enroll
//
// SECURITY TODO: before inserting, verify the caller actually paid for the
// course (e.g. look up a confirmed order created by an Orange/Wave/Stripe
// webhook). Until then this grants enrollment to any authenticated user.

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "unauthenticated" }, 401);

  let courseId: string | undefined;
  try {
    ({ courseId } = await req.json());
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  if (!courseId) return json({ error: "courseId required" }, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verify the caller's identity from their JWT.
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "unauthenticated" }, 401);

  // TODO: verify a confirmed payment for (user.id, courseId) here.

  const admin = createClient(url, serviceKey);
  const { error } = await admin
    .from("student_enrollments")
    .upsert({ student_id: user.id, course_id: courseId }, { onConflict: "student_id,course_id" });

  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
});
