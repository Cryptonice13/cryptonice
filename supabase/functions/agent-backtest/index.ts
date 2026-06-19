// Edge function: agent-backtest
// Vectorized backtest of a strategy spec over historical OHLCV. Free (no credits).
// @ts-ignore - npm specifier resolved at runtime
import ccxt from "npm:ccxt@4.4.34";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

function rsi(values: number[], period: number): (number | null)[] {
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
      } else {
        out.push(null);
      }
    } else {
      gain = (gain * (period - 1) + g) / period;
      loss = (loss * (period - 1) + l) / period;
      const rs = loss === 0 ? 100 : gain / loss;
      out.push(100 - 100 / (1 + rs));
    }
  }
  return out;
}

interface Params {
  indicator: "sma_cross" | "rsi" | "macd" | "breakout";
  fastPeriod?: number;
  slowPeriod?: number;
  rsiPeriod?: number;
  rsiOverbought?: number;
  rsiOversold?: number;
  stopLossPct: number;
  takeProfitPct: number;
  positionSizePct: number;
}

interface Trade {
  side: "long";
  entryTime: number; entryPrice: number;
  exitTime: number; exitPrice: number;
  pnl: number; pnlPct: number; reason: string;
}

function runBacktest(candles: Candle[], params: Params, startCash = 10000, feeBps = 10) {
  const closes = candles.map(c => c.c);
  const n = closes.length;

  // Generate signal series: +1 enter long, -1 exit
  const signals: number[] = new Array(n).fill(0);
  if (params.indicator === "sma_cross" || params.indicator === "macd") {
    const fast = sma(closes, Math.max(2, params.fastPeriod ?? 12));
    const slow = sma(closes, Math.max(3, params.slowPeriod ?? 26));
    for (let i = 1; i < n; i++) {
      const f = fast[i], s = slow[i], pf = fast[i - 1], ps = slow[i - 1];
      if (f != null && s != null && pf != null && ps != null) {
        if (pf <= ps && f > s) signals[i] = 1;
        else if (pf >= ps && f < s) signals[i] = -1;
      }
    }
  } else if (params.indicator === "rsi") {
    const r = rsi(closes, Math.max(2, params.rsiPeriod ?? 14));
    const ob = params.rsiOverbought ?? 70;
    const os = params.rsiOversold ?? 30;
    for (let i = 1; i < n; i++) {
      const cur = r[i], prev = r[i - 1];
      if (cur == null || prev == null) continue;
      if (prev <= os && cur > os) signals[i] = 1;
      else if (prev >= ob && cur < ob) signals[i] = -1;
    }
  } else if (params.indicator === "breakout") {
    const lookback = Math.max(10, params.slowPeriod ?? 20);
    for (let i = lookback; i < n; i++) {
      const window = closes.slice(i - lookback, i);
      const hi = Math.max(...window), lo = Math.min(...window);
      if (closes[i] > hi) signals[i] = 1;
      else if (closes[i] < lo) signals[i] = -1;
    }
  }

  let cash = startCash;
  let equity = startCash;
  let position: { qty: number; entryPrice: number; entryTime: number; stop: number; tp: number } | null = null;
  const trades: Trade[] = [];
  const equityCurve: { t: number; equity: number }[] = [];
  const sizePct = params.positionSizePct / 100;
  const feeMul = feeBps / 10000;

  for (let i = 0; i < n; i++) {
    const c = candles[i];
    // Check stops/TPs intrabar
    if (position) {
      let exitPrice: number | null = null, reason = "";
      if (c.l <= position.stop) { exitPrice = position.stop; reason = "stop_loss"; }
      else if (c.h >= position.tp) { exitPrice = position.tp; reason = "take_profit"; }
      else if (signals[i] === -1) { exitPrice = c.c; reason = "signal_exit"; }
      if (exitPrice != null) {
        const gross = position.qty * exitPrice;
        const fee = gross * feeMul;
        cash += gross - fee;
        const pnl = (exitPrice - position.entryPrice) * position.qty - fee - position.qty * position.entryPrice * feeMul;
        const pnlPct = (exitPrice / position.entryPrice - 1) * 100;
        trades.push({
          side: "long",
          entryTime: position.entryTime, entryPrice: position.entryPrice,
          exitTime: c.t, exitPrice, pnl, pnlPct, reason,
        });
        position = null;
      }
    }
    if (!position && signals[i] === 1) {
      const allocate = equity * sizePct;
      const qty = allocate / c.c;
      const fee = allocate * feeMul;
      cash -= allocate + fee;
      position = {
        qty, entryPrice: c.c, entryTime: c.t,
        stop: c.c * (1 - params.stopLossPct / 100),
        tp: c.c * (1 + params.takeProfitPct / 100),
      };
    }
    equity = cash + (position ? position.qty * c.c : 0);
    if (i % Math.max(1, Math.floor(n / 200)) === 0 || i === n - 1) {
      equityCurve.push({ t: c.t, equity });
    }
  }

  // Force-close at end
  if (position && candles.length) {
    const last = candles[candles.length - 1];
    const gross = position.qty * last.c;
    const fee = gross * feeMul;
    cash += gross - fee;
    const pnl = (last.c - position.entryPrice) * position.qty - fee - position.qty * position.entryPrice * feeMul;
    trades.push({
      side: "long", entryTime: position.entryTime, entryPrice: position.entryPrice,
      exitTime: last.t, exitPrice: last.c, pnl, pnlPct: (last.c / position.entryPrice - 1) * 100, reason: "end_of_range",
    });
    equity = cash;
    equityCurve.push({ t: last.t, equity });
  }

  // Metrics
  const finalEquity = equity;
  const totalReturnPct = (finalEquity / startCash - 1) * 100;
  const wins = trades.filter(t => t.pnl > 0).length;
  const winRate = trades.length ? (wins / trades.length) * 100 : 0;
  const grossProfit = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  let peak = startCash, maxDD = 0;
  for (const p of equityCurve) {
    peak = Math.max(peak, p.equity);
    const dd = (peak - p.equity) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  // Simple Sharpe on bar returns
  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    returns.push(equityCurve[i].equity / equityCurve[i - 1].equity - 1);
  }
  const meanR = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const varR = returns.reduce((a, b) => a + (b - meanR) ** 2, 0) / (returns.length || 1);
  const sd = Math.sqrt(varR);
  const sharpe = sd > 0 ? (meanR / sd) * Math.sqrt(252) : 0;

  return {
    metrics: {
      startEquity: startCash,
      finalEquity: Number(finalEquity.toFixed(2)),
      totalReturnPct: Number(totalReturnPct.toFixed(2)),
      tradesCount: trades.length,
      winRate: Number(winRate.toFixed(2)),
      profitFactor: Number.isFinite(profitFactor) ? Number(profitFactor.toFixed(2)) : null,
      maxDrawdownPct: Number((maxDD * 100).toFixed(2)),
      sharpe: Number(sharpe.toFixed(2)),
    },
    equityCurve,
    trades: trades.slice(-200),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json().catch(() => null);
    if (!body) return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const strategyId = typeof body.strategyId === "string" ? body.strategyId : null;
    const symbol = (typeof body.symbol === "string" ? body.symbol : "BTC/USDT").slice(0, 32);
    const exchangeId = (typeof body.exchange === "string" ? body.exchange : "binance").slice(0, 16);
    const timeframe = (typeof body.timeframe === "string" ? body.timeframe : "1h").slice(0, 4);
    const limit = Math.min(Math.max(Number(body.limit) || 500, 50), 1000);
    const params: Params = body.params || {};

    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const userClient = createClient(SUPABASE_URL, ANON_KEY);
        const { data } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
        if (data?.user) userId = data.user.id;
      } catch (_) { /* ignore */ }
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // @ts-ignore dynamic ccxt indexing
    const ExClass = (ccxt as any)[exchangeId];
    if (!ExClass) return new Response(JSON.stringify({ error: "Unsupported exchange" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const ex = new ExClass({ enableRateLimit: true, timeout: 12000 });
    if (!ex.has?.fetchOHLCV) return new Response(JSON.stringify({ error: "Exchange lacks OHLCV" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let rawCandles: number[][];
    try {
      rawCandles = await ex.fetchOHLCV(symbol, timeframe, undefined, limit);
    } catch (e) {
      console.error("fetchOHLCV failed:", e);
      return new Response(JSON.stringify({ error: `Failed to load candles: ${(e as Error).message?.slice(0, 200)}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const candles: Candle[] = rawCandles.map(c => ({ t: c[0], o: c[1], h: c[2], l: c[3], c: c[4], v: c[5] }));
    if (candles.length < 30) {
      return new Response(JSON.stringify({ error: "Not enough candles to backtest" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = runBacktest(candles, params);

    // Persist
    if (strategyId) {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      await admin.from("strategy_backtests").insert({
        strategy_id: strategyId,
        user_id: userId,
        symbol, exchange: exchangeId, timeframe,
        range_start: new Date(candles[0].t).toISOString(),
        range_end: new Date(candles[candles.length - 1].t).toISOString(),
        metrics: result.metrics,
        equity_curve: result.equityCurve,
        trades: result.trades,
      });
      await admin.from("trading_strategies").update({
        last_backtest_score: result.metrics.totalReturnPct,
      }).eq("id", strategyId).eq("user_id", userId);
    }

    return new Response(JSON.stringify({
      ...result,
      symbol, exchange: exchangeId, timeframe,
      candlesCount: candles.length,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("agent-backtest error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
