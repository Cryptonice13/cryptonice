

## Fix Portfolio Analysis: JSON Parsing + UI Redesign

### Problem
The AI returns JSON wrapped in markdown code blocks (` ```json {...} ``` `), but the parser does a raw `JSON.parse()` which fails. The fallback dumps the entire raw string into the `diversification` field — that's why you see the raw JSON block. Additionally, the card is squeezed into a narrow sidebar column with poor visual hierarchy.

### Changes

**1. Fix JSON parsing in `src/hooks/useCryptoAI.ts`** (usePortfolioAnalysis)
- Strip markdown code fences before parsing: extract content between ` ```json ` and ` ``` ` if present
- This ensures the structured fields (healthScore, suggestions, concerns, etc.) are properly populated instead of falling back to dumping raw text

**2. Redesign `src/components/ai/PortfolioAnalysisCard.tsx`**
- Make the card full-width instead of sidebar-only — redesign to work as a prominent section
- Health score ring: larger, with label text beneath showing risk level
- Diversification: show as a colored badge (Very Low/Low/Medium/High) not a text block
- Suggestions: numbered cards with gradient left-border accents
- Concerns: warning cards with amber left-border accents
- Summary: blockquote-style with a subtle background
- Add collapsible sections so the card isn't overwhelming when all data is present
- Animate sections in with staggered framer-motion

**3. Update layout in `src/pages/Portfolio.tsx`**
- Move the AI Analysis card from the narrow right sidebar to a full-width section below the holdings list
- Remove the 3-column grid constraint that was squeezing the analysis card

### Files

| File | Action |
|------|--------|
| `src/hooks/useCryptoAI.ts` | Fix JSON extraction (strip markdown fences) |
| `src/components/ai/PortfolioAnalysisCard.tsx` | Full UI redesign with proper structured layout |
| `src/pages/Portfolio.tsx` | Move analysis card to full-width section |

