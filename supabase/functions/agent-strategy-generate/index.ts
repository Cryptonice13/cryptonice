// Edge function: agent-strategy-generate
// AI-driven trading strategy generator. Returns a structured strategy spec.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CREDIT_COST = 3;

const STRATEGY_TYPES = ["trend", "momentum", "scalping", "swing", "mean_reversion", "arbitrage"] as const;
const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

interface StrategySpec {
  name: string;
  type: typeof STRATEGY_TYPES[number];
  assets: string[];
  exchange: string;
  timeframe: typeof TIMEFRAMES[number];
  description: string;
  params: {
    indicator: "sma_cross" | "rsi" | "macd" | "breakout";
    fastPeriod?: number;
    slowPeriod?: number;
    rsiPeriod?: number;
    rsiOverbought?: number;
    rsiOversold?: number;
    stopLossPct: number;
    takeProfitPct: number;
    positionSizePct: number;
  };
}

const SYSTEM_PROMPT = `You are an elite quant trading strategist. The user describes a trading idea in plain English.
You output ONE JSON object describing a complete, backtestable spot strategy. No prose, no markdown fences, JUST JSON.

Schema:
{
  "name": "short human name",
  "type": "trend" | "momentum" | "scalping" | "swing" | "mean_reversion" | "arbitrage",
  "assets": ["BTC/USDT", ...] (1-3 CCXT symbols),
  "exchange": "binance" | "bybit" | "coinbase" | "kraken" | "okx",
  "timeframe": "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
  "description": "1-2 sentences on edge & risk",
  "params": {
    "indicator": "sma_cross" | "rsi" | "macd" | "breakout",
    "fastPeriod": number (only for sma_cross/macd),
    "slowPeriod": number (only for sma_cross/macd),
    "rsiPeriod": number (only for rsi),
    "rsiOverbought": number (only for rsi, e.g. 70),
    "rsiOversold": number (only for rsi, e.g. 30),
    "stopLossPct": number (e.g. 2 means 2%),
    "takeProfitPct": number (e.g. 4),
    "positionSizePct": number (1-100, % of equity per trade)
  }
}

Match indicator to type: trend/swing → sma_cross or macd; momentum → macd; scalping/mean_reversion → rsi; breakout for ranging assets.
Position size: scalping 5-15%, swing 20-40%, trend 15-30%.
Return JSON only.`;

function extractJSON(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fence ? fence[1] : raw).trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.prompt !== "string" || body.prompt.length < 3) {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const prompt = body.prompt.slice(0, 1000);
    const walletAddress = typeof body.walletAddress === "string" ? body.walletAddress.replace(/[^A-Za-z0-9]/g, "").slice(0, 64) : null;

    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const userClient = createClient(SUPABASE_URL, ANON_KEY);
        const { data } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
        if (data?.user) userId = data.user.id;
      } catch (_) { /* ignore */ }
    }
    if (!userId && !walletAddress) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: deductData, error: deductErr } = await admin.rpc("deduct_credits_atomic", {
      _user_id: userId, _wallet: userId ? null : walletAddress, _amount: CREDIT_COST,
      _description: `Strategy generation (${CREDIT_COST} credits)`,
    });
    if (deductErr) return new Response(JSON.stringify({ error: "Credit check failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (typeof deductData === "number" && deductData < 0) {
      return new Response(JSON.stringify({ error: "Insufficient credits", required: CREDIT_COST }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content || "";
    let spec: StrategySpec;
    try {
      spec = JSON.parse(extractJSON(raw));
    } catch (e) {
      console.error("strategy parse failed:", raw);
      return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Light validation / coercion
    if (!STRATEGY_TYPES.includes(spec.type as any)) spec.type = "trend";
    if (!TIMEFRAMES.includes(spec.timeframe as any)) spec.timeframe = "1h";
    spec.assets = Array.isArray(spec.assets) ? spec.assets.slice(0, 3).filter(a => typeof a === "string") : ["BTC/USDT"];
    if (!spec.assets.length) spec.assets = ["BTC/USDT"];
    spec.exchange = typeof spec.exchange === "string" ? spec.exchange : "binance";
    spec.params = spec.params || ({} as any);
    spec.params.stopLossPct = Math.min(Math.max(Number(spec.params.stopLossPct) || 2, 0.1), 50);
    spec.params.takeProfitPct = Math.min(Math.max(Number(spec.params.takeProfitPct) || 4, 0.1), 200);
    spec.params.positionSizePct = Math.min(Math.max(Number(spec.params.positionSizePct) || 20, 1), 100);

    return new Response(JSON.stringify({ strategy: spec }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("agent-strategy-generate error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
