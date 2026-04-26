import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COINGECKO = "https://api.coingecko.com/api/v3";

const TIMEFRAME_DAYS: Record<string, number> = {
  "1H": 0.04, "4H": 0.17, "1D": 1, "3D": 3, "1W": 7, "2W": 14, "1M": 30,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all active signals
    const { data: signals, error } = await supabase
      .from("published_signals")
      .select("*")
      .eq("status", "active");

    if (error) throw error;
    if (!signals || signals.length === 0) {
      return new Response(JSON.stringify({ checked: 0, message: "No active signals" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by asset_id and fetch prices in batch
    const uniqueIds = [...new Set(signals.map((s: any) => s.asset_id))];
    const url = `${COINGECKO}/coins/markets?vs_currency=usd&ids=${uniqueIds.join(",")}`;
    const priceResp = await fetch(url);
    if (!priceResp.ok) throw new Error("CoinGecko fetch failed");
    const markets = await priceResp.json();
    const priceMap = new Map<string, number>(markets.map((m: any) => [m.id, m.current_price]));

    let updated = 0;
    const now = Date.now();

    for (const sig of signals as any[]) {
      const currentPrice = priceMap.get(sig.asset_id);
      if (!currentPrice) continue;

      const tps: number[] = Array.isArray(sig.take_profits) ? sig.take_profits.map(Number) : [];
      const isBuy = sig.signal === "BUY";
      let outcome: string | null = null;
      let pnlPct: number | null = null;

      if (isBuy) {
        if (currentPrice <= sig.stop_loss) {
          outcome = "loss";
          pnlPct = ((sig.stop_loss - sig.entry_price) / sig.entry_price) * 100;
        } else {
          // Check if any TP hit (highest hit wins)
          const hitTPs = tps.filter(tp => currentPrice >= tp);
          if (hitTPs.length > 0) {
            const tp = Math.max(...hitTPs);
            outcome = "win";
            pnlPct = ((tp - sig.entry_price) / sig.entry_price) * 100;
          }
        }
      } else if (sig.signal === "SELL") {
        if (currentPrice >= sig.stop_loss) {
          outcome = "loss";
          pnlPct = ((sig.entry_price - sig.stop_loss) / sig.entry_price) * 100;
        } else {
          const hitTPs = tps.filter(tp => currentPrice <= tp);
          if (hitTPs.length > 0) {
            const tp = Math.min(...hitTPs);
            outcome = "win";
            pnlPct = ((sig.entry_price - tp) / sig.entry_price) * 100;
          }
        }
      }

      // Check expiration
      if (!outcome) {
        const days = TIMEFRAME_DAYS[sig.timeframe] || 7;
        const ageMs = now - new Date(sig.published_at).getTime();
        if (ageMs > days * 86400 * 1000) {
          outcome = "expired";
          pnlPct = isBuy
            ? ((currentPrice - sig.entry_price) / sig.entry_price) * 100
            : ((sig.entry_price - currentPrice) / sig.entry_price) * 100;
        }
      }

      if (outcome) {
        await supabase
          .from("published_signals")
          .update({
            status: outcome === "expired" ? "expired" : "closed",
            outcome,
            pnl_pct: pnlPct,
            closed_price: currentPrice,
            closed_at: new Date().toISOString(),
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", sig.id);
        updated++;
      } else {
        await supabase
          .from("published_signals")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", sig.id);
      }
    }

    return new Response(JSON.stringify({ checked: signals.length, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-signals error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
