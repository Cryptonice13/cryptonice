// Edge function: agent-evaluate
// AI reviews recent paper_trades for a strategy and proposes parameter tweaks.
// Costs 3 credits. Returns suggestion only; user approves via UI to apply.
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
  const a = candidate.indexOf("{"); const b = candidate.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(candidate.slice(a, b + 1)); } catch { /* ignore */ } }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const { strategyId } = await req.json().catch(() => ({}));
    if (!strategyId) {
      return new Response(JSON.stringify({ error: "strategyId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data: u } = await userClient.auth.getUser(auth.replace("Bearer ", ""));
    const userId = u?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: bal } = await admin.rpc("deduct_credits_atomic", {
      _user_id: userId, _wallet: null, _amount: 3, _description: "Strategy evaluator",
    });
    if (typeof bal === "number" && bal < 0) {
      return new Response(JSON.stringify({ error: "Insufficient credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: strat } = await admin.from("trading_strategies").select("*").eq("id", strategyId).eq("user_id", userId).single();
    if (!strat) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: trades } = await admin.from("paper_trades").select("symbol, pnl, pnl_pct, reason_close, opened_at, closed_at").eq("strategy_id", strategyId).order("closed_at", { ascending: false }).limit(25);

    const wins = (trades || []).filter(t => Number(t.pnl) > 0).length;
    const total = (trades || []).length;
    const winRate = total ? (wins / total) * 100 : 0;

    const prompt = `Strategy "${strat.name}" type=${strat.type} timeframe=${strat.timeframe}.
Current params: ${JSON.stringify(strat.params)}.
Recent ${total} paper trades, win rate ${winRate.toFixed(1)}%.
Sample: ${JSON.stringify((trades || []).slice(0, 10))}.
Suggest improvements. Output JSON ONLY:
{"suggestedParams":{...same keys with new values...},"reasoning":"short"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a trading strategy tuner. Output strict JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });
    if (!aiRes.ok) {
      return new Response(JSON.stringify({ error: `AI error ${aiRes.status}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content || "";
    const parsed = extractJSON(content) || { suggestedParams: strat.params, reasoning: "No tweak suggested." };

    return new Response(JSON.stringify({ suggestion: parsed, stats: { winRate, total }, balance: bal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-evaluate error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
