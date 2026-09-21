# Community Prediction Markets

## Goal
Turn Community into a Kalshi-inspired crypto prediction market while keeping the existing Feed, Friends, and Messages features available.

The first release will support:
- Virtual-credit trading only, using the existing credit balance.
- Binary crypto price markets such as “Will BTC be above $100,000 at 12:00 UTC?”
- User-created markets with clear deadlines and validation.
- Automated settlement for verifiable crypto prices, with a platform-review fallback when the price source is unavailable.

## User experience

```text
Community
├── Markets       default tab
│   ├── Open markets: search, asset filter, closing-soon sort
│   ├── Market card: question, YES/NO prices, volume, close time
│   ├── Market detail: price history, rules, activity, buy YES / buy NO
│   ├── My positions: open, settled, potential payout, realized result
│   └── Create market
├── Feed
├── Friends
└── Messages
```

### Market discovery
- Make Markets the first Community tab and keep the social tabs intact.
- Show market status, creator name, asset, target price, close time, resolution time, current YES/NO prices, traded volume, and participant count.
- Include empty, loading, closed, resolved, cancelled, and review-needed states.
- Add a compact “My positions” view without creating a separate top-level page.

### Market creation
- Add a guided dialog for authenticated users with:
  - A plain-language binary question.
  - Asset symbol selected from supported crypto assets.
  - Above/below target price.
  - Trading close time and resolution time.
  - Resolution rules and the trusted price source.
- Validate that the question is unambiguous, the close time is in the future, resolution follows close, and the target is positive.
- Show a preview before publishing. A creator cannot directly resolve their own market.

### Trading
- Use YES and NO contracts priced from 1–99 virtual credits per share, with a binary payout of 100 credits at settlement.
- Support a simple limit-order experience: users choose a side, price, and number of shares; show total cost, maximum payout, and maximum loss before confirmation.
- Show the market activity/order history and the user’s filled orders and open orders.
- Prevent overspending, negative balances, duplicate fills, self-trading, and trading after close through server-side atomic checks.

### Settlement
- At or after the resolution time, a server-side resolver checks the configured crypto price source and settles the binary outcome automatically.
- If the source is unavailable or inconsistent, mark the market as “Needs review” rather than guessing. The platform review path can resolve or cancel it; creators cannot self-settle.
- Pay winning positions and release/cancel eligible funds atomically. Make settlement idempotent so it cannot pay twice.
- Display the exact resolution source, observed price, timestamp, outcome, and settlement explanation on every resolved market.

## Data and security design

Add dedicated public-schema tables with explicit grants before RLS, following the project’s Supabase rules:

- `prediction_markets`: market question, crypto asset, target, direction, close/resolution times, status, creator, source rules, outcome, observed price, and settlement metadata.
- `prediction_orders`: authenticated user limit orders, side, price, quantity, remaining quantity, status, and timestamps.
- `prediction_trades`: matched fills linking maker/taker orders, side, price, quantity, and execution time.
- `prediction_positions`: per-user market/side share balances, average cost, realized payout, and settlement status.
- `prediction_market_events`: auditable creation, order, fill, close, resolution, cancellation, and review events.

Use owner/participant-scoped RLS:
- Public authenticated users can read published markets, public market activity, and public aggregate statistics.
- Users can read and manage only their own orders and positions.
- Market creators can edit only an unpublished market before trading starts.
- No client policy may directly update balances, positions, trades, outcomes, or settlement fields.

Add security-definer, parameterized database functions for the money-moving paths:
- Create and publish a market.
- Place and cancel an order.
- Match compatible orders and record fills.
- Close a market.
- Resolve or cancel a market.
- Settle positions and apply credit transactions atomically.

All functions will validate `auth.uid()`, lock the affected rows, enforce market status/deadlines, and use the existing credit system rather than client-side balance writes. No roles will be stored on profiles or users.

Add a server-side resolver edge function that validates authenticated requests, fetches the configured public crypto price source, and calls the settlement function. It will include CORS headers on every response and return safe, user-facing errors.

## Frontend changes

- Add typed prediction-market hooks for market discovery, market details, creation, orders, positions, and settlement status.
- Add focused market UI components under `src/components/community/` rather than expanding the existing social feed logic.
- Update `Community.tsx` to compose the Markets tab with Feed, Friends, and Messages.
- Reuse existing Button, Dialog, Tabs, Badge, Card, Input, and toast components.
- Keep the current mobile bottom navigation and make the Markets tab usable on small screens with stacked trade controls and horizontal activity tables.
- Add market-specific loading and error handling without changing the existing community messaging behavior.

## Validation

- Verify authenticated users can create a valid market and cannot create ambiguous or expired markets.
- Verify two users can place compatible orders, balances and positions update atomically, and cancelled orders release funds once.
- Verify users cannot read or mutate another user’s orders or positions.
- Verify a market closes at its deadline, resolves from the trusted crypto price, and pays winners exactly once.
- Verify unavailable price data produces a review-needed state rather than a guessed outcome.
- Verify Community Feed, Friends, Messages, profile names, and direct messages continue working.
- Test desktop and mobile Community layouts and capture runtime/network errors before completion.
