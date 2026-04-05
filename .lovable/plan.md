

## Plan: Coming Soon for Options/Futures + Fix Portfolio Chart

### Changes

#### 1. Markets Page -- Options tab as "Coming Soon" (`src/pages/Markets.tsx`)
- Replace the Options `TabsContent` body (asset selector + OptionChain) with a centered "Coming Soon" card showing a lock/clock icon, title, and description
- Remove the `OptionChain` import and `optionAssetId` state since they're no longer needed

#### 2. Strategy Page -- Options & Futures tabs as "Coming Soon" (`src/pages/StrategyBuilder.tsx`)
- Replace both the Options and Futures `TabsContent` bodies with the same "Coming Soon" card
- Remove imports for `DerivativesStrategyForm` and `DerivativesResultCard`, and related state (`derivativesAssetSymbol`, `derivativesMode`)

#### 3. Fix Portfolio Performance Chart (`src/components/portfolio/PerformanceChart.tsx`)
The current chart has issues:
- The Tooltip `formatter` returns JSX inside an array which Recharts doesn't render properly
- Running value calculation for transactions is flawed (buys double-count against cost basis)
- Chart can show misleading data when there are no transactions in the time range

**Fixes**:
- Replace the custom JSX tooltip formatter with a proper Recharts `<Tooltip content={...} />` custom component that renders correctly
- Fix the running value logic: start from cost basis, for each transaction adjust by the actual cash flow (buys add invested capital, sells realize P&L at market price at that time)
- Add more intermediate interpolation points between transactions so the chart line isn't just straight segments between sparse points
- Handle edge case where `costBasis` is 0 to avoid division-by-zero in P&L percentage

### Files
| File | Action |
|---|---|
| `src/pages/Markets.tsx` | Replace Options tab content with Coming Soon card |
| `src/pages/StrategyBuilder.tsx` | Replace Options & Futures tab content with Coming Soon cards |
| `src/components/portfolio/PerformanceChart.tsx` | Fix tooltip rendering, fix value calculation logic |

