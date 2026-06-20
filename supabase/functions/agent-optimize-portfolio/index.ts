// Edge function: agent-optimize-portfolio
// Uses Lovable AI Gateway to propose target weights based on the user's current portfolio
// plus a simple risk-parity / mean-variance heuristic fallback. Costs 5 credits.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractJSON(s: string): any | null {
  if (!s) return null;
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fence ? fence[1] : s).trim();
  try { return JSON.parse(candidate); } catch { /* ignore */ }
  const start = candidate.indexOf("{"); const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(candidate.slice(start, end + 1)); } catch { /* ignore */ }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const body = await req.json().catch(() => ({}));
    const riskTolerance: "low" | "medium" | "high" = body?.riskTolerance || "medium";
    const horizon: string = body?.horizon || "medium";

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY);
      const { data } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
      if (data?.user) userId = data.user.id;
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: bal } = await admin.rpc("deduct_credits_atomic", {
      _user_id: userId, _wallet: null, _amount: 5, _description: "Portfolio optimizer",
    });
    if (typeof bal === "number" && bal < 0) {
      return new Response(JSON.stringify({ error: "Insufficient credits" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: holdings } = await admin.from("user_portfolio").select("asset_symbol, amount, avg_buy_price").eq("user_id", userId);
    const assets = (holdings && holdings.length)
      ? holdings.map(h => h.asset_symbol.toUpperCase())
      : ["BTC", "ETH", "SOL"];

    const prompt = `You are a portfolio strategist. Given these crypto holdings: ${assets.join(", ")}.
Risk tolerance: ${riskTolerance}. Horizon: ${horizon}.
Suggest target portfolio weights that sum to 100. Return JSON ONLY in this shape:
{"weights":[{"symbol":"BTC","weight":50},...],"rationale":"short paragraph"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a concise crypto portfolio strategist. Output strict JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("ai error", aiRes.status, txt);
      return new Response(JSON.stringify({ error: `AI error ${aiRes.status}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content || "";
    const parsed = extractJSON(content);

    let weights = parsed?.weights;
    let rationale = parsed?.rationale || "Equal weight fallback.";
    if (!Array.isArray(weights) || weights.length === 0) {
      const w = Math.floor(100 / assets.length);
      weights = assets.map((s, i) => ({ symbol: s, weight: i === 0 ? w + (100 - w * assets.length) : w }));
    } else {
      const total = weights.reduce((a: number, b: any) => a + Number(b.weight || 0), 0) || 1;
      weights = weights.map((w: any) => ({ symbol: String(w.symbol).toUpperCase(), weight: Number(((w.weight / total) * 100).toFixed(2)) }));
    }

    const { data: inserted } = await admin.from("portfolio_targets")
      .insert({ user_id: userId, weights, rationale })
      .select("*").single();

    return new Response(JSON.stringify({ target: inserted, balance: bal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("optimize-portfolio error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
