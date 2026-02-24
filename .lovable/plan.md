

## Problem

Currently, all data-saving features (portfolio positions, watchlist, alerts, transactions) require a **wallet address** to function. Users who are logged in with their email but haven't connected a crypto wallet cannot use any of these features -- they see "Connect Wallet" blockers. Since wallet connection often fails on mobile (no MetaMask installed), this locks out many users.

## Solution

Make the hooks and UI work with the **authenticated user's email/user_id** as the primary identifier, with wallet address as an optional secondary identifier. Users logged in via email can fully use portfolio tracking, watchlist, and alerts without ever connecting a wallet.

## Database Changes (Migration Required)

The `wallet_address` column is currently `NOT NULL` on all 4 tables. We need to make it nullable so email-only users can save data using just their `user_id`.

```text
Tables to alter:
- user_portfolio:         ALTER COLUMN wallet_address DROP NOT NULL
- user_watchlist:          ALTER COLUMN wallet_address DROP NOT NULL
- portfolio_transactions:  ALTER COLUMN wallet_address DROP NOT NULL
- alert_history:           ALTER COLUMN wallet_address DROP NOT NULL
```

Also update the unique constraint on `user_portfolio` and `user_watchlist` to support user_id-based lookups.

## Hook Changes

### `usePortfolioDb.ts`
- Change signature from `usePortfolioDb(walletAddress)` to `usePortfolioDb(walletAddress, userId)`
- Use `userId` from `useAuth()` as the primary query filter; fall back to `walletAddress` if available
- All Supabase queries: filter by `user_id` when available, else by `wallet_address`
- All inserts: include both `user_id` and `wallet_address` (wallet can be null)

### `useWatchlistDb.ts`
- Same pattern: accept both `walletAddress` and `userId`
- Query/insert using whichever identifier is available, preferring `user_id`

## Page Changes

### `Portfolio.tsx`
- Import `useAuth` and pass `user?.id` to `usePortfolioDb(address, user?.id)`
- Remove the wallet-connection gate -- show portfolio features to all logged-in users
- Keep the "Wallet Holdings" section visible only when wallet is connected (since it reads on-chain data)

### `Alerts.tsx`
- Import `useAuth` and pass `user?.id` to `useWatchlistDb(address, user?.id)`
- Remove the "Connect Wallet" blocker card -- show watchlist/alerts to all logged-in users

### `Markets.tsx`
- Import `useAuth` and pass `user?.id` to `useWatchlistDb(address, user?.id)`

## Technical Details

### Query Logic in Hooks

```text
Identifier resolution (used in all queries):
  1. If userId exists   --> filter by user_id = userId
  2. Else if walletAddress exists --> filter by wallet_address = walletAddress
  3. Else --> return empty, disable mutations

Insert logic:
  - Always set user_id if available
  - Always set wallet_address if available
  - At least one must be present
```

### RLS Policy Updates

The existing RLS policies already handle both cases with the expression:
```
(auth.uid() = user_id) OR (user_id IS NULL AND wallet_address IS NOT NULL)
```
This will continue to work. Logged-in users match on `auth.uid() = user_id`.

### Files Modified

| File | Change |
|------|--------|
| Migration SQL | Make `wallet_address` nullable on 4 tables |
| `src/hooks/usePortfolioDb.ts` | Accept `userId`, query by user_id or wallet_address |
| `src/hooks/useWatchlistDb.ts` | Accept `userId`, query by user_id or wallet_address |
| `src/pages/Portfolio.tsx` | Use `useAuth`, pass userId, remove wallet gate for portfolio tracking |
| `src/pages/Alerts.tsx` | Use `useAuth`, pass userId, remove wallet gate for watchlist/alerts |
| `src/pages/Markets.tsx` | Use `useAuth`, pass userId to watchlist hook |

