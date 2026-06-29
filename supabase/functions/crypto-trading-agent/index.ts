// Edge function: crypto-trading-agent
// AI agent specialized in the platform's Auto-Trader: it understands user prompts,
// asks clarifying questions, and calls the existing agent-* edge functions as tools.
// Returns { content, toolCalls: [{name, args, result}] } — same contract as crypto-ai
// so the existing ChatInterface renders tool cards out of the box.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-3-flash-preview";
const MAX_STEPS = 10;

// ---------------------------------------------------------------------------
// Tool definitions (OpenAI-compatible)
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_strategy",
      description:
        "Generate a complete, backtestable spot trading strategy from a natural-language description. " +
        "Use AFTER you have at least: asset(s), a risk profile (conservative/balanced/aggressive) or stop-loss %, " +
        "and a style (trend/momentum/scalping/swing/mean_reversion). If anything is missing, ASK first — do NOT call this.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Detailed strategy brief, e.g. 'momentum SMA-cross on ETH 1h, 2% stop, 4% TP, 20% size'." },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_strategy",
      description: "Persist a generated strategy so the user can backtest or activate it. Returns the new strategy id.",
      parameters: {
        type: "object",
        properties: {
          strategy: { type: "object", description: "Full strategy spec returned by generate_strategy." },
        },
        required: ["strategy"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_my_strategies",
      description: "List the user's saved trading strategies (id, name, status, last backtest score).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "set_strategy_status",
      description: "Activate or pause a saved strategy by id. Activating makes it participate in paper-trading ticks.",
      parameters: {
        type: "object",
        properties: {
          strategyId: { type: "string" },
          status: { type: "string", enum: ["active", "paused"] },
        },
        required: ["strategyId", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_backtest",
      description:
        "Backtest a saved strategy on historical OHLCV. Free. Returns metrics (PnL, Sharpe, max DD, win rate) and a compact equity curve.",
      parameters: {
        type: "object",
        properties: {
          strategyId: { type: "string", description: "Id of a saved strategy (preferred)." },
          symbol: { type: "string", description: "CCXT symbol e.g. BTC/USDT. Default BTC/USDT." },
          exchange: { type: "string", description: "Exchange id (binance, bybit, coinbase, kraken, okx). Default binance." },
          timeframe: { type: "string", description: "1m, 5m, 15m, 1h, 4h, 1d. Default 1h." },
          limit: { type: "number", description: "Number of candles 50-1000. Default 500." },
          params: { type: "object", description: "Strategy params (indicator, periods, stopLossPct, takeProfitPct, positionSizePct)." },
        },
        required: ["params"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_paper_tick",
      description: "Evaluate every active strategy once: open/close paper positions, enforce SL/TP. Returns the events.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_paper_state",
      description: "Read the user's paper account: cash, equity, open positions, and recent orders.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "optimize_portfolio",
      description:
        "AI-driven portfolio weights based on risk tolerance and horizon. Costs 5 credits server-side.",
      parameters: {
        type: "object",
        properties: {
          riskTolerance: { type: "string", enum: ["conservative", "balanced", "aggressive"] },
          horizon: { type: "string", enum: ["short", "medium", "long"] },
        },
        required: ["riskTolerance", "horizon"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scan_arbitrage",
      description: "Find cross-exchange spread opportunities. Optionally filter by symbol (BTC, ETH, SOL, ...).",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "evaluate_journal",
      description: "Run AI commentary over recent paper trades to suggest parameter tweaks. Costs 3 credits server-side.",
      parameters: { type: "object", properties: {} },
    },
  },
] as const;

const SYSTEM_PROMPT = `You are the platform's Autonomous Trading Agent, a specialist for the Auto-Trader feature.

Your job is to help the user IDEATE, BUILD, BACKTEST, ACTIVATE and EVALUATE crypto spot trading strategies via paper-trading,
plus surface portfolio optimization and cross-exchange arbitrage. You are NOT a generic chat — stay on these tasks.

CORE BEHAVIOR
1. If the user gives a vague request ("make a strategy", "backtest one"), ASK 1-3 concise clarifying questions BEFORE calling any tool.
   Required minimums:
     - generate_strategy: asset(s), style (trend/momentum/scalping/swing/mean_reversion), risk (stop-loss % OR conservative/balanced/aggressive).
     - run_backtest: strategyId OR full params + symbol + timeframe.
     - optimize_portfolio: riskTolerance + horizon.
2. When you have enough, call the right tool. Never invent data — always use a tool.
3. After a tool result, briefly summarize what happened for the user in plain English (2-4 sentences), highlighting numbers that matter
   (PnL%, Sharpe, win rate, equity, top 1-2 arbitrage spreads, etc.). Do NOT dump JSON.
4. Chain tools when natural: e.g. generate_strategy → save_strategy → offer to backtest.
5. Money safety: never claim live execution. All trading is PAPER. Say so when relevant.
6. Credits: generate_strategy=3, optimize_portfolio=5, evaluate_journal=3. Mention cost once before calling for the first time per conversation.

OUTPUT STYLE
- Conversational, decisive, expert.
- Short paragraphs, bullets when listing.
- Always end with a single next-step suggestion ("Want me to backtest it on 4h?" or "Activate this strategy?").`;

// ---------------------------------------------------------------------------
// Tool executors
// ---------------------------------------------------------------------------
async function execTool(name: string, args: any, ctx: { userId: string; authHeader: string; admin: any; supabaseUrl: string }) {
  const { userId, authHeader, admin, supabaseUrl } = ctx;

  async function callFn(fnName: string, body: any) {
    const r = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!r.ok) return { error: data?.error || `Request failed (${r.status})` };
    return data;
  }

  try {
    switch (name) {
      case "generate_strategy": {
        const res = await callFn("agent-strategy-generate", { prompt: String(args.prompt || "").slice(0, 1000) });
        return res?.strategy ? res : { error: res?.error || "Strategy generation failed" };
      }
      case "save_strategy": {
        const s = args.strategy || {};
        if (!s?.params) return { error: "Invalid strategy spec" };
        const { data, error } = await admin.from("trading_strategies").insert({
          user_id: userId,
          name: String(s.name || "Untitled strategy").slice(0, 80),
          type: s.type || "trend",
          assets: Array.isArray(s.assets) ? s.assets.slice(0, 3) : ["BTC/USDT"],
          exchange: s.exchange || "binance",
          timeframe: s.timeframe || "1h",
          description: String(s.description || "").slice(0, 500),
          params: s.params,
          status: "draft",
        }).select("id, name, status").single();
        if (error) return { error: error.message };
        return { strategy: data };
      }
      case "list_my_strategies": {
        const { data, error } = await admin.from("trading_strategies")
          .select("id, name, type, status, assets, timeframe, last_backtest_score, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) return { error: error.message };
        return { strategies: data || [] };
      }
      case "set_strategy_status": {
        const status = args.status === "active" ? "active" : "paused";
        const { data, error } = await admin.from("trading_strategies")
          .update({ status })
          .eq("id", args.strategyId)
          .eq("user_id", userId)
          .select("id, name, status").maybeSingle();
        if (error) return { error: error.message };
        if (!data) return { error: "Strategy not found" };
        return { strategy: data };
      }
      case "run_backtest": {
        let body: any = {
          symbol: args.symbol || "BTC/USDT",
          exchange: args.exchange || "binance",
          timeframe: args.timeframe || "1h",
          limit: Math.min(Math.max(Number(args.limit) || 500, 50), 1000),
          params: args.params,
        };
        if (args.strategyId) {
          const { data: strat } = await admin.from("trading_strategies")
            .select("*").eq("id", args.strategyId).eq("user_id", userId).maybeSingle();
          if (strat) {
            body = {
              strategyId: strat.id,
              symbol: (strat.assets?.[0] || "BTC/USDT"),
              exchange: strat.exchange || "binance",
              timeframe: strat.timeframe || "1h",
              limit: body.limit,
              params: strat.params || args.params,
            };
          }
        }
        if (!body.params) return { error: "Missing strategy params" };
        const res = await callFn("agent-backtest", body);
        if (res?.error) return res;
        // Compact response for the model + UI
        return {
          symbol: res.symbol, exchange: res.exchange, timeframe: res.timeframe,
          metrics: res.metrics,
          equityCurve: res.equityCurve?.slice(-60),
          tradesCount: res.metrics?.tradesCount,
          recentTrades: (res.trades || []).slice(-5),
          strategyId: args.strategyId || null,
        };
      }
      case "run_paper_tick": {
        const res = await callFn("agent-tick", {});
        return res;
      }
      case "get_paper_state": {
        const { data: acct } = await admin.from("paper_accounts")
          .select("*").eq("user_id", userId).maybeSingle();
        const { data: positions } = await admin.from("paper_positions")
          .select("symbol, exchange, qty, avg_entry, stop_loss, take_profit, opened_at")
          .eq("user_id", userId).order("opened_at", { ascending: false });
        const { data: orders } = await admin.from("paper_orders")
          .select("symbol, side, qty, price, status, reason, filled_at")
          .eq("user_id", userId).order("filled_at", { ascending: false }).limit(10);
        return {
          account: acct ? {
            cash: Number(acct.cash_balance), equity: Number(acct.equity),
            starting: Number(acct.starting_balance), currency: acct.base_currency,
          } : null,
          positions: positions || [],
          recentOrders: orders || [],
        };
      }
      case "optimize_portfolio": {
        const res = await callFn("agent-optimize-portfolio", {
          riskTolerance: args.riskTolerance,
          horizon: args.horizon,
        });
        return res;
      }
      case "scan_arbitrage": {
        // Prefer fresh data via the scanner; fallback to cached rows
        const fresh = await callFn("agent-arbitrage-scan", { symbol: args.symbol });
        if (fresh && !fresh.error) {
          const list = Array.isArray(fresh.opportunities) ? fresh.opportunities : (fresh.results || []);
          return { opportunities: list.slice(0, 10) };
        }
        let q = admin.from("arbitrage_opportunities").select("*")
          .order("detected_at", { ascending: false }).limit(10);
        if (args.symbol) q = q.ilike("symbol", `${args.symbol}%`);
        const { data } = await q;
        return { opportunities: data || [] };
      }
      case "evaluate_journal": {
        const res = await callFn("agent-evaluate", {});
        return res;
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: (e as Error).message || "Tool execution failed" };
  }
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: trading agent is signed-in only (post wallet-bypass lockdown)
    const authHeader = req.headers.get("Authorization") || "";
    let userId: string | null = null;
    if (authHeader.startsWith("Bearer ")) {
      try {
        const userClient = createClient(SUPABASE_URL, ANON_KEY);
        const { data } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
        if (data?.user) userId = data.user.id;
      } catch (_) { /* ignore */ }
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Please sign in to use the Trading Agent." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Build chat messages
    const history = (body.messages as any[])
      .slice(-12)
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: typeof m.content === "string"
          ? m.content.replace(/<!--tools:[\s\S]*?-->/g, "").trim().slice(0, 4000)
          : "",
      }))
      .filter((m) => m.content.length > 0);

    const chatMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
    ];

    // ---- Stream agent events as SSE -------------------------------------
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };
        const allToolCalls: { id: string; name: string; args: any; result: any; ms: number }[] = [];
        let finalText = "";

        try {
          for (let step = 0; step < MAX_STEPS; step++) {
            send("step", { index: step, status: "thinking" });

            const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: MODEL,
                messages: chatMessages,
                tools: TOOLS,
                tool_choice: "auto",
                stream: true,
              }),
            });

            if (!r.ok) {
              const status = r.status;
              const msg = status === 429 ? "Rate limit exceeded. Try again shortly."
                : status === 402 ? "AI credits exhausted."
                : "AI service error";
              send("error", { status, message: msg });
              controller.close();
              return;
            }

            // Parse SSE stream from the gateway, accumulate text + tool_calls
            let accText = "";
            const accCalls: Map<number, { id?: string; name?: string; args: string }> = new Map();
            const reader = r.body!.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            outer: while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              let nl: number;
              while ((nl = buf.indexOf("\n")) >= 0) {
                const line = buf.slice(0, nl).trim();
                buf = buf.slice(nl + 1);
                if (!line.startsWith("data:")) continue;
                const payload = line.slice(5).trim();
                if (payload === "[DONE]") break outer;
                let chunk: any;
                try { chunk = JSON.parse(payload); } catch { continue; }
                const delta = chunk.choices?.[0]?.delta;
                if (!delta) continue;
                if (typeof delta.content === "string" && delta.content.length > 0) {
                  accText += delta.content;
                  send("text_delta", { delta: delta.content });
                }
                if (Array.isArray(delta.tool_calls)) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    const cur = accCalls.get(idx) || { args: "" };
                    if (tc.id) cur.id = tc.id;
                    if (tc.function?.name) cur.name = tc.function.name;
                    if (tc.function?.arguments) cur.args += tc.function.arguments;
                    accCalls.set(idx, cur);
                  }
                }
              }
            }

            if (accCalls.size > 0) {
              const calls = Array.from(accCalls.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([, v], i) => ({
                  id: v.id || `call_${step}_${i}`,
                  type: "function",
                  function: { name: v.name || "unknown", arguments: v.args || "{}" },
                }));

              chatMessages.push({
                role: "assistant",
                content: accText,
                tool_calls: calls,
              });

              for (const c of calls) {
                let parsedArgs: any = {};
                try { parsedArgs = JSON.parse(c.function.arguments || "{}"); } catch { /* keep empty */ }
                send("tool_call", { id: c.id, name: c.function.name, args: parsedArgs, status: "running" });
                const t0 = Date.now();
                const result = await execTool(c.function.name, parsedArgs, {
                  userId, authHeader, admin, supabaseUrl: SUPABASE_URL,
                });
                const ms = Date.now() - t0;
                const status = result && (result as any).error ? "error" : "done";
                send("tool_result", { id: c.id, result, ms, status });
                allToolCalls.push({ id: c.id, name: c.function.name, args: parsedArgs, result, ms });

                chatMessages.push({
                  role: "tool",
                  tool_call_id: c.id,
                  content: JSON.stringify(result).slice(0, 8000),
                });
              }
              continue; // loop for follow-up
            }

            // No tool calls → this turn produced the final answer
            finalText = accText;
            break;
          }

          if (!finalText && allToolCalls.length === 0) {
            finalText = "I couldn't complete that request. Try rephrasing.";
            send("text_delta", { delta: finalText });
          }
          if (!finalText && allToolCalls.length > 0) {
            finalText = "Done. See the tool results above.";
            send("text_delta", { delta: finalText });
          }

          send("done", {
            content: finalText,
            toolCalls: allToolCalls.map(({ name, args, result }) => ({ name, args, result })),
          });
          controller.close();
        } catch (e) {
          console.error("agent stream error", e);
          send("error", { status: 500, message: (e as Error).message || "Internal error" });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("crypto-trading-agent error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
