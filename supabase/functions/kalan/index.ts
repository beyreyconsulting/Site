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
// GLOBAL budget, all visitors together: the per-IP key comes from a header a
// client can forge, so only this cap truly bounds the Anthropic bill.
const RL_GLOBAL_LIMIT = 500;
const RL_GLOBAL_WINDOW = 86400;

const MODEL = "claude-sonnet-5-5";

// The system prompt lives HERE, not in the browser: a client-supplied prompt
// turned this endpoint into a free general-purpose model on our key.
const SYSTEM = `Tu es Kalan, l'assistant IA de Beyrey Consulting. "Kalan" signifie "savoir" en Bambara. Tu réponds principalement en français, de façon concise et chaleureuse.

Beyrey Consulting est le cabinet de référence Data & BI au Mali, fondé par Ibrahim Seydou. Méthode propriétaire : DIAL™ (Diagnostiquer, Implémenter, Automatiser, Livrer).

FORMATIONS DISPONIBLES :
1. Power BI pour PME Maliennes — 75 000 FCFA — Débutant — 8h — 24 vidéos
2. Excel Avancé pour PME — 45 000 FCFA — Intermédiaire — 5h — 18 vidéos
3. Gouvernance Data DIAL™ — 120 000 FCFA — Expert — 12h — 36 vidéos
4. Python pour la Data — 90 000 FCFA — Intermédiaire — 10h — 30 vidéos
5. Dashboard ONG & Bailleurs — 60 000 FCFA — Intermédiaire — 6h — 20 vidéos
6. SQL et Modélisation — 50 000 FCFA — Débutant — 6h — 22 vidéos

Tu peux : recommander la bonne formation selon le niveau et les besoins, expliquer Power BI / Excel / Python / SQL / DAX / DIAL™, répondre sur la gouvernance data en contexte africain, donner des conseils adaptés à la réalité malienne (EDM, FCFA, ONG, PME, délais de paiement B2B, connectivité variable).

Sois direct et utile. Recommande une formation spécifique si la question s'y prête. Max 180 mots par réponse sauf si demande de détails. Utilise des listes à points quand c'est plus clair.`;

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
    if (!key) {
      // CETTE PHRASE SE LIT DANS LA BULLE. Les autres sorties de cette
      // fonction s'adressent déjà au visiteur ; celle-ci restait un code
      // interne en anglais, qui ne disait à personne quoi faire. Dire
      // qu'une clé manque ne révèle rien d'exploitable, et c'est la
      // seule panne des quatre qui se répare en une minute.
      console.error("ANTHROPIC_API_KEY absente de l'environnement");
      return json(
        { error: "Kalan n'est pas encore configuré côté serveur." },
        500,
      );
    }

    // ── Rate limit per client IP ──
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);
    for (const [cle, limite, fenetre, message] of [
      [`kalan:${ip}`, RL_LIMIT, RL_WINDOW, "Trop de requêtes. Réessayez dans une minute."],
      ["kalan:global", RL_GLOBAL_LIMIT, RL_GLOBAL_WINDOW, "Kalan a beaucoup parlé aujourd'hui. Réessayez demain, ou écrivez-nous sur WhatsApp."],
    ] as const) {
      const { data: allowed, error: rlErr } = await admin.rpc("rl_hit", {
        p_key: cle, p_limit: limite, p_window_seconds: fenetre,
      });
      // Fail CLOSED: without the limiter nothing bounds the bill.
      if (rlErr) {
        console.error("rl_hit error", rlErr.message);
        return json({ error: "Kalan est momentanément indisponible." }, 503);
      }
      if (allowed === false) return json({ error: message }, 429);
    }

    const { messages } = await req.json();
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
        model: MODEL,
        max_tokens: 1000,
        system: SYSTEM,
        messages: trimmed,
      }),
    });

    const d = await r.json();
    if (!r.ok) {
      console.error("anthropic error", r.status, d?.error?.message);
      return json({ error: "Kalan n'a pas pu répondre. Réessayez dans un instant." }, 502);
    }

    const text = d?.content?.[0]?.text ?? "";
    return json({ text });
  } catch (e) {
    // Never echo internals to the visitor.
    console.error("kalan failure", e);
    return json({ error: "Kalan n'a pas pu répondre. Réessayez dans un instant." }, 500);
  }
});
