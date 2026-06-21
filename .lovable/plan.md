# Integrate Auto-Trader into Chat as an Intelligent Trading Agent

Turn the chat assistant into a "trading copilot" that can detect strategy/backtest/portfolio/arbitrage intents, ask the right follow-up questions, run the existing Auto-Trader edge functions as tools, and render the results inline in the chat — without leaving the conversation.

## User experience

Examples that should "just work" from the chat composer:

- "Build me a momentum strategy for ETH on the 1h" → agent asks 2-3 missing details (risk %, capital, indicator) → calls `agent-strategy-generate` → renders a Strategy Card with "Run backtest" and "Activate paper trading" buttons.
- "Backtest that on the last 6 months" → agent reuses the last strategy id → calls `agent-backtest` → renders equity curve + KPIs.
- "Optimize my portfolio, I'm medium risk, 6-month horizon" → calls `agent-optimize-portfolio` → renders target weights table.
- "Any arbitrage on SOL right now?" → calls `agent-arbitrage-scan` → renders top spreads.
- "Run a tick on my active strategy" → calls `agent-tick` → renders the trades opened/closed.
- "How are my paper trades doing?" → calls `agent-evaluate` → renders AI journal commentary.

Free-form analysis prompts ("what do you think about BTC right now?") continue to work through the existing crypto-ai flow — no regression.

## What gets built

### 1. Tool layer (edge function)
- New edge function `crypto-trading-agent` (server-side, Lovable AI Gateway, model `google/gemini-3-flash-preview`).
- Uses the AI SDK's tool calling with `stepCountIs(50)` so the model can chain: ask → generate strategy → backtest → summarize.
- Tools wired as thin proxies that re-invoke the existing edge functions with the caller's JWT:
  - `generate_strategy` → `agent-strategy-generate`
  - `run_backtest` → `agent-backtest`
  - `list_my_strategies` (reads `trading_strategies` via service role, scoped to `user_id`)
  - `activate_strategy` / `pause_strategy` (UPDATE on `trading_strategies`)
  - `run_paper_tick` → `agent-tick`
  - `get_paper_state` (reads `paper_accounts`, `paper_positions`, recent `paper_orders`)
  - `optimize_portfolio` → `agent-optimize-portfolio`
  - `scan_arbitrage` → `agent-arbitrage-scan`
  - `evaluate_journal` → `agent-evaluate`
- Each tool has a tight Zod input schema and returns compact JSON the chat can render.
- Auth: function validates the user JWT (current chat pattern), passes `userId` into every tool call, and rejects unauthenticated calls.
- Credits: tools that already cost credits (strategy gen, backtest, optimizer, evaluate) reuse the existing `deduct_credits_atomic` path inside the downstream functions — no double charging.

### 2. Chat routing
- `useChat` / `useCryptoAI` gets a lightweight intent classifier (regex + keyword match on "strategy/backtest/paper/arbitrage/optimize/portfolio weights/tick") that flips the request to `crypto-trading-agent` instead of `crypto-ai`. Generic chat keeps using `crypto-ai`.
- A "Trading Agent" toggle in the chat composer lets users force the trading agent on/off; auto-detection is the default.

### 3. Rich result rendering in chat
New message-part renderers in `src/components/ai/` so tool outputs look like product, not JSON:
- `ChatStrategyCard` — name, indicator, SL/TP, "Run backtest", "Activate paper trading", "Open in Auto-Trader".
- `ChatBacktestCard` — equity sparkline (Recharts), PnL, Sharpe, Max DD, win rate.
- `ChatPortfolioTargetsCard` — target weights table + rationale.
- `ChatArbitrageCard` — top 3 spreads with exchange pair and net basis.
- `ChatPaperStateCard` — equity, open positions, last 5 orders.
- All cards link to `/auto-trader` with the relevant tab pre-selected via `?tab=...&strategyId=...`.

### 4. Clarifying-question pattern
The agent's system prompt instructs it to ask before acting whenever a required parameter is missing (asset, timeframe, indicator, risk, capital, horizon). Questions render as normal assistant text — no special UI needed — and the agent only invokes a tool once it has enough to proceed.

### 5. AutoTrader page wiring (light touch)
- Read `?tab=` and `?strategyId=` query params on `/auto-trader` so deep links from chat open the right tab and highlight the right row. No layout changes.

## Out of scope (call out, don't build)
- Live (non-paper) execution against real exchanges.
- Reinforcement-learning strategy evolution.
- Smart-contract wallet integration.
- Streaming token-by-token output in chat (current chat uses non-streaming; keeping that to minimize churn). Can be added later.

## Technical details

- **Stack**: existing Vite + React + Supabase Edge Functions; AI SDK (`npm:ai`) + `@ai-sdk/openai-compatible` via the Lovable AI Gateway helper pattern already used elsewhere.
- **New files**:
  - `supabase/functions/crypto-trading-agent/index.ts` — agent loop with tools.
  - `supabase/functions/_shared/ai-gateway.ts` — shared gateway provider helper (if not already present).
  - `src/hooks/useTradingAgent.ts` — client hook that posts to the new function and normalizes tool-part output.
  - `src/components/ai/cards/ChatStrategyCard.tsx`, `ChatBacktestCard.tsx`, `ChatPortfolioTargetsCard.tsx`, `ChatArbitrageCard.tsx`, `ChatPaperStateCard.tsx`.
- **Modified files**:
  - `src/components/ai/ChatInterface.tsx` — intent routing, render new card types when `message.toolResults` is present, "Trading Agent" toggle.
  - `src/hooks/useCryptoAI.ts` — branch to `useTradingAgent` based on intent / toggle.
  - `src/pages/AutoTrader.tsx` — honor `?tab=` / `?strategyId=` query params.
- **No database migration required.** Reuses existing tables (`trading_strategies`, `strategy_backtests`, `paper_*`, `portfolio_targets`, `arbitrage_opportunities`) and existing RLS (post-lockdown: signed-in user only).
- **Security**: function rejects requests without a valid Supabase JWT (already required after the wallet-bypass fix). All tool execution scopes to `auth.uid()`.

## Acceptance checks before shipping
1. Logged-in user types "build me an RSI strategy for BTC, 2% risk" → strategy card renders, "Run backtest" works, results render as a second card.
2. "Show me my paper account" → renders equity + open positions; matches the Paper tab.
3. "Find arbitrage on ETH" → arbitrage card with at least one row when the scanner has data.
4. Generic question ("what's BTC sentiment?") still goes through `crypto-ai` and renders normally — no regression.
5. Logged-out user → chat shows the existing auth gate; trading tools never run.