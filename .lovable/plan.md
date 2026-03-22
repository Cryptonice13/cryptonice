

## Plan: Fix Three Platform Issues

### Issue 1: Low-price tokens showing $0

**Problem**: Price formatting uses `maximumFractionDigits: 2` everywhere, so tokens like SHIB ($0.00005) display as `$0.00`.

**Fix**: Create a smart price formatter function in `src/lib/format.ts` that auto-adjusts decimal places based on price magnitude:
- Price >= $1: 2 decimals (`$0.95`)  
- Price >= $0.01: 4 decimals (`$0.0523`)
- Price >= $0.0001: 6 decimals (`$0.000052`)
- Price < $0.0001: 8 decimals (`$0.00000523`)

**Files to modify**:
- `src/lib/format.ts` -- add `formatPrice(price: number)` function
- `src/pages/Markets.tsx` -- replace `maximumFractionDigits: 2` with `formatPrice()`
- `src/pages/Analysis.tsx` -- same fix for asset price display
- `src/pages/Dashboard.tsx` -- same fix (already partially handles this with `a.price < 1 ? a.price.toFixed(4)` but inconsistently)
- `src/pages/Portfolio.tsx` -- same fix
- `src/pages/Alerts.tsx` -- same fix

### Issue 2: Credit system not deducting properly

**Problem**: The `checkAndDeductCredits()` in `src/lib/credits.ts` is standalone and doesn't sync back to the `useCredits` hook's React state. After deduction, the navbar balance stays stale until page refresh. Also, the `useCredits` hook's `deductCredits` (which does update React state) is NOT used by `useAnalysis.ts` or `useCryptoAI.ts` -- they use the standalone function instead.

**Root cause**: Two parallel credit deduction systems exist -- `useCredits.deductCredits()` (React-aware) and `checkAndDeductCredits()` (not React-aware). The AI hooks use the standalone one, so:
1. The navbar credit count never updates after AI usage
2. The hooks can't check the latest balance from React state

**Fix**: 
- Remove `checkAndDeductCredits` from `src/lib/credits.ts` -- consolidate to one system
- Create a credit context/event system so AI hooks can deduct and the header updates:
  - Add a global event emitter or use a simple `window.dispatchEvent` pattern: after `checkAndDeductCredits` succeeds, fire a custom event; `useCredits` listens and refetches
  - Alternatively, keep `checkAndDeductCredits` but have it dispatch a `credits-updated` custom event; `useCredits` listens for it and calls `fetchBalance()`
- Update `src/hooks/useCryptoAI.ts` and `src/hooks/useAnalysis.ts` to dispatch the event after deduction
- Update `src/hooks/useCredits.ts` to listen for `credits-updated` events

**Files to modify**:
- `src/lib/credits.ts` -- add custom event dispatch after successful deduction
- `src/hooks/useCredits.ts` -- add event listener for `credits-updated` to auto-refresh balance
- No changes needed to `useAnalysis.ts` or `useCryptoAI.ts` since the event will auto-propagate

### Issue 3: Performance chart starts from zero

**Problem**: The chart builds holdings from transactions starting at 0 units. The first data point has value = first buy amount x price, and the Y-axis auto-scales from near-zero. The chart should start from the user's entry cost basis, not from zero holdings.

**Root cause**: The chart iterates through all transactions and calculates running totals. The first transaction creates holdings from nothing (0 → some value), so the chart shows a line going up from near-zero. The user expects to see performance *relative to their entry point*.

**Fix**: Rewrite the chart data calculation:
- **Start point**: Use the portfolio position's `avg_buy_price * amount` as the cost basis entry point (this is the user's entry value)
- **End point**: Use `current_price * amount` as current value
- **Intermediate points**: Use transactions within the time range, but offset so the first point = cost basis value, not zero
- Use `portfolio` positions directly instead of rebuilding from transaction history -- the positions already have `avg_buy_price` and `amount`
- For the chart line: create data points as [entry_date → cost_basis_value] ... [now → current_value]
- The Y-axis domain should be `[min(costBasis, currentValue) * 0.95, max(costBasis, currentValue) * 1.05]` -- never starting from 0

**Files to modify**:
- `src/components/portfolio/PerformanceChart.tsx` -- rewrite `chartData` calculation to use portfolio positions as baseline, not rebuild from zero

### Summary of Files
| File | Change |
|---|---|
| `src/lib/format.ts` | Add `formatPrice()` smart formatter |
| `src/pages/Markets.tsx` | Use `formatPrice()` |
| `src/pages/Analysis.tsx` | Use `formatPrice()` |
| `src/pages/Dashboard.tsx` | Use `formatPrice()` |
| `src/pages/Portfolio.tsx` | Use `formatPrice()` |
| `src/pages/Alerts.tsx` | Use `formatPrice()` |
| `src/lib/credits.ts` | Dispatch `credits-updated` event after deduction |
| `src/hooks/useCredits.ts` | Listen for `credits-updated` event to auto-refresh |
| `src/components/portfolio/PerformanceChart.tsx` | Rewrite chart to start from cost basis, not zero |

