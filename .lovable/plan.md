## Plan: Three Premium Features (Gaps 3, 4, 5)

Build three full working modules with backend (DB + edge functions), wired into existing pages and credit system.

---

### GAP 3 — Daily Portfolio Brief (`/portfolio`)

**Problem solved**: Users don't understand *why* their portfolio moved.

**New DB table** `portfolio_briefs`
- `id, user_id, wallet_address, brief_date (date), portfolio_snapshot (jsonb), total_value, day_change_pct, brief_data (jsonb {summary, top_movers, why_explanations[], news_drivers[], outlook}), created_at`
- RLS: own rows by user_id OR wallet_address (same pattern as other tables)
- Unique index on `(user_id, brief_date)` and `(wallet_address, brief_date)` to enforce 1 brief per day

**Edge function** `portfolio-brief` (new)
- Input: `{portfolio: [{symbol, amount, avg_buy_price}]}` + auth identity
- Fetches live CoinGecko market data **and 24h news** for held assets
- Calls Lovable AI (`google/gemini-3-flash-preview`) with structured tool-call output
- Returns JSON: `{summary, top_movers:[{symbol, change_pct, contribution_usd}], why_explanations:[{symbol, reason}], news_drivers:[{title, url, impact}], outlook}`
- Saves to `portfolio_briefs` table
- Cost: **3 credits** (deducted via existing `checkAndDeductCredits`)

