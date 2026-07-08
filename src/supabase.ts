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

/** Enroll the current user in a course via the server (service role). */
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
