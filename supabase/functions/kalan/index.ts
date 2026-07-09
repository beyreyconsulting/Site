// Kalan AI — server-side proxy to the Anthropic API.
// The API key never reaches the browser. Per-IP rate limiting + CORS + caps
// protect against cost/quota abuse (OWASP LLM10 / A06).
//
// Deploy:  supabase functions deploy kalan
// Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//          (optional) supabase secrets set ALLOWED_ORIGIN=https://beyrey.consulting

import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Per-IP budget: at most RL_LIMIT requests per RL_WINDOW seconds.
const RL_LIMIT = 15;
const RL_WINDOW = 60;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "server not configured" }, 500);

    // ── Rate limit per client IP ──
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);
    const { data: allowed, error: rlErr } = await admin.rpc("rl_hit", {
      p_key: `kalan:${ip}`,
      p_limit: RL_LIMIT,
      p_window_seconds: RL_WINDOW,
    });
    // Fail-open on limiter errors (per-call caps below still bound the damage).
    if (rlErr) console.error("rl_hit error", rlErr.message);
    else if (allowed === false) {
      return json({ error: "Trop de requêtes. Réessayez dans une minute." }, 429);
    }

    const { messages, system } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages required" }, 400);
    }

    // Validate shape + cap length/size to bound per-call cost.
    const trimmed = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        system: typeof system === "string" ? system.slice(0, 8000) : undefined,
        messages: trimmed,
      }),
    });

    const d = await r.json();
    if (!r.ok) return json({ error: d?.error?.message || "upstream error" }, 502);

    const text = d?.content?.[0]?.text ?? "";
    return json({ text });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
