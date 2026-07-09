// sign-media — returns a short-lived signed URL for a course video or file,
// but only if the caller is enrolled in the owning course (or the lesson is a
// free preview, or the caller is an admin). Buckets are private, so this is the
// only way to reach the media (OWASP A01 / A04).
//
// Deploy: supabase functions deploy sign-media

import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKETS = ["course-videos", "course-files"];
const TTL = 7200; // 2h

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let bucket: string | undefined, path: string | undefined;
  try {
    ({ bucket, path } = await req.json());
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  if (!bucket || !path || !BUCKETS.includes(bucket)) return json({ error: "bad request" }, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey);

  // Resolve the course + preview flag for this storage path.
  let courseId: string | null = null;
  let isPreview = false;
  if (bucket === "course-videos") {
    const { data } = await admin
      .from("lms_lessons")
      .select("course_id, is_preview")
      .eq("video_storage_path", path)
      .maybeSingle();
    if (data) { courseId = data.course_id; isPreview = !!data.is_preview; }
  } else {
    const { data: f } = await admin
      .from("lms_lesson_files")
      .select("lesson_id")
      .eq("storage_path", path)
      .maybeSingle();
    if (f) {
      const { data: l } = await admin
        .from("lms_lessons")
        .select("course_id, is_preview")
        .eq("id", f.lesson_id)
        .maybeSingle();
      if (l) { courseId = l.course_id; isPreview = !!l.is_preview; }
    }
  }
  if (!courseId) return json({ error: "not found" }, 404);

  // Preview content is free — sign it even for anonymous visitors.
  let allowed = isPreview;

  if (!allowed) {
    // Otherwise the caller must be authenticated + admin or enrolled.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthenticated" }, 401);
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "unauthenticated" }, 401);

    const { data: adminRow } = await admin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (adminRow) allowed = true;
    else {
      const { data: enr } = await admin
        .from("student_enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();
      if (enr) allowed = true;
    }
  }

  if (!allowed) return json({ error: "forbidden" }, 403);

  const { data: signed, error } = await admin.storage.from(bucket).createSignedUrl(path, TTL);
  if (error || !signed) return json({ error: error?.message || "sign failed" }, 500);
  return json({ url: signed.signedUrl });
});
