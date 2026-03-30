

## Plan: Add Spot & Options Tabs to Markets Page

### Overview
Add a top-level Tabs component on the `/markets` page with two sections: **Spot** (existing market list) and **Options** (simulated option chain display based on selected asset).

### Changes

#### 1. Modify `src/pages/Markets.tsx`
- Wrap the existing market content below the header in a `Tabs` component with two tabs: **Spot** and **Options**
- **Spot tab**: contains the existing asset table, AI analysis panel, and all current functionality (no changes)
- **Options tab**: shows an asset selector dropdown at the top (populated from the same `useMarketData` assets), and below it renders an `OptionChain` component when an asset is selected

#### 2. Create `src/components/markets/OptionChain.tsx`
- Accepts `asset: CryptoAsset` prop
- Generates a simulated option chain table with:
  - **Header row**: Strike Price | Calls (Bid/Ask/IV/Delta) | Puts (Bid/Ask/IV/Delta)
  - **Expiry selector**: tabs or dropdown for 1W, 2W, 1M, 3M expiry dates
  - **Strike prices**: auto-generated around the current asset price (e.g., -20% to +20% in increments based on price magnitude)
  - **Simulated data**: bid/ask prices, implied volatility, delta values generated algorithmically from the asset's current price and volatility (derived from 7d price change)
- Color coding: ITM strikes highlighted with subtle background, ATM strike highlighted prominently
- Responsive: horizontal scroll on mobile for the wide table

### Technical Details
- Strike price generation: for an asset at $100, generate strikes at $80, $85, $90, $95, $100, $105, $110, $115, $120 (5% increments, adjusted for price magnitude)
- Simulated IV: base IV derived from `abs(priceChange7d) * 5` with random variation per strike
- Simulated Greeks: Delta calculated from strike distance to current price using simplified Black-Scholes approximation
- Bid/Ask spread: 1-3% of premium, with premium calculated from intrinsic + time value estimates
- Data is illustrative/educational -- clearly labeled as "Simulated Option Chain" with a disclaimer badge

### Files
| File | Action |
|---|---|
| `src/pages/Markets.tsx` | Modify -- add Spot/Options tabs wrapping content |
| `src/components/markets/OptionChain.tsx` | Create -- option chain display component |

