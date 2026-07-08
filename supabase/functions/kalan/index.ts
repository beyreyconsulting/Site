// Kalan AI — server-side proxy to the Anthropic API.
// The API key never reaches the browser. CORS + basic abuse caps applied.
//
// Deploy:  supabase functions deploy kalan
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

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

  try {
    const { messages, system } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages required" }, 400);
    }

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "server not configured" }, 500);

    // Cap conversation length + validate shape to limit abuse/cost.
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
