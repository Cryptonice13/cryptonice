

## Plan: Technical & Fundamental Analysis Feature

### Overview
Add a new AI-powered Technical & Fundamental Analysis feature. Users select an asset on the Markets page, click "Full Analysis," and navigate to a dedicated analysis page with detailed results.

### Components

#### 1. New Supabase Table: `ai_analysis`
Stores persisted analysis results per asset per user.

| Column | Type | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| user_id | uuid | nullable |
| wallet_address | text | nullable |
| asset_id | text | not null |
| asset_symbol | text | not null |
| asset_name | text | not null |
| current_price | numeric | 0 |
| analysis_type | text | not null (technical/fundamental/both) |
| analysis_data | jsonb | '{}' |
| created_at | timestamptz | now() |

RLS: standard user_id / wallet_address permissive policies for SELECT, INSERT, DELETE.

#### 2. Edge Function Update: `crypto-ai`
Add two new `type` branches in `buildSystemPrompt`:

- **`technical_analysis`**: Prompt requesting RSI, MACD, Bollinger Bands, moving averages, support/resistance, volume analysis, trend analysis, chart patterns. Response as structured JSON with sections for each indicator, overall verdict, and key levels.

- **`fundamental_analysis`**: Prompt requesting tokenomics, use case evaluation, team/ecosystem, market position, on-chain metrics, competitive analysis, growth catalysts, risks. Response as structured JSON.

Both will use `fetchMarketData` + `fetchCoinDetails` for context. Non-streaming response (JSON).

#### 3. Markets Page Update (`src/pages/Markets.tsx`)
Add a compact "Analysis" section in the desktop AI panel (new tab "Analysis" alongside Prediction/Signal):
- Shows a mini card with asset name, two buttons: "Technical" and "Fundamental"
- A "Full Analysis →" link/button that navigates to `/analysis/:assetId`
- On mobile sheet, add as a 4th tab

#### 4. New Page: `src/pages/Analysis.tsx` (route: `/analysis/:assetId`)
Full-page analysis results with modern UI:

**Layout:**
- Header with asset info (logo, name, price, 24h change)
- Two main tabs: Technical Analysis / Fundamental Analysis
- "Run Analysis" button per tab that calls the edge function

**Technical Analysis Tab:**
- **Indicator Cards Grid**: RSI gauge, MACD status, Bollinger Band position, Moving Averages (50/200 SMA)
- **Support & Resistance Chart**: Visual horizontal levels on a price chart using Recharts
- **Volume Analysis**: Bar chart showing volume trend
- **Trend Summary Card**: Overall trend direction with confidence score
- **Verdict Card**: BUY/SELL/HOLD with reasoning

**Fundamental Analysis Tab:**
- **Score Card**: Overall fundamental score (0-100) with radial gauge
- **Tokenomics Section**: Supply metrics, inflation rate, distribution
- **Market Position Card**: Market cap rank, dominance, competitive comparison
- **Growth Catalysts**: List of upcoming catalysts with impact ratings
- **Risk Factors**: Color-coded risk items
- **Overall Assessment Card**: Summary paragraph with investment thesis

**History**: Below tabs, show past analyses from `ai_analysis` table for this asset.

#### 5. Route Registration (`src/App.tsx`)
Add `/analysis/:assetId` route pointing to the new Analysis page.

### Files to Create/Modify
- **Create**: `supabase/migrations/..._create_ai_analysis.sql` (table + RLS)
- **Modify**: `supabase/functions/crypto-ai/index.ts` (add technical_analysis + fundamental_analysis types)
- **Modify**: `supabase/config.toml` (no change needed, function already exists)
- **Create**: `src/pages/Analysis.tsx` (full analysis page)
- **Modify**: `src/pages/Markets.tsx` (add Analysis tab + navigation button)
- **Modify**: `src/App.tsx` (add route)

### Technical Details

**Edge function prompt structure for technical_analysis:**
```
Respond in JSON: {
  indicators: { rsi: {value, signal, description}, macd: {value, signal, histogram, description}, bollingerBands: {upper, middle, lower, position}, movingAverages: {sma50, sma200, ema20, crossover} },
  supportResistance: { supports: [{price, strength}], resistances: [{price, strength}] },
  volumeAnalysis: { trend, averageVolume, currentVolume, description },
  trendAnalysis: { direction, strength, timeframe, description },
  chartPatterns: [{ pattern, type, significance }],
  verdict: { signal, confidence, reasoning }
}
```

**Edge function prompt structure for fundamental_analysis:**
```
Respond in JSON: {
  overallScore: number,
  tokenomics: { circulatingSupply, maxSupply, inflationRate, distribution, score },
  marketPosition: { rank, dominance, competitors, moat, score },
  ecosystem: { partnerships, dapps, developers, activity, score },
  catalysts: [{ event, impact, timeframe }],
  risks: [{ factor, severity, likelihood }],
  assessment: { thesis, outlook, summary }
}
```

**Navigation flow:**
Markets page → select asset → see mini analysis overview in sidebar → click "Full Analysis" → `/analysis/bitcoin` (uses asset ID from URL param)

