

## AI Strategy Builder -- Full-Stack Feature

A new dedicated page (`/strategy`) where users can create, backtest, and manage AI-powered crypto trading strategies. The AI analyzes market conditions and generates complete strategy configurations with entry/exit rules, risk management, and projected outcomes -- all displayed in a structured table.

---

### What Gets Built

**1. Strategy Builder Page** (`src/pages/StrategyBuilder.tsx`)
- Header section with "Create Strategy" button
- Strategy configuration form: select asset(s), timeframe, risk tolerance, strategy type (momentum, mean-reversion, breakout, DCA)
- Results panel showing AI-generated strategy with entry/exit rules, stop-loss, take-profit, position sizing
- Strategy history table listing all saved strategies with status, performance metrics, and actions
- Uses AppHeader and MobileBottomNav for consistent navigation

**2. Strategy Table Component** (`src/components/strategy/StrategyTable.tsx`)
- Sortable table showing: Strategy Name, Asset, Type, Signal (BUY/SELL/HOLD badge), Risk Level, Win Rate, Created Date, Status
- Row click expands to show full AI analysis
- Delete action per row

**3. Strategy Detail Card** (`src/components/strategy/StrategyDetailCard.tsx`)
- Expanded view when a strategy is selected
- Shows: entry/exit conditions, risk/reward ratio, position size recommendation, AI confidence score, support/resistance levels, full AI reasoning
- Visual risk meter and confidence gauge

**4. Strategy Form Component** (`src/components/strategy/StrategyForm.tsx`)
- Asset selector (from market data)
- Strategy type dropdown (Momentum, Mean Reversion, Breakout, DCA, Scalping)
- Risk tolerance slider (Conservative / Moderate / Aggressive)
- Investment amount input
- Timeframe selector (1D, 1W, 1M, 3M)
- "Generate Strategy" button that calls the AI

**5. Edge Function Update** (`supabase/functions/crypto-ai/index.ts`)
- New `strategy_builder` type that accepts asset, strategy type, risk level, amount, timeframe
- System prompt instructs AI to return structured JSON with: strategyName, signal, entryPrice, exitPrice, stopLoss, takeProfits[], positionSize, riskRewardRatio, winRateProbability, confidence, conditions[], reasoning
- Fetches real-time market data for the selected asset to ground the strategy in current prices

**6. Database Table** (`strategies`)
- Columns: id, user_id, wallet_address, asset_symbol, asset_id, strategy_name, strategy_type, risk_level, timeframe, investment_amount, signal, entry_price, exit_price, stop_loss, take_profits (jsonb), position_size, risk_reward, win_rate, confidence, conditions (jsonb), reasoning, status (active/completed/cancelled), created_at, updated_at
- RLS policies matching existing pattern (user_id OR wallet_address)

**7. Navigation Updates**
- `AppHeader.tsx`: Add "Strategy" to navItems array, update activePage type
- `MobileBottomNav.tsx`: Add Strategy icon (Cpu or Zap) as 5th nav item
- `App.tsx`: Add `/strategy` route with ProtectedRoute wrapper

---

### Technical Details

**New Files:**
| File | Purpose |
|------|---------|
| `src/pages/StrategyBuilder.tsx` | Main page with form + table + detail view |
| `src/components/strategy/StrategyForm.tsx` | Strategy configuration form |
| `src/components/strategy/StrategyTable.tsx` | Saved strategies table |
| `src/components/strategy/StrategyDetailCard.tsx` | Expanded strategy analysis view |
| `src/hooks/useStrategyBuilder.ts` | Hook for AI calls + Supabase CRUD |

**Modified Files:**
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/strategy` route |
| `src/components/AppHeader.tsx` | Add "Strategy" nav item, update type |
| `src/components/MobileBottomNav.tsx` | Add Strategy tab |
| `supabase/functions/crypto-ai/index.ts` | Add `strategy_builder` prompt type |
| `supabase/config.toml` | No change needed (crypto-ai already configured) |

**Database Migration:**
- Create `strategies` table with RLS policies for user_id and wallet_address access patterns

**AI Prompt Design:**
The strategy_builder prompt will instruct the AI to analyze real-time price data for the selected asset and return a JSON object with actionable trading parameters. The prompt adapts based on strategy type (e.g., momentum strategies focus on trend strength, mean-reversion on deviation from moving averages).

