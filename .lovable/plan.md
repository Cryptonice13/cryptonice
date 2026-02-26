

## Advanced Feature Upgrade Plan

After analyzing every page, hook, component, and edge function in the app, here are 5 high-impact features that will make this platform significantly more powerful and futuristic -- placed exactly where they belong.

---

### 1. Fear & Greed Index + Market Sentiment Dashboard (Markets Page)

**Where**: Top of the Markets page, above the asset table

**What**: A live crypto Fear & Greed Index gauge with real-time market sentiment analysis. Shows the overall market mood (Extreme Fear to Extreme Greed) using data from the Alternative.me API, combined with AI-generated market commentary.

**Details**:
- Circular gauge component showing the index value (0-100) with color gradient
- AI-generated one-line market commentary based on current sentiment
- Mini sparkline showing sentiment trend over 7 days
- Updates automatically with market data refresh

**Files**:
- Create `src/components/ai/FearGreedGauge.tsx` -- the visual gauge component
- Update `src/pages/Markets.tsx` -- add the gauge above the asset table
- Update `supabase/functions/crypto-ai/index.ts` -- add Fear & Greed API fetch

---

### 2. AI "Smart Alerts" -- Automatic Alert Suggestions (Alerts Page)

**Where**: Alerts page, new "AI Suggestions" tab alongside Watchlist and Add Assets

**What**: AI analyzes your watchlist and portfolio to automatically suggest price alerts based on support/resistance levels and market conditions. Instead of manually guessing alert prices, the AI recommends optimal levels.

**Details**:
- New tab in the Alerts page: "AI Suggestions"
- For each watchlisted asset, AI suggests 1-2 alert levels with reasoning
- One-click to apply a suggested alert
- Uses the existing crypto-ai edge function with a new `alert_suggestions` type

**Files**:
- Create `src/components/ai/SmartAlertSuggestions.tsx` -- suggestion cards
- Update `src/pages/Alerts.tsx` -- add the third tab
- Update `supabase/functions/crypto-ai/index.ts` -- add `alert_suggestions` type with prompt

---

### 3. Portfolio Performance Chart with Timeline (Portfolio Page)

**Where**: Portfolio page, between the stats cards and the holdings list

**What**: An interactive line chart showing portfolio value over time, built from transaction history data. Lets users visualize how their portfolio has grown.

**Details**:
- Line chart using Recharts (already installed) showing portfolio value over time
- Toggle between 7D / 30D / All time views
- Chart data computed from `portfolio_transactions` table
- Shows total value at each point based on buy/sell history and current prices
- Gradient fill under the line matching the app's primary color scheme

**Files**:
- Create `src/components/portfolio/PerformanceChart.tsx` -- the Recharts component
- Update `src/pages/Portfolio.tsx` -- insert chart between stats and holdings

---

### 4. Whale Activity Tracker (Markets Page Side Panel)

**Where**: Markets page right sidebar, below the AI Analysis panel (desktop) and as a new tab in the mobile bottom sheet

**What**: Shows simulated whale movements -- large transactions for selected assets. Gives users insight into what big players are doing.

**Details**:
- Card component showing recent large transactions (whale buys/sells)
- Data generated via AI analysis of volume patterns for the selected asset
- Visual indicators: green for accumulation, red for distribution
- Uses existing crypto-ai edge function with new `whale_analysis` type

**Files**:
- Create `src/components/ai/WhaleActivityCard.tsx` -- whale tracker card
- Update `src/pages/Markets.tsx` -- add to sidebar and mobile sheet tabs
- Update `supabase/functions/crypto-ai/index.ts` -- add `whale_analysis` prompt type

---

### 5. Quick Actions Widget on Dashboard (Dashboard Page)

**Where**: Dashboard page, above the chat interface as a horizontal scrollable row

**What**: Context-aware quick action buttons that adapt based on market conditions. Shows actionable cards like "BTC down 5% -- Buy the dip?", "ETH at resistance -- Set alert?", "Portfolio is 80% BTC -- Diversify?"

**Details**:
- Horizontal scrollable row of small action cards
- Each card has an icon, short message, and action button
- Actions navigate to the relevant page or trigger AI analysis in chat
- Data driven by market conditions (from useMarketData) and portfolio state
- Refreshes with market data

**Files**:
- Create `src/components/dashboard/QuickActions.tsx` -- the scrollable widget
- Update `src/pages/Dashboard.tsx` -- add between header and chat

---

### Technical Summary

| File | Action |
|------|--------|
| `src/components/ai/FearGreedGauge.tsx` | Create -- sentiment gauge component |
| `src/components/ai/SmartAlertSuggestions.tsx` | Create -- AI alert suggestion cards |
| `src/components/ai/WhaleActivityCard.tsx` | Create -- whale activity tracker |
| `src/components/portfolio/PerformanceChart.tsx` | Create -- portfolio value chart |
| `src/components/dashboard/QuickActions.tsx` | Create -- smart quick actions |
| `src/pages/Markets.tsx` | Update -- add Fear & Greed gauge + whale tracker |
| `src/pages/Alerts.tsx` | Update -- add AI Suggestions tab |
| `src/pages/Portfolio.tsx` | Update -- add performance chart |
| `src/pages/Dashboard.tsx` | Update -- add quick actions widget |
| `supabase/functions/crypto-ai/index.ts` | Update -- add 3 new AI prompt types |

**No database changes needed** -- all features use existing tables or are computed client-side / via AI.

