

## Dashboard Page Redesign

The current Dashboard is essentially a bare chat interface with a sidebar. It lacks any dashboard-like feel — no market context, no portfolio summary, no visual richness. The redesign transforms it into a proper command center while keeping the AI chat as the primary interaction.

---

### Layout Structure

```text
┌─────────────────────────────────────────────────┐
│  AppHeader (fixed)                              │
├──────────┬──────────────────────────────────────┤
│ Chat     │  Welcome Banner (gradient bg, name)  │
│ Sidebar  ├──────────────────────────────────────┤
│          │  Market Ticker Strip (live prices)    │
│ - New    ├──────────┬───────────────────────────┤
│   Chat   │  Quick   │  Portfolio Summary Card   │
│ - History│  Stats   │  (total value, 24h change)│
│          │  (3 mini │                           │
│          │  cards)  │                           │
│          ├──────────┴───────────────────────────┤
│          │  AI Chat Interface (main area)       │
│          │  - Suggested prompts redesigned      │
│          │  - Streaming responses               │
│          │                                      │
│          ├──────────────────────────────────────┤
│          │  Input bar                           │
└──────────┴──────────────────────────────────────┘
```

On mobile: sidebar hidden (sheet drawer), content stacks vertically.

### Changes

**`src/pages/Dashboard.tsx` — Full Rewrite**

- **Welcome Banner**: Gradient background strip with user name, time-based greeting ("Good morning"), and a subtle animated glow. Compact — 1 line on mobile.
- **Live Market Ticker**: Horizontal scrolling strip showing top 5 assets with price + 24h change (uses `useMarketData`). Replaces the disconnected QuickActions.
- **Quick Stats Row**: 3 compact glass cards above the chat:
  - Portfolio Value (from `usePortfolioDb`)
  - Market Trend (BTC 24h change as sentiment indicator)
  - Active Alerts count (or "Set up alerts" CTA)
- **Chat Interface**: Remains the main area but with better framing — no redundant header (remove the "CryptoAI Advisor / Live" badge since the welcome banner already establishes context)
- **QuickActions**: Redesigned as contextual chips inside the chat empty state rather than a separate bar above everything

**`src/components/ai/ChatInterface.tsx` — Minor Updates**

- Accept an optional `hideHeader` prop to avoid the duplicate "CryptoAI Advisor" header when the Dashboard already shows the welcome banner
- Move suggested questions into a more visually appealing grid with icons

**`src/components/dashboard/QuickActions.tsx` — Refactor**

- Convert from a horizontal scrolling card bar to inline contextual alert chips that appear in the welcome banner area (small badges like "ZEC down 6% — Analyze")
- Cleaner, less intrusive design

### Files

| File | Action |
|------|--------|
| `src/pages/Dashboard.tsx` | Full rewrite with new layout sections |
| `src/components/ai/ChatInterface.tsx` | Add `hideHeader` prop |
| `src/components/dashboard/QuickActions.tsx` | Redesign as compact alert chips |

No new dependencies. Uses existing `useMarketData`, `usePortfolioDb`, `framer-motion`.

