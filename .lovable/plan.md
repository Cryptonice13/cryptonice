

## Plan: Add Options & Futures Analysis Section to Strategy Builder

### Overview
Add a new tabbed section to the `/strategy` page that lets users generate AI-powered Options and Futures trading strategies for crypto assets, alongside the existing spot strategy builder.

### Changes

#### 1. Update Strategy Page with Tabs (`src/pages/StrategyBuilder.tsx`)
- Add a `Tabs` component at the top with three tabs: **Spot**, **Options**, **Futures**
- Spot tab contains the existing `StrategyForm` + `StrategyDetailCard` + `StrategyTable`
- Options and Futures tabs each render a new `DerivativesStrategyForm` component with mode-specific fields

#### 2. Create `src/components/strategy/DerivativesStrategyForm.tsx`
- New form component accepting a `mode` prop (`options` | `futures`)
- **Options-specific fields**: Contract type (Call/Put), Strike price (auto-suggested from current price), Expiry (1W/1M/3M/6M), Premium budget, Strategy preset (Long Call, Long Put, Covered Call, Straddle, Strangle, Iron Condor)
- **Futures-specific fields**: Leverage (1x-125x slider), Contract type (Perpetual/Quarterly), Position direction (Long/Short), Margin type (Isolated/Cross), Funding rate awareness
- **Shared fields**: Asset selector (reuse from existing), Investment amount, Risk tolerance slider
- Calls `generateDerivativesStrategy` from the hook

#### 3. Create `src/components/strategy/DerivativesResultCard.tsx`
- Displays AI-generated derivatives strategy results
- **Options view**: Max profit, max loss, breakeven price, Greeks (Delta, Gamma, Theta, Vega), payoff visualization description, optimal entry/exit timing
- **Futures view**: Liquidation price, margin requirements, funding rate impact, leverage-adjusted P&L targets, position sizing

#### 4. Update `src/hooks/useStrategyBuilder.ts`
- Add `DerivativesStrategyParams` interface with fields for options/futures config
- Add `DerivativesAIResult` interface with options/futures-specific output fields
- Add `generateDerivativesStrategy` function that calls the edge function with `type: 'derivatives_strategy'`
- Add `lastDerivativesResult` state
- Reuse existing DB save logic with `strategy_type` set to `options_*` or `futures_*`

#### 5. Update Edge Function (`supabase/functions/crypto-ai/index.ts`)
- Add `derivatives_strategy` case in `buildSystemPrompt`
- System prompt instructs AI to generate options or futures strategy based on mode
- Options prompt: calculate Greeks, breakeven, max profit/loss, optimal strategy selection
- Futures prompt: calculate liquidation price, margin requirements, leverage-adjusted targets
- Returns structured JSON matching `DerivativesAIResult`

### No Database Changes Needed
The existing `strategies` table already has flexible columns (`strategy_type`, `conditions` as JSONB, `reasoning`) that can store derivatives-specific data. The `strategy_type` column will distinguish between `options_long_call`, `futures_long`, etc.

### Technical Details
- The AI generates simulated Greeks and derivatives metrics based on current market data and volatility estimates
- Liquidation price calculation: `entry_price * (1 - 1/leverage)` for longs, `entry_price * (1 + 1/leverage)` for shorts
- Strategy presets for options map to specific AI prompt instructions
- All results saved to the same `strategies` table with type-prefixed `strategy_type` values

### Files
| File | Action |
|---|---|
| `src/pages/StrategyBuilder.tsx` | Modify -- add tabs for Spot/Options/Futures |
| `src/components/strategy/DerivativesStrategyForm.tsx` | Create -- form for options & futures params |
| `src/components/strategy/DerivativesResultCard.tsx` | Create -- display derivatives AI results |
| `src/hooks/useStrategyBuilder.ts` | Modify -- add derivatives types and generate function |
| `supabase/functions/crypto-ai/index.ts` | Modify -- add derivatives_strategy prompt case |

