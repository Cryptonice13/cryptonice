// Edge function: agent-tick
// Evaluates active strategies, fetches latest price, opens/closes paper positions,
// enforces stops/take-profits. Free (no credits).
// Can be invoked by pg_cron or manually from the UI.
// @ts-ignore
import ccxt from "npm:ccxt@4.4.34";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FEE_BPS = 10;       // 0.10% taker
const SLIPPAGE_BPS = 5;   // 0.05% slippage

function sma(values: number[], period: number) {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

function rsi(values: number[], period: number) {
  const out: (number | null)[] = [null];
  let gain = 0, loss = 0;
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    if (i <= period) {
      gain += g; loss += l;
      if (i === period) {
        gain /= period; loss /= period;
        const rs = loss === 0 ? 100 : gain / loss;
        out.push(100 - 100 / (1 + rs));
      } else out.push(null);
    } else {
      gain = (gain * (period - 1) + g) / period;
      loss = (loss * (period - 1) + l) / period;
      const rs = loss === 0 ? 100 : gain / loss;
      out.push(100 - 100 / (1 + rs));
    }
  }
  return out;
}

function evalSignal(closes: number[], params: any): -1 | 0 | 1 {
  const n = closes.length;
  if (n < 30) return 0;
  if (params.indicator === "sma_cross" || params.indicator === "macd") {
    const f = sma(closes, Math.max(2, params.fastPeriod ?? 12));
    const s = sma(closes, Math.max(3, params.slowPeriod ?? 26));
    const i = n - 1;
    if (f[i] != null && s[i] != null && f[i - 1] != null && s[i - 1] != null) {
      if ((f[i - 1] as number) <= (s[i - 1] as number) && (f[i] as number) > (s[i] as number)) return 1;
      if ((f[i - 1] as number) >= (s[i - 1] as number) && (f[i] as number) < (s[i] as number)) return -1;
    }
  } else if (params.indicator === "rsi") {
    const r = rsi(closes, Math.max(2, params.rsiPeriod ?? 14));
    const ob = params.rsiOverbought ?? 70;
    const os = params.rsiOversold ?? 30;
    const i = n - 1;
    if (r[i] != null && r[i - 1] != null) {
      if ((r[i - 1] as number) <= os && (r[i] as number) > os) return 1;
      if ((r[i - 1] as number) >= ob && (r[i] as number) < ob) return -1;
    }
  } else if (params.indicator === "breakout") {
    const lookback = Math.max(10, params.slowPeriod ?? 20);
    if (n <= lookback) return 0;
    const window = closes.slice(n - 1 - lookback, n - 1);
    const hi = Math.max(...window), lo = Math.min(...window);
    if (closes[n - 1] > hi) return 1;
    if (closes[n - 1] < lo) return -1;
  }
  return 0;
}

