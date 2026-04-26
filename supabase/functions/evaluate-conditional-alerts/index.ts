import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COINGECKO = "https://api.coingecko.com/api/v3";

interface Condition {
  asset_id: string;
  asset_symbol: string;
  metric: string;
  operator: string;
  value: number;
}

function evalOp(actual: number, op: string, expected: number): boolean {
  switch (op) {
    case "gt": return actual > expected;
    case "lt": return actual < expected;
    case "gte": return actual >= expected;
    case "lte": return actual <= expected;
    default: return false;
  }
}

function getMetricValue(market: any, metric: string): number | null {
  if (!market) return null;
  switch (metric) {
    case "price": return market.current_price;
    case "price_change_24h_pct": return market.price_change_percentage_24h;
    case "price_change_7d_pct": return market.price_change_percentage_7d_in_currency;
    case "volume_24h": return market.total_volume;
    case "volume_ratio_24h": {
      // Approximation: use current volume / market cap as proxy when 7d avg unavailable
      const v = market.total_volume;
      const mc = market.market_cap;
      return mc > 0 ? (v / mc) * 10 : null;
    }
    case "market_cap": return market.market_cap;
    default: return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: alerts } = await supabase
      .from("conditional_alerts")
      .select("*")
      .eq("status", "active");

    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ evaluated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect all unique asset_ids needed
    const allIds = new Set<string>();
    for (const a of alerts as any[]) {
      const conds: Condition[] = a.conditions || [];
      conds.forEach(c => allIds.add(c.asset_id));
    }

    const url = `${COINGECKO}/coins/markets?vs_currency=usd&ids=${[...allIds].join(",")}&price_change_percentage=24h,7d`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("CoinGecko fetch failed");
    const markets = await r.json();
    const marketMap = new Map<string, any>(markets.map((m: any) => [m.id, m]));

    let triggered = 0;
    for (const a of alerts as any[]) {
      const conds: Condition[] = a.conditions || [];
      const evaluations = conds.map(c => {
        const m = marketMap.get(c.asset_id);
        const actual = getMetricValue(m, c.metric);
        if (actual === null || actual === undefined) return { ...c, actual: null, hit: false };
        return { ...c, actual, hit: evalOp(actual, c.operator, c.value) };
      });

      const allHit = evaluations.every(e => e.hit);
      const anyHit = evaluations.some(e => e.hit);
      const conditionMet = a.logic === "OR" ? anyHit : allHit;

      if (conditionMet) {
        await supabase
          .from("conditional_alerts")
          .update({
            status: "triggered",
            triggered_at: new Date().toISOString(),
            triggered_data: { evaluations, prices: Object.fromEntries([...marketMap].map(([k, v]: any) => [k, v.current_price])) },
            last_evaluated_at: new Date().toISOString(),
          })
          .eq("id", a.id);

        // Insert into alert_history for in-app display
        const firstCond = evaluations[0];
        const histRow: any = {
          alert_type: 'conditional',
          asset_id: firstCond.asset_id,
          asset_symbol: firstCond.asset_symbol,
          target_price: firstCond.value,
          triggered_price: firstCond.actual || 0,
        };
        if (a.user_id) histRow.user_id = a.user_id;
        else if (a.wallet_address) histRow.wallet_address = a.wallet_address;
        await supabase.from("alert_history").insert(histRow);
        triggered++;
      } else {
        await supabase
          .from("conditional_alerts")
          .update({ last_evaluated_at: new Date().toISOString() })
          .eq("id", a.id);
      }
    }

    return new Response(JSON.stringify({ evaluated: alerts.length, triggered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-conditional-alerts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
