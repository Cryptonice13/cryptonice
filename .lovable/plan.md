

## Plan: Fix Performance Chart Logic and Add Asset Filter

### Problem
The PerformanceChart calculates from 0 because it rebuilds holdings from transaction history starting at zero. The first data point is the value after the first transaction, making the chart misleading -- it always shows growth from nothing.

### Fix
Rewrite the chart to show **price performance relative to cost basis** rather than absolute portfolio value built from zero. Add an asset selector to filter by individual asset.

### Changes

#### 1. `src/components/portfolio/PerformanceChart.tsx` -- Full Rewrite
- **Add asset selector**: "All Assets" + each portfolio position as options (pill buttons or small select)
- **Fix calculation logic**:
  - When "All Assets" selected: show total portfolio value over time using transaction prices as data points, but start the chart from the **first transaction's value** (not zero)
  - When a specific asset selected: show that asset's price performance since the user's first buy date
  - Use `portfolio` positions (with `created_at`, `avg_buy_price`) as the baseline, not rebuilding from zero
  - The chart baseline = cost basis at first transaction, so percentage change is meaningful
- **Add props**: Accept `portfolio` (positions array) in addition to `transactions` and `currentPrices`
- **UI improvements**:
  - Asset filter pills at the top (horizontally scrollable on mobile)
  - Show cost basis line as a dashed reference
  - Display P&L value and percentage in the header
  - Improved tooltip showing value, cost basis, and P&L

#### 2. `src/pages/Portfolio.tsx`
- Pass `portfolio` prop to `PerformanceChart`

### Key Logic Change
```text
OLD: Start from 0, add each buy tx amount, chart goes 0 → current value
NEW: Start from first transaction's portfolio value, track changes from there
     When filtering by asset: show price × amount over time from first buy
```

### Files
- **Modify**: `src/components/portfolio/PerformanceChart.tsx`
- **Modify**: `src/pages/Portfolio.tsx` (pass portfolio prop)

