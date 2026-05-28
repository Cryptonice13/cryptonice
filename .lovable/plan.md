# Make the Chat a True AI Trading Agent

Right now the chat is a single-turn responder, and analysis/predictions/signals only happen when the user clicks tabs in the Agent Workspace. The goal is to make the **chat itself the agent**: the user types something like "should I buy BTC?" or "give me a signal for SOL", and the model autonomously decides which tool to run (market lookup, prediction, signal, technical/fundamental, portfolio review, suggestion) and answers inline with rich cards.

## What the agent will be able to do

The chat agent gets a toolbox. The model picks tools based on the user's message — no tab clicks required.

| Tool | When it fires | Returns |
|---|---|---|
| `get_market_snapshot` | "How's BTC?", "price of SOL", "top movers" | Live price, 24h/7d %, vol, mcap from CoinGecko |
| `predict_price` | "where is ETH headed", "BTC prediction" | Short/medium-term direction, targets, S/R, confidence |
| `generate_trading_signal` | "give me a signal", "should I buy/sell X" | BUY/SELL/HOLD, entry, SL, TPs, R:R, strength |
| `technical_analysis` | "TA on SOL", "RSI/MACD for ETH" | RSI, MACD, BBands, MAs, S/R, verdict |
| `fundamental_analysis` | "is X a good project", "tokenomics of SUI" | Tokenomics, ecosystem, catalysts, risks, thesis |
| `analyze_portfolio` | "review my portfolio", "am I diversified" | Health score, risk, suggestions, concerns |
| `suggest_trade` | "what should I trade", "give me a pick" | Ranked picks with reasoning, entry/SL/TP |
| `get_news` | "any news on ETH" | Top headlines with brief takeaway |

All these already exist as backend logic — we are reusing the same prompts/CoinGecko fetchers, just wiring them as agent tools.

## How it works (technical)

### Edge function: `crypto-ai`
- Add a new request `type: "agent_chat"` that runs an OpenAI-compatible **function-calling loop** against Lovable AI Gateway (`google/gemini-3-flash-preview`).
- Define the tool schemas listed above. Each tool's `execute` calls the existing internal helper (the same code paths used by `market_prediction`, `trading_signal`, `technical_analysis`, etc.) and returns structured JSON.
- Loop: model returns `tool_calls` → run tools → append `tool` messages → re-invoke model → repeat up to ~6 steps → stream final assistant text as SSE (same SSE format the client already parses).
- Charge credits server-side per tool actually executed (reuse `CREDIT_COSTS`). Sum and `deduct_credits_atomic` once at the end. Return 402 if insufficient.
- Stream tool-activity events as SSE `data:` lines with `{ type: "tool", name, status, result }` interleaved with the standard `choices[0].delta.content` chunks so the UI can render tool cards as they happen.

### Client: `useCryptoAI` / `ChatInterface`
- Switch `sendMessage` to call `type: "agent_chat"` and pass the full enriched context (portfolio, watchlist, market data) already built in `Chat.tsx`.
- Extend the streaming parser in `useCryptoAI.ts` to recognize tool events and attach them to the in-flight assistant message as `toolCalls: [{ name, status, args, result }]`.
- Update the `Message` type to carry optional `toolCalls`.
- In `ChatInterface`, render each tool call as a collapsible card above/under the assistant text, reusing existing components where possible:
  - `MarketPredictionCard` for `predict_price`
  - `TradingSignalCard` for `generate_trading_signal`
  - `PortfolioAnalysisCard` for `analyze_portfolio`
  - Compact custom card for `get_market_snapshot`, `technical_analysis`, `fundamental_analysis`, `suggest_trade`, `get_news`
  - Show status: running (spinner) → done (result) → error.
- Add agent-style quick prompts: "Give me today's best trade", "Predict BTC", "Signal for SOL", "Review my portfolio", "TA on ETH".
- Keep the existing Agent Workspace tabs available for power users; the chat just becomes the primary, conversational entry point.

### Files to change
- `supabase/functions/crypto-ai/index.ts` — add `agent_chat` handler with tool loop + streaming.
- `src/hooks/useCryptoAI.ts` — change chat path to `agent_chat`, extend stream parser for tool events, add `toolCalls` to message shape.
- `src/components/ai/ChatInterface.tsx` — render tool cards inline, update quick prompts.
- `src/components/ai/AgentToolCard.tsx` (new) — generic collapsible tool-activity card.
- Reuse existing `MarketPredictionCard`, `TradingSignalCard`, `PortfolioAnalysisCard` for rich result rendering.

### Out of scope (unless you ask)
- No DB schema changes.
- No removal of the Agent Workspace tabs.
- No new auth/credit system — reuses `deduct_credits_atomic` and existing per-type costs.
