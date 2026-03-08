

## Strict Crypto Analyst Agent on Home Page

Add a dedicated AI agent section to the Home page — a "Strict Crypto Analyst" that acts as an emotionless, capital-preservation-focused analyst. It fetches live BTC price, calculates 7-day SMA, and pulls crypto news headlines — then delivers structured verdicts (BUY/SELL/HOLD/WAIT).

---

### What Gets Built

**1. New Edge Function Type: `crypto_analyst`** (`supabase/functions/crypto-ai/index.ts`)

- New helper: `fetch7DaySMA()` — calls CoinGecko `/coins/bitcoin/market_chart?vs_currency=usd&days=7` and computes the Simple Moving Average
- New helper: `fetchCryptoNews()` — calls CryptoCompare API for top 3 headlines
- New system prompt for `crypto_analyst` type:
  - Persona: strict, emotionless financial analyst prioritizing capital preservation
  - Injected tool data: live BTC price, 7-day SMA, and 3 news headlines (all pre-fetched server-side)
  - Must structure response with: **Analysis**, **The 'Why'**, **Risk Assessment**, **Final Decision** (BUY/SELL/HOLD/WAIT)
  - If price is significantly above SMA or data is conflicting → default to WAIT
- Streaming enabled for this type

**2. Home Page Analyst Widget** (`src/components/ai/CryptoAnalystAgent.tsx`)

- Card component with the agent's identity (shield icon, "Strict Crypto Analyst" title, "Emotionless. Data-Driven. Capital First." subtitle)
- Single text input + "Run Analysis" button (not a full chat — one question, one structured response)
- Pre-filled placeholder: "Analyze the Bitcoin market today"
- 3 quick-prompt buttons: "Should I buy BTC?", "Market outlook", "Risk analysis"
- Response area renders markdown with the structured format
- Loading state with analysis spinner
- Shows live BTC price + 7-day SMA as context badges above the response

**3. Home Page Integration** (`src/pages/Home.tsx`)

- Insert the agent widget as a new section between the Feature Showcase and Market Snapshot sections
- Section header: "Ask the Analyst" with a brief description

---

### Files

| File | Action |
|------|--------|
| `supabase/functions/crypto-ai/index.ts` | Add `fetch7DaySMA`, `fetchCryptoNews`, `crypto_analyst` prompt type |
| `src/components/ai/CryptoAnalystAgent.tsx` | Create — standalone analyst agent widget |
| `src/pages/Home.tsx` | Add the analyst section between features and market snapshot |

