
# Super AI Agent Consolidation

Turn `/chat` into the platform's single command surface — an AI agent that acts as analyst, assistant, and market researcher — and absorb the Markets and Strategy Builder feature sets. Hide Dashboard, Portfolio and Safety pages from navigation.

## 1. New `/chat` Super Agent layout

A 3-pane workspace (collapsible on mobile):

```text
┌──────────────┬──────────────────────────┬───────────────┐
│ Conversations│   AI Agent Chat (center) │ Context Panel │
│  + sessions  │   - streamed answers     │ (right rail)  │
│              │   - tool/result cards    │  tabs:        │
│              │   - quick prompt chips   │  • Markets    │
│              │                          │  • Strategy   │
│              │                          │  • Signals    │
│              │                          │  • Realtime   │
└──────────────┴──────────────────────────┴───────────────┘
```

- **Left**: existing `ChatSidebar` (conversations, new chat) — unchanged behavior.
- **Center**: existing `ChatInterface`, upgraded to render rich "tool result" cards inside assistant messages (price chart, strategy card, signal card, prediction). Quick prompt chips: *Analyze BTC*, *Build me a strategy*, *Top signals today*, *Scan this token*, *Realtime BTC/USDT*.
- **Right rail (Context Panel)** — tabbed, drives both the chat context and the visible workspace:
  - **Markets**: searchable asset list (`useMarketData`), Market Insights panel, mini sparkline. Selecting an asset injects it as the agent's active context (chip shown above composer: "Context: BTC").
  - **Strategy**: `StrategyForm` + last result + saved strategies table. "Generate" runs the existing strategy AI; result also gets posted as an assistant message in the chat thread.
  - **Signals**: `SignalMarketplace` (publish/edit/delete/P&L flow already in place).
  - **Realtime**: `RealtimePanel` (order book, trade tape, candlestick) bound to the active asset.
  - **Safety** (kept here as a tool, not a page): token safety scan triggered by the agent or via right-rail input.

Mobile (<1024px): right rail becomes a bottom Sheet opened by an icon group in the chat header (Markets / Strategy / Signals / Realtime). Conversations Sheet stays on the left as today.

## 2. Agent behavior

The `crypto-ai` edge function already receives `context`. Extend the client to pass:
- `activeAsset` (symbol/id from right-rail selection)
- `marketSnapshot` (top 20 assets)
- `portfolio`, `watchlist`, `strategies`, `signals` (already gathered in `Chat.tsx` via `dbContext`)
- `intent` hint when the user clicks a prompt chip (e.g., `build_strategy`, `scan_token`, `realtime_view`).

System prompt update (server-side) so the agent introduces itself as a single super-agent that can:
1. Analyze any asset (TA + FA + on-chain context).
2. Build/refine trading strategies (calls strategy generator path with the same `crypto-ai` `derivatives_strategy`/spot strategy types — no new backend).
3. Research signals and explain marketplace entries.
4. Trigger token safety scan and summarize verdict.
5. Reference the user's portfolio when relevant.

No new edge function. Reuse `crypto-ai`, `token-safety-scan`, `market-data-ccxt`, `verify-signals`.

## 3. Hide Dashboard, Portfolio, Safety

- Remove from `AppHeader` desktop nav and from `MobileBottomNav`.
- Replace bottom-nav slots with: Chat (Bot), Markets→Chat (LineChart shortcut to `/chat?tab=markets`), Strategy→Chat (`/chat?tab=strategy`), Community, Profile.
- Keep the route definitions in `App.tsx` so existing deep links don't 404, but redirect `/dashboard`, `/portfolio`, `/safety` → `/chat` (with appropriate `?tab=` where useful). Page files stay on disk for now (easy to restore).
- Remove the Safety shield icon from `AppHeader`. Portfolio analysis stays accessible by asking the agent ("Analyze my portfolio").
- `/markets` and `/strategy` also redirect to `/chat` with the matching tab, since their functionality now lives inside the super agent.

## 4. Files affected

- **Edited**
  - `src/pages/Chat.tsx` — new 3-pane layout, right-rail tabs, URL `?tab=` sync.
  - `src/components/ai/ChatInterface.tsx` — context chip, prompt chips, optional tool-result rendering hook.
  - `src/components/AppHeader.tsx` — drop Dashboard/Portfolio/Safety nav + Safety icon; nav set becomes Chat / Markets / Strategy / Community.
  - `src/components/MobileBottomNav.tsx` — new icon set centered on `/chat`.
  - `src/App.tsx` — add redirects for `/dashboard`, `/portfolio`, `/safety`, `/markets`, `/strategy` → `/chat`.
- **New**
  - `src/components/agent/AgentWorkspace.tsx` — the right-rail tab container.
  - `src/components/agent/tabs/{MarketsTab,StrategyTab,SignalsTab,RealtimeTab}.tsx` — thin wrappers reusing existing components (`MarketInsightsPanel`, `MiniSparkline`, `StrategyForm`, `StrategyTable`, `StrategyDetailCard`, `SignalMarketplace`, `RealtimePanel`).
- **Untouched**: existing hooks, edge functions, DB schema, credit system.

## 5. Acceptance

- `/chat` shows conversations + chat + workspace side-by-side on desktop; mobile uses Sheets.
- Selecting an asset in the Markets tab shows a "Context" chip in the composer and is sent to the agent on the next message.
- Generating a strategy from the Strategy tab posts the result as an assistant message into the active conversation.
- `/dashboard`, `/portfolio`, `/safety`, `/markets`, `/strategy` all redirect to `/chat` (with appropriate tab where applicable); they no longer appear in any nav.
- Bottom nav and header reflect only the new surface.

## Out of scope
- Restyling Strategy/Signals internals.
- Backend changes beyond a small system-prompt update.
- Deleting the hidden pages from the codebase.