async function ensureAccount(admin: any, userId: string) {
  const { data } = await admin.from("paper_accounts").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data;
  const { data: created } = await admin.from("paper_accounts")
    .insert({ user_id: userId, base_currency: "USDT", starting_balance: 10000, cash_balance: 10000, equity: 10000 })
    .select("*").single();
  return created;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({}));
    let userId: string | null = body?.userId || null;

    const authHeader = req.headers.get("Authorization");
    if (!userId && authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY);
      const { data } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
      if (data?.user) userId = data.user.id;
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const account = await ensureAccount(admin, userId);
    const { data: strategies } = await admin.from("trading_strategies")
      .select("*").eq("user_id", userId).eq("status", "active");

    const events: any[] = [];
    let cash = Number(account.cash_balance);
    let equityMarkToMarket = cash;

    const { data: openPositions } = await admin.from("paper_positions")
      .select("*").eq("user_id", userId);

    // group strategy by symbol to avoid duplicate OHLCV fetches
    const symbolCache = new Map<string, number[]>();

    async function getCloses(exchange: string, symbol: string, timeframe: string) {
      const key = `${exchange}:${symbol}:${timeframe}`;
      if (symbolCache.has(key)) return symbolCache.get(key)!;
      // @ts-ignore
      const ExClass = (ccxt as any)[exchange] || (ccxt as any).binance;
      const ex = new ExClass({ enableRateLimit: true, timeout: 12000 });
      const ohlcv = await ex.fetchOHLCV(symbol, timeframe, undefined, 200);
      const closes = ohlcv.map((c: number[]) => c[4]);
      symbolCache.set(key, closes);
      return closes;
    }

    // 1) For each open position, check stop/TP using current price
    for (const pos of openPositions || []) {
      try {
        const closes = await getCloses(pos.exchange, pos.symbol, "5m");
        const price = closes[closes.length - 1];
        let exitReason: string | null = null;
        if (pos.stop_loss && price <= Number(pos.stop_loss)) exitReason = "stop_loss";
        else if (pos.take_profit && price >= Number(pos.take_profit)) exitReason = "take_profit";

        if (exitReason) {
          const fillPrice = price * (1 - SLIPPAGE_BPS / 10000);
          const gross = Number(pos.qty) * fillPrice;
          const fee = gross * (FEE_BPS / 10000);
          cash += gross - fee;
          const pnl = (fillPrice - Number(pos.avg_entry)) * Number(pos.qty) - fee;
          const pnlPct = (fillPrice / Number(pos.avg_entry) - 1) * 100;

          await admin.from("paper_orders").insert({
            user_id: userId, account_id: account.id, strategy_id: pos.strategy_id,
            symbol: pos.symbol, exchange: pos.exchange, side: "sell", order_type: "market",
            qty: pos.qty, price: fillPrice, fee, slippage_bps: SLIPPAGE_BPS, status: "filled", reason: exitReason,
          });
          await admin.from("paper_trades").insert({
            user_id: userId, account_id: account.id, strategy_id: pos.strategy_id,
            symbol: pos.symbol, exchange: pos.exchange, side: "long",
            qty: pos.qty, entry_price: pos.avg_entry, exit_price: fillPrice,
            pnl, pnl_pct: pnlPct, opened_at: pos.opened_at, reason_open: "signal", reason_close: exitReason,
          });
          await admin.from("paper_positions").delete().eq("id", pos.id);
          events.push({ type: "close", symbol: pos.symbol, reason: exitReason, pnl: Number(pnl.toFixed(2)) });
        } else {
          equityMarkToMarket += Number(pos.qty) * price;
        }
      } catch (e) {
        console.error("position eval error", e);
      }
    }

    // 2) For each active strategy, evaluate signals & open/close
    for (const strat of strategies || []) {
      try {
        const symbol = (strat.assets?.[0] || "BTC/USDT").toUpperCase();
        const exchange = strat.exchange || "binance";
        const tf = strat.timeframe || "5m";
        const closes = await getCloses(exchange, symbol, tf);
        const signal = evalSignal(closes, strat.params || {});
        const price = closes[closes.length - 1];

        const existing = (openPositions || []).find(p => p.symbol === symbol && p.strategy_id === strat.id);

        if (signal === 1 && !existing) {
          const sizePct = (strat.params?.positionSizePct ?? 10) / 100;
          const alloc = Math.min(equityMarkToMarket * sizePct, cash * 0.95);
          if (alloc < 10) continue;
          const fillPrice = price * (1 + SLIPPAGE_BPS / 10000);
          const qty = alloc / fillPrice;
          const fee = alloc * (FEE_BPS / 10000);
          cash -= alloc + fee;
          const stop = fillPrice * (1 - (strat.params?.stopLossPct ?? 3) / 100);
          const tp = fillPrice * (1 + (strat.params?.takeProfitPct ?? 6) / 100);
          await admin.from("paper_orders").insert({
            user_id: userId, account_id: account.id, strategy_id: strat.id,
            symbol, exchange, side: "buy", order_type: "market",
            qty, price: fillPrice, fee, slippage_bps: SLIPPAGE_BPS, status: "filled", reason: "signal_entry",
          });
          await admin.from("paper_positions").insert({
            user_id: userId, account_id: account.id, strategy_id: strat.id,
            symbol, exchange, qty, avg_entry: fillPrice, stop_loss: stop, take_profit: tp,
          });
          events.push({ type: "open", symbol, qty: Number(qty.toFixed(6)), price: Number(fillPrice.toFixed(4)) });
        } else if (signal === -1 && existing) {
          const fillPrice = price * (1 - SLIPPAGE_BPS / 10000);
          const gross = Number(existing.qty) * fillPrice;
          const fee = gross * (FEE_BPS / 10000);
          cash += gross - fee;
          const pnl = (fillPrice - Number(existing.avg_entry)) * Number(existing.qty) - fee;
          const pnlPct = (fillPrice / Number(existing.avg_entry) - 1) * 100;
          await admin.from("paper_orders").insert({
            user_id: userId, account_id: account.id, strategy_id: strat.id,
            symbol, exchange, side: "sell", order_type: "market",
            qty: existing.qty, price: fillPrice, fee, slippage_bps: SLIPPAGE_BPS, status: "filled", reason: "signal_exit",
          });
          await admin.from("paper_trades").insert({
            user_id: userId, account_id: account.id, strategy_id: strat.id,
            symbol, exchange, side: "long",
            qty: existing.qty, entry_price: existing.avg_entry, exit_price: fillPrice,
            pnl, pnl_pct: pnlPct, opened_at: existing.opened_at, reason_open: "signal", reason_close: "signal_exit",
          });
          await admin.from("paper_positions").delete().eq("id", existing.id);
          events.push({ type: "close", symbol, reason: "signal_exit", pnl: Number(pnl.toFixed(2)) });
        }
      } catch (e) {
        console.error("strategy tick error", strat.id, e);
      }
    }

    // Recompute equity
    const { data: stillOpen } = await admin.from("paper_positions").select("*").eq("user_id", userId);
    let eq = cash;
    for (const p of stillOpen || []) {
      try {
        const closes = await getCloses(p.exchange, p.symbol, "5m");
        eq += Number(p.qty) * closes[closes.length - 1];
      } catch { /* skip */ }
    }
    await admin.from("paper_accounts").update({ cash_balance: cash, equity: eq }).eq("id", account.id);
    await admin.from("agent_runs").insert({
      user_id: userId, kind: "tick", status: "ok",
      finished_at: new Date().toISOString(),
      summary: { events, equity: Number(eq.toFixed(2)), cash: Number(cash.toFixed(2)) },
    });

    return new Response(JSON.stringify({ ok: true, events, equity: eq, cash }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-tick error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
