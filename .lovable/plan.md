

## Plan: Redesign Add New Position System

### Problem
The current Add Position dialog doesn't auto-populate the buy price from market data, has no input validation feedback, and doesn't show a total value preview. This leads to bad data flowing into the portfolio analysis.

### Changes

#### 1. `src/pages/Portfolio.tsx` -- Redesign Add Position Dialog
- **Auto-fill buy price**: When user selects an asset, auto-populate the buy price field with the current market price (user can override)
- **Live total value preview**: Show `Amount × Buy Price = Total Value` in real-time as user types
- **Asset search**: Add search/filter within the asset selector so users can type to find assets
- **Input validation**: Ensure amount > 0 and buy price > 0 with visual feedback
- **Transaction date**: Add optional date picker for when the buy actually happened
- **Quick amount buttons**: Add preset buttons like "0.1", "0.5", "1", "10" for common amounts
- **Redesign layout**: Use a full card section instead of a small dialog -- cleaner inline form on desktop, sheet on mobile

#### 2. `src/hooks/usePortfolioDb.ts` -- Add `purchase_date` support
- Pass `purchase_date` to the `addPosition` function
- Store it in the `portfolio_transactions` table (already has `created_at`, but we'll use an explicit `purchase_date` column)

#### 3. Database Migration -- Add `purchase_date` column
- Add `purchase_date` timestamptz column to `portfolio_transactions` table (nullable, defaults to `now()`)
- This lets users backdate transactions for accurate chart data

### Key Improvements
```text
OLD: Select asset → manually type price → no feedback → submit
NEW: Select asset → price auto-fills from market → live total shown → validated → submit with optional date
```

### Files
- **Modify**: `src/pages/Portfolio.tsx` (redesign dialog with auto-fill, validation, preview)
- **Modify**: `src/hooks/usePortfolioDb.ts` (accept purchase_date param)
- **Migration**: Add `purchase_date` to `portfolio_transactions`