**New component** `src/components/portfolio/DailyBrief.tsx`
- Card placed under `<PerformanceChart>` in `Portfolio.tsx`
- "Generate Today's Brief" button (disabled if today's brief exists → shows existing one)
- Renders: hero summary, top movers list with green/red chips, "Why" explanations per asset, news headlines as links, outlook badge
- History dropdown to view past 7 days

**Hook** `src/hooks/usePortfolioBrief.ts` — `generateBrief(portfolio)`, `getTodayBrief()`, `getBriefHistory()`

---

### GAP 4 — Verified Signal Marketplace (`/markets` Signal tab)

**Problem solved**: Influencer signals are noise / paid shilling. Need verified track records.

**New DB tables**:
1. `published_signals` — when a user "publishes" a trading signal generated on Markets page
   - `id, publisher_user_id, asset_id, asset_symbol, signal (BUY/SELL/HOLD), entry_price, stop_loss, take_profits (jsonb), timeframe, reasoning, published_at, status (active/closed/expired), closed_price, closed_at, outcome (win/loss/breakeven/pending), pnl_pct`
   - Public SELECT (anyone can browse), INSERT only own (auth required), UPDATE own
2. `signal_followers` — track who follows which publisher
   - `id, follower_user_id, publisher_user_id, created_at` — unique pair
3. View / function `publisher_stats` — computed stats: `total_signals, win_rate, avg_pnl, avg_rr, max_drawdown, last_30d_pnl, follower_count`

**Edge function** `verify-signals` (new, scheduled hourly via pg_cron)
- For each `active` signal in `published_signals`, fetch current CoinGecko price
- If price hits `stop_loss` → mark `loss`, record pnl
- If price hits any `take_profits` level → mark `win` proportionally
- If `published_at` > 7 days and timeframe expired → mark `expired`
- Updates `closed_price, closed_at, outcome, pnl_pct`

**New components**:
- `src/components/markets/SignalMarketplace.tsx` — leaderboard table: rank, publisher name, win rate %, total signals, avg P&L, follower count, "Follow" button. Filter by timeframe (7d/30d/all). Sort by win rate / pnl.
- `src/components/markets/PublisherDetailSheet.tsx` — opens on click: publisher's full signal history with outcomes, performance chart, recent active signals
- `src/components/markets/PublishSignalDialog.tsx` — added to existing `TradingSignalCard` as "Publish to Marketplace" button (after AI generates a signal). Pre-fills entry/SL/TP from the AI signal, requires reasoning text.

**Markets.tsx changes**:
- Add a 3rd tab "Signal Marketplace" alongside Spot/Options
- Inside the Signal tab on the right panel (`<TradingSignalCard>`) add "Publish" button that opens `PublishSignalDialog`

**Hook** `src/hooks/useSignalMarketplace.ts` — `publishSignal()`, `followPublisher()`, `unfollowPublisher()`, `getLeaderboard()`, `getPublisherSignals(id)`, `getMyPublishedSignals()`

**Cron**: SQL via `cron.schedule` to call `verify-signals` every hour.

---

### GAP 5 — AI Conditional Alerts (`/alerts`)

**Problem solved**: Users miss moves while sleeping; simple price alerts can't express "BTC < 90k AND volume > 2x avg".

**New DB table** `conditional_alerts`
- `id, user_id, wallet_address, name (user-given), natural_language (original prompt), conditions (jsonb — parsed structured rules), assets_involved (text[]), notify_via (jsonb: {email:bool, push:bool}), status (active/paused/triggered), triggered_at, triggered_data (jsonb), created_at`
- RLS: own rows pattern

**Edge function** `parse-conditional-alert` (new)
- Input: `{prompt: "Alert me when BTC drops below 90k AND volume spikes 2x"}`
- Calls Lovable AI with **tool-call** to extract structured conditions:
  ```json
  {
    "name": "BTC dump alert",
    "conditions": [
      {"asset_id":"bitcoin","metric":"price","operator":"lt","value":90000},
      {"asset_id":"bitcoin","metric":"volume_ratio_24h","operator":"gt","value":2}
    ],
    "logic": "AND"
  }
  ```
- Supported metrics: `price, price_change_24h_pct, price_change_7d_pct, volume_ratio_24h (vs 7d avg), market_cap_change_24h_pct, rsi_14`
- Operators: `gt, lt, gte, lte, eq, crosses_above, crosses_below`
- Cost: **2 credits** to create

**Edge function** `evaluate-conditional-alerts` (new, scheduled every 5 min via pg_cron)
- Loads all `active` conditional alerts
- Fetches CoinGecko data for all `assets_involved`
- For each alert evaluates conditions tree (AND/OR)
- If satisfied: marks `triggered`, inserts `alert_history` row, optionally calls Resend for email (if user opted in)

**New components**:
- New tab in `/alerts`: "AI Conditional" (5th tab)
- `src/components/alerts/ConditionalAlertBuilder.tsx` — large textarea with example prompts ("Alert me when ETH gas drops below 20 gwei", "BTC breaks 100k with volume confirmation"), parsed-result preview card showing the structured conditions before save, save button
- `src/components/alerts/ConditionalAlertList.tsx` — list of user's conditional alerts with status badges, pause/resume toggle, delete, last-evaluation timestamp

**Hook** `src/hooks/useConditionalAlerts.ts` — `parseAndCreate(prompt)`, `togglePauseAlert(id)`, `deleteAlert(id)`, `getMyAlerts()`

**Cron SQL** to invoke `evaluate-conditional-alerts` every 5 minutes.

---

### Cross-cutting

- All three features deduct credits via existing `checkAndDeductCredits` (Brief: 3, Publish signal: 2, Create conditional alert: 2)
- All edge functions follow existing CORS + Lovable AI gateway pattern (used in `crypto-ai/index.ts`)
- All new tables use the same dual `user_id + wallet_address` RLS pattern as the rest of the project
- `pg_cron` + `pg_net` extensions enabled for scheduled jobs

### Files

| File | Action |
|---|---|
| `supabase/migrations/...` | Create 4 tables, 1 view, 2 cron jobs, RLS policies |
| `supabase/functions/portfolio-brief/index.ts` | New edge function |
| `supabase/functions/verify-signals/index.ts` | New edge function (cron) |
| `supabase/functions/parse-conditional-alert/index.ts` | New edge function |
| `supabase/functions/evaluate-conditional-alerts/index.ts` | New edge function (cron) |
| `src/hooks/usePortfolioBrief.ts` | New hook |
| `src/hooks/useSignalMarketplace.ts` | New hook |
| `src/hooks/useConditionalAlerts.ts` | New hook |
| `src/components/portfolio/DailyBrief.tsx` | New component |
| `src/components/markets/SignalMarketplace.tsx` | New component |
| `src/components/markets/PublisherDetailSheet.tsx` | New component |
| `src/components/markets/PublishSignalDialog.tsx` | New component |
| `src/components/alerts/ConditionalAlertBuilder.tsx` | New component |
| `src/components/alerts/ConditionalAlertList.tsx` | New component |
| `src/pages/Portfolio.tsx` | Add `<DailyBrief>` under PerformanceChart |
| `src/pages/Markets.tsx` | Add 3rd tab "Signals" + Publish button on TradingSignalCard area |
| `src/pages/Alerts.tsx` | Add 5th tab "AI Conditional" |
| `src/lib/credits.ts` | (no change — reuse existing) |

### Notes

- Resend email integration is **optional** for the conditional alerts notification — if you want email/push delivery, I'll need a Resend connection (handled via standard connector). Otherwise, alerts surface in the existing in-app `alert_history` feed (which already works).
- Marketplace verification cron requires `pg_cron`/`pg_net` to be enabled; I'll enable them in the migration.
- Publishing signals creates real-time accountability — wins/losses are auto-tracked, no way to fake stats.
