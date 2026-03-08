

## Plan: Split Market Sentiment into 3-Tab Section (Sentiment / Technical / Fundamental)

### Overview
Replace the current standalone `FearGreedGauge` card with a new 3-section component: **Market Sentiment**, **Technical Analysis**, and **Fundamental Analysis**. On desktop, these render as a tabbed card. On mobile, they render as horizontally scrollable tab pills.

### Changes

#### 1. New Component: `src/components/ai/MarketInsightsPanel.tsx`
A wrapper component with 3 tabs:

**Tab 1 - Market Sentiment** (existing FearGreedGauge content, unchanged):
- SVG gauge, 7-day trend bars, stats grid, AI analysis text
- Keeps the live pulse dot

**Tab 2 - Technical Analysis**:
- Asset selector dropdown (from `assets` array passed as prop)
- "Run Analysis" button that calls `useAnalysis().runAnalysis('technical_analysis', ...)`
- Once data loads, show a compact overview:
  - RSI gauge (value + signal badge)
  - MACD status (bullish/bearish badge)
  - Trend direction + strength
  - Verdict card (BUY/SELL/HOLD with confidence %)
- "View Full Analysis →" button navigating to `/analysis/:assetId`

**Tab 3 - Fundamental Analysis**:
- Same asset selector (shared state with Technical tab)
- "Run Analysis" button calling `runAnalysis('fundamental_analysis', ...)`
- Compact overview once loaded:
  - Overall score (0-100) with colored ring
  - Market position rank
  - Outlook badge (Bullish/Bearish/Neutral)
  - Top 2 risks as mini badges
- "View Full Analysis →" button

**Mobile layout**: `TabsList` uses `overflow-x-auto` with `flex-nowrap` for horizontal scrolling. Tabs are pill-style.

#### 2. Update `src/pages/Markets.tsx`
- Remove `<FearGreedGauge />` standalone usage (line 132)
- Import and render `<MarketInsightsPanel assets={assets} />` in its place
- Pass `assets` array so the component can render the asset selector

#### 3. Files
- **Create**: `src/components/ai/MarketInsightsPanel.tsx`
- **Modify**: `src/pages/Markets.tsx` (swap FearGreedGauge for MarketInsightsPanel)

### UI Layout
```text
Desktop:
+---------------------------------------------------+
| [🔴 Sentiment] [📊 Technical] [📈 Fundamental]    |
+---------------------------------------------------+
| (tab content - gauge / analysis overview)          |
+---------------------------------------------------+

Mobile:
+---------------------------------------------------+
| ← [Sentiment] [Technical] [Fundamental] →  (scroll)|
+---------------------------------------------------+
| (tab content)                                      |
+---------------------------------------------------+
```

### Technical Details
- Reuse `useAnalysis` hook for running analyses
- Asset selector: `Select` component from radix, populated with `assets` prop
- Selected asset state is local to the panel, shared between Technical and Fundamental tabs
- The FearGreedGauge component remains unchanged -- just embedded inside Tab 1 content
- Navigation uses `useNavigate` to go to `/analysis/:assetId`

