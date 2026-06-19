
# Autonomous Crypto AI Trading Agent

A new "Auto Trader" module inside the existing Agent workspace that turns the AI from an analyst into a self-running operator: it generates strategies, backtests them, runs them in paper or live mode, manages risk, and rebalances the portfolio.

## Scope for this build

Lovable runs in the browser + Supabase Edge Functions. We cannot legally or safely place real CEX/DEX orders for users without their private keys + KYC + audited custody — so this build delivers the **full agent brain end-to-end in paper-trading mode**, with clean adapters so a real exchange key can be plugged in later per user.

What's IN:
1. Multi-source market data (already have CCXT + CoinGecko) extended for OHLCV history.
2. AI Strategy Generator (trend / momentum / scalping / swing / mean-reversion / arbitrage scout).
3. Backtesting engine (vectorized, runs in an edge function over historical OHLCV).
4. Paper Trading execution engine (simulated fills using live CCXT prices, with slippage + fee model).
5. Risk manager (position sizing, stop-loss, take-profit, max drawdown kill-switch).
6. Portfolio optimizer (target weights, rebalance suggestions, one-click apply in paper mode).
7. Arbitrage scanner (cross-exchange spread detection via CCXT).
8. Adaptive loop ("learn from outcomes"): after each closed trade, AI re-scores the strategy and tunes parameters; not full RL training, but an evaluator-improver loop using the AI gateway.
9. Trade journal + analytics dashboard (PnL, win rate, Sharpe, drawdown, per-strategy stats).
10. Scheduler (pg_cron) that wakes the agent every N minutes to evaluate signals and execute paper trades.

What's OUT (called out so expectations are clear):
- Real money order placement on Binance/Bybit/Coinbase/Hyperliquid/DEX. We ship the adapter interface + a disabled "Live" toggle that explains the user must add their own API keys and accept risk. Actual live trading would require a separate hardened backend, KYC, and audit — out of scope for a Lovable build.
- Smart-contract wallet custody / on-chain order signing. We integrate read-only with the already-connected wallet.
- True reinforcement learning training. Replaced by an LLM-driven evaluator that adjusts strategy params between runs.

## User experience

New top-level route `/auto-trader` reachable from a new nav icon next to the existing Agent icon. Layout uses the existing Agent workspace shell, with these tabs:

1. **Overview** — agent status (running / paused), equity curve, open positions, today's PnL, kill-switch.
2. **Strategies** — list of AI-generated and user-saved strategies; create new via prompt ("scalp ETH on 5m with RSI + volume"); each strategy card shows type, assets, timeframe, params, last backtest score.
3. **Backtest** — pick a strategy, asset, timeframe, date range; run; see equity curve, trades table, metrics (CAGR, Sharpe, max DD, win rate, profit factor).
4. **Paper Trading** — toggle a strategy live in paper mode; shows fills, open positions, PnL; respects risk limits.
5. **Portfolio Optimizer** — current allocation vs AI target allocation; "Apply rebalance (paper)" button generates the required paper trades.
6. **Arbitrage** — live table of cross-exchange spreads above a threshold, with estimated net edge after fees.
7. **Journal & Analytics** — every paper trade with entry, exit, reason, AI commentary; aggregated stats and charts.
8. **Settings** — global risk caps (max position %, daily loss %, max leverage = 1 for spot paper), enabled exchanges (data only), notification prefs.

A global "Agent state" pill in the header shows: Idle / Scanning / Trading / Halted.

## Data model (Supabase)

New tables, all RLS-scoped to `auth.uid()` with GRANTs to authenticated + service_role:

- `trading_strategies` — id, user_id, name, type, assets[], timeframe, params jsonb, status (draft/active/paused), source (ai/user), created_at.
- `strategy_backtests` — id, strategy_id, user_id, range_start, range_end, metrics jsonb, equity_curve jsonb, trades jsonb, created_at.
- `paper_accounts` — id, user_id, base_currency, starting_balance, cash_balance, equity, updated_at.
- `paper_positions` — id, user_id, account_id, symbol, exchange, qty, avg_entry, stop_loss, take_profit, strategy_id, opened_at.
- `paper_orders` — id, user_id, account_id, strategy_id, symbol, side, type, qty, price, status, filled_at, fee, slippage_bps.
- `paper_trades` — id, user_id, account_id, strategy_id, symbol, side, qty, entry_price, exit_price, pnl, pnl_pct, opened_at, closed_at, reason_open, reason_close, ai_commentary.
- `portfolio_targets` — id, user_id, weights jsonb, rationale text, generated_at.
- `agent_runs` — id, user_id, kind (scan/execute/rebalance/backtest), status, started_at, finished_at, summary jsonb.
- `arbitrage_opportunities` — id, symbol, exchange_a, exchange_b, spread_bps, est_net_bps, detected_at (global table, anon read OK).

Every `CREATE TABLE` migration includes its GRANTs and RLS policies in the same migration.

## Edge functions

- `agent-strategy-generate` — LLM (Lovable AI Gateway, gemini-3-flash-preview) takes a prompt + market context, returns a strategy spec validated by a small Zod schema (kept tight to avoid Gemini "too many states").
- `agent-backtest` — fetches OHLCV via CCXT, runs the strategy vectorized in TypeScript, returns metrics + equity curve, stores result.
- `agent-tick` — invoked by pg_cron every 5 min: for each active strategy, fetch latest candles, evaluate signals, place paper orders, update positions, enforce stops/TPs, write journal entries.
- `agent-optimize-portfolio` — LLM + simple mean-variance heuristic over the user's holdings; returns target weights and the trades needed to reach them.
- `agent-arbitrage-scan` — pg_cron every 1 min: pull tickers from N exchanges via CCXT, write opportunities above threshold.
- `agent-evaluate` — after a trade closes, AI reviews journal entries and proposes parameter tweaks; user approves to apply.

All functions reuse the existing `crypto-ai` auth + credits pattern (JWT + walletAddress fallback), CORS from `npm:@supabase/supabase-js@2/cors`, and `deduct_credits_atomic` for any AI-billed calls (free for pure backtests and ticks).

## Frontend pieces

- `src/pages/AutoTrader.tsx` + tab components under `src/components/auto-trader/tabs/`.
- New nav icon in `AppHeader.tsx` next to the Agent icon (Bot → Cpu).
- Hooks: `useStrategies`, `useBacktest`, `usePaperAccount`, `usePaperPositions`, `useArbitrage`, `useAgentRuns`.
- Realtime subscriptions on `paper_orders`, `paper_positions`, `agent_runs` for live updates.
- Charts reuse existing Recharts setup; equity curve, drawdown, allocation pie.

## Safety and credits

- Live trading toggle is disabled with an explainer modal.
- Daily-loss kill-switch halts the agent and notifies the user.
- AI calls (strategy generation, evaluator, portfolio optimizer) cost credits like other AI features; ticks and backtests are free.
- All new tables RLS-scoped; arbitrage table is public-read because it's market data.

## Delivery in phases

Phase 1 — Data model + nav + Overview/Strategies/Backtest tabs + `agent-strategy-generate` + `agent-backtest`.
Phase 2 — Paper trading: `paper_accounts`/`paper_positions`/`paper_orders`/`paper_trades` + `agent-tick` cron + Paper Trading tab + Journal.
Phase 3 — Portfolio Optimizer + Arbitrage scanner + Evaluator loop + Analytics dashboard.

Each phase ends with a runnable, demoable feature.

```text
nav: [Home] [Markets] [Portfolio] [Agent] [Auto-Trader*] [Realtime] [Chat] ...
                                            ^ new
```

Approve this and I'll start with Phase 1.
