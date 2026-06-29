# Live Agent Flow for Auto-Trader in Chat

Today the trading agent already runs tool loops on the server (`crypto-trading-agent`), but the chat just shows a typing dots animation until everything is done, then dumps the final answer + tool cards. That doesn't feel like a real agent. This plan upgrades the UX to match how ChatGPT/Claude/Manus agents actually run: the user sees the agent *think*, *pick a tool*, *run it*, *show the result*, *think again*, and finally *answer* — all live.

## What the user will see

When they type something like "build me a momentum strategy for ETH 1h, 2% risk, then backtest it":

```text
You: build me a momentum strategy for ETH 1h, 2% risk, then backtest it

Agent
  ● Thinking…
  ▸ Step 1 · generate_strategy        [running] → [done · 1.4s]
       "ETH/USDT 1h SMA(20/50) cross, 2% SL, 4% TP"
  ▸ Step 2 · save_strategy            [running] → [done · 0.3s]
       Saved as "ETH Momentum 1h" (id abc…)
  ▸ Step 3 · run_backtest             [running] → [done · 2.1s]
       PnL +8.2%  ·  Sharpe 1.4  ·  Win 58%
  ● Writing answer…
  "Here's a momentum strategy on ETH 1h…" (streaming tokens)

  [Strategy card]  [Backtest card]  → Open in Auto-Trader
```

Each step appears the moment the server fires it. The user can collapse/expand a step to see args + the rich result card. Final assistant text streams in token by token after the last tool returns.

## Scope

In: every Auto-Trader capability already exposed by `crypto-trading-agent` (generate/save/list/activate strategy, backtest, paper tick/state, optimize portfolio, scan arbitrage, evaluate journal). Out: live exchange execution, RL evolution, new tools — none of that changes here.

## Changes

### 1. `supabase/functions/crypto-trading-agent/index.ts` — stream agent events (SSE)

- Switch the response from a single JSON blob to `text/event-stream`.
- Keep the same tool-loop logic, but emit named events as it runs:
  - `step` — `{ index, status: "thinking" }` before each model call
  - `tool_call` — `{ id, name, args, status: "running" }` when a tool starts
  - `tool_result` — `{ id, result, ms, status: "done" | "error" }` when it returns
  - `text_delta` — `{ delta }` for streamed final-answer tokens (request `stream:true` for the last model turn that produces user-facing text)
  - `done` — `{ toolCalls }` at the end so the client can persist
  - `error` — `{ message, status }` on failure (401/402/429 surfaced clearly)
- Raise `MAX_STEPS` from 6 → 10 to support longer chains.
- Auth + credit deduction unchanged (each downstream tool keeps charging via `deduct_credits_atomic`).

### 2. `src/hooks/useTradingAgent.ts` — SSE reader

- Replace the single-shot `fetch` with a streaming reader that parses the SSE events above.
- Expose an `onEvent` callback (or async generator) so the UI can update per event.
- Keep `isTradingIntent` as is, but broaden the keyword set slightly (`tick`, `signal for paper`, `weights`, `spread`).

### 3. `src/components/ai/ChatInterface.tsx` — progressive assistant message

- When a trading-intent prompt is sent, immediately insert an assistant placeholder message with an empty `agentSteps: AgentStep[]` and `content: ''`.
- Subscribe to `callTradingAgent`'s streamed events and mutate that placeholder in place:
  - `tool_call` → push `{ id, name, args, status: 'running', startedAt }`
  - `tool_result` → mark the matching step `done`/`error`, store `result` + duration
  - `text_delta` → append to `content`
  - `done` → flip overall status to `done` and persist via `onSaveMessage` (existing path, plus new `<!--steps:…-->` marker so reloads show the timeline)
- Replace the static "three dots" with a live status line ("Thinking…" → "Running generate_strategy…" → "Writing answer…") driven by the latest event.
- Reuse existing `AgentToolCard` for the rich card under each completed step; no new card components needed.

### 4. `src/components/ai/AgentStepTimeline.tsx` *(new)*

- Small presentational component that renders the per-message step list with:
  - status dot (pulsing for running, check for done, x for error)
  - tool name + duration
  - collapsible args (JSON) + result (rendered via `AgentToolCard` when available, else compact JSON)
- Used inside `ChatInterface` above the assistant text bubble.

### 5. Non-trading chat unchanged

Generic prompts ("what's BTC sentiment?") still go through `crypto-ai` and render the old way. No regression to that flow.

## Acceptance checks

1. "Build me an RSI strategy for BTC, 2% risk" shows steps appearing live, ending with a strategy card and streamed summary.
2. "Backtest my latest strategy on 4h" runs `list_my_strategies` then `run_backtest` with both steps visible.
3. "Find arbitrage on SOL" shows a single `scan_arbitrage` step + the arbitrage card.
4. Reloading a saved conversation restores the steps timeline + cards from the persisted marker.
5. Insufficient credits / rate limit / auth errors surface as a red error step, not a silent failure.
6. Non-trading prompt ("what do you think of BTC?") still routes to `crypto-ai` and renders as before.

## Technical notes

- SSE format kept minimal: `event: <name>\ndata: <json>\n\n`. No external SSE lib — `TextDecoderStream` + line buffer on the client (same pattern already used in `useCryptoAI.ts`).
- Persistence marker extended: `<!--tools:…-->` stays for back-compat; a new optional `<!--steps:…-->` block stores the timeline. Old messages without it just don't show a timeline.
- No DB migration. No new edge function. No new env vars.
- Model stays on `google/gemini-3-flash-preview` (already approved default).
