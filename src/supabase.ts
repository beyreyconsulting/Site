import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key);

const FUNCTIONS_URL = `${url}/functions/v1`;

/** Call the Kalan Edge Function (server holds the Anthropic key). */
export async function askKalan(
  messages: { role: "user" | "assistant"; content: string }[],
  system: string,
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${FUNCTIONS_URL}/kalan`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: key,
      Authorization: `Bearer ${session?.access_token ?? key}`,
    },
    body: JSON.stringify({ messages, system }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d?.error || "kalan error");
  return d.text as string;
}

/**
 * Track a conversion objective. Pushes to window.dataLayer (GTM-ready) and
 * persists to Supabase `analytics_events` (fire-and-forget, never blocks UI).
 */
export function track(event: string, payload: Record<string, unknown> = {}): void {
  try {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event, ...payload });
  } catch { /* no-op */ }
  void supabase.from("analytics_events").insert({
    event,
    payload,
    path: typeof window !== "undefined" ? window.location.pathname + window.location.hash : null,
  });
}

/**
 * Get a short-lived signed URL for a private course video/file.
 * The server checks enrollment (or preview/admin) before signing.
 */
export async function signMedia(bucket: "course-videos" | "course-files", path: string): Promise<string | null> {
  if (!path) return null;
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${FUNCTIONS_URL}/sign-media`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: key,
      Authorization: `Bearer ${session?.access_token ?? key}`,
    },
    body: JSON.stringify({ bucket, path }),
  });
  if (!res.ok) return null;
  const d = await res.json();
  return d.url ?? null;
}

/**
 * Create an order for a course. Free courses are auto-paid (instant enrollment
 * via DB trigger); paid courses stay 'pending' until an admin confirms payment.
 * The server (triggers/RLS) forces amount + status — the client cannot self-pay.
 */
export async function createOrder(courseId: string): Promise<{ ok: boolean; status?: "pending" | "paid"; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: "not authenticated" };
  const { data, error } = await supabase
    .from("orders")
    .insert({ student_id: session.user.id, student_email: session.user.email, course_id: courseId })
    .select("status")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, status: data.status };
}

/** @deprecated Enrollment now flows through orders (see createOrder). */
export async function enrollInCourse(courseId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: "not authenticated" };
  const res = await fetch(`${FUNCTIONS_URL}/enroll`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ courseId }),
  });
  const d = await res.json();
  return res.ok ? { ok: true } : { ok: false, error: d?.error };
}
