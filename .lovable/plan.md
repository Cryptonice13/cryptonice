

## Three-Part Upgrade: Chat, Markets Charts, and Home Redesign

---

### 1. Make Chat Responses Concise and Rendered with Markdown

**Problem**: The chat currently (a) strips ALL markdown formatting, producing giant text walls, and (b) the AI system prompt encourages verbose multi-section reports with tables, disclaimers, and repetitive data dumps.

**Fix**:
- **Install `react-markdown`** -- render AI responses with proper markdown (bold, bullets, headers, code blocks) instead of stripping it
- **Update the AI system prompt** in `crypto-ai/index.ts` to instruct the AI to be conversational, concise, and to-the-point. No lengthy disclaimers. Use short bullet points. Answer in 3-5 sentences for simple questions, expand only when the user asks for deep analysis.
- **Remove `stripMarkdown`** from `ChatInterface.tsx` and replace with `<ReactMarkdown>` component with proper prose styling

**Files**:
| File | Change |
|------|--------|
| `package.json` | Add `react-markdown` dependency |
| `src/components/ai/ChatInterface.tsx` | Remove `stripMarkdown`, render assistant messages with `<ReactMarkdown>` and prose classes |
| `supabase/functions/crypto-ai/index.ts` | Update chat system prompt to be concise and conversational |

---

### 2. Interactive Charts on the Markets Page

**Problem**: The Markets page shows a flat table with no visual price representation. The `sparkline` data (7-day, 24 data points) is already fetched from CoinGecko but never displayed.

**Fix**:
- **Add 7-day sparkline mini-charts** to each row in the Markets table using Recharts `<AreaChart>` (tiny, inline, no axes)
- **Add a detailed price chart panel** when an asset is selected, showing the full sparkline with axes, tooltip, and current price overlay
- Both integrate into the existing desktop sidebar and mobile bottom sheet

**Files**:
| File | Change |
|------|--------|
| `src/components/ai/MiniSparkline.tsx` | Create -- tiny inline sparkline component (50x24px) |
| `src/components/ai/PriceChart.tsx` | Create -- larger interactive chart with tooltip for the selected asset |
| `src/pages/Markets.tsx` | Add sparkline column to table, add PriceChart to sidebar tabs |

---

### 3. Redesign the Home Page

**Problem**: The Home page is branded as "DeFiLend" (not matching the app's CryptoAI identity), uses static mock market data, and has an outdated layout with a lending-focused narrative that doesn't match what the app actually does (AI-powered crypto analytics, portfolio tracking, market intelligence).

**Fix**: Complete redesign with these sections:

**a. Hero Section** -- New headline: "AI-Powered Crypto Intelligence". Animated typing effect for tagline. Two CTAs: "Launch Dashboard" and "Explore Markets". Live BTC/ETH price ticker in the hero.

**b. Live Trending Ticker** -- Horizontal scrolling bar showing top 5 assets with real-time prices and 24h change from `useMarketData()`, replacing the static mock table.

**c. Feature Showcase** -- 3 cards highlighting the app's real features: AI Advisor, Smart Alerts, Portfolio Tracker. Each with an icon, description, and link to the relevant page.

**d. Market Snapshot** -- Compact grid of top 6 assets with sparklines, replacing the old lending APY table.

**e. Social Proof + CTA** -- Keep the stats section (with animated counters) and testimonials, but update styling. Simpler footer.

**f. Branding** -- Change all "DeFiLend" references to "CryptoAI" to match the rest of the app. Use Brain icon consistent with the app header.

**Files**:
| File | Change |
|------|--------|
| `src/pages/Home.tsx` | Full redesign with live data, new sections, CryptoAI branding |

---

### Technical Summary

| File | Action |
|------|--------|
| `src/components/ai/ChatInterface.tsx` | Replace stripMarkdown with react-markdown rendering |
| `supabase/functions/crypto-ai/index.ts` | Update chat system prompt for concise responses |
| `src/components/ai/MiniSparkline.tsx` | Create -- inline 7d sparkline for table rows |
| `src/components/ai/PriceChart.tsx` | Create -- interactive price chart for selected asset |
| `src/pages/Markets.tsx` | Add sparkline column + price chart panel |
| `src/pages/Home.tsx` | Full redesign with CryptoAI branding + live data |

**Dependencies**: Add `react-markdown` (for chat markdown rendering). Recharts is already installed for charts.

