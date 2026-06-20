// Edge function: agent-arbitrage-scan
// Scans cross-exchange spreads for major symbols and writes to arbitrage_opportunities.
// Publicly callable (no credits).
// @ts-ignore
import ccxt from "npm:ccxt@4.4.34";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXCHANGES = ["binance", "kraken", "coinbase", "bybit", "okx"];
const SYMBOLS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT", "DOGE/USDT", "BNB/USDT"];
// Coinbase uses USD instead of USDT for some pairs
const SYMBOL_ALIAS: Record<string, Record<string, string>> = {
  coinbase: { "BTC/USDT": "BTC/USD", "ETH/USDT": "ETH/USD", "SOL/USDT": "SOL/USD", "XRP/USDT": "XRP/USD", "DOGE/USDT": "DOGE/USD" },
  kraken:   { "BTC/USDT": "BTC/USDT", "ETH/USDT": "ETH/USDT" },
};
const FEE_BPS_PER_LEG = 10; // taker each side -> 20 bps roundtrip
const MIN_SPREAD_BPS = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const prices: Record<string, Record<string, number>> = {};
    for (const ex of EXCHANGES) {
      try {
        // @ts-ignore
        const ExClass = (ccxt as any)[ex];
        if (!ExClass) continue;
        const client = new ExClass({ enableRateLimit: true, timeout: 8000 });
        for (const baseSym of SYMBOLS) {
          const sym = SYMBOL_ALIAS[ex]?.[baseSym] ?? baseSym;
          try {
            const t = await client.fetchTicker(sym);
            const p = t.last ?? t.close ?? t.bid;
            if (p) {
              prices[baseSym] = prices[baseSym] || {};
              prices[baseSym][ex] = Number(p);
            }
          } catch { /* skip */ }
        }
      } catch (e) { console.warn(ex, e); }
    }

    const opps: any[] = [];
    for (const sym of SYMBOLS) {
      const m = prices[sym]; if (!m) continue;
      const entries = Object.entries(m);
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const [a, pa] = entries[i], [b, pb] = entries[j];
          const lo = Math.min(pa, pb), hi = Math.max(pa, pb);
          const spreadBps = ((hi - lo) / lo) * 10000;
          const netBps = spreadBps - FEE_BPS_PER_LEG * 2;
          if (spreadBps >= MIN_SPREAD_BPS) {
            opps.push({
              symbol: sym,
              exchange_a: pa < pb ? a : b,
              exchange_b: pa < pb ? b : a,
              price_a: lo, price_b: hi,
              spread_bps: Number(spreadBps.toFixed(2)),
              est_net_bps: Number(netBps.toFixed(2)),
            });
          }
        }
      }
    }

    if (opps.length) await admin.from("arbitrage_opportunities").insert(opps);

    // Trim old rows (>30 min)
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    await admin.from("arbitrage_opportunities").delete().lt("detected_at", cutoff);

    return new Response(JSON.stringify({ ok: true, count: opps.length, opportunities: opps }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("arbitrage-scan error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
