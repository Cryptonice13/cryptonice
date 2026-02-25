

## Comprehensive App Quality Upgrade

After a thorough analysis of the entire codebase, here are the critical issues found and the plan to fix them, organized by priority.

---

### 1. Fix Inconsistent Wallet Connect (Bug - High Priority)

**Problem**: Only `Dashboard.tsx` and `Settings.tsx` use the safe `connectAsync` + mobile deep-link pattern. The `Portfolio.tsx`, `Markets.tsx`, and `Alerts.tsx` pages still use the old `connect()` call that crashes on mobile without MetaMask.

**Fix**: Update the `handleConnect` function in Portfolio, Markets, and Alerts to use the same pattern:
- Import `handleMobileDeepLink` and `hasInjectedProvider` from `@/lib/walletConnect`
- Switch from `connect` to `connectAsync`
- Add provider detection before attempting connection

**Files**: `src/pages/Portfolio.tsx`, `src/pages/Markets.tsx`, `src/pages/Alerts.tsx`

---

### 2. Fix Chat History for Email-Only Users (Bug - High Priority)

**Problem**: `useChatHistory` only filters by `wallet_address`. Email-authenticated users without a wallet see zero chat history and can't save conversations (the RLS policy blocks inserts without a matching `user_id`).

**Fix**:
- Update `useChatHistory` to accept an optional `userId` parameter
- Query by `user_id` when available, fall back to `wallet_address`
- Insert both `user_id` and `wallet_address` when creating conversations
- Update `Dashboard.tsx` to pass `user?.id` from `useAuth`

**Files**: `src/hooks/useChatHistory.ts`, `src/pages/Dashboard.tsx`

---

### 3. Fix UserProfile Page - Use Real Data (Bug - Medium Priority)

**Problem**: `UserProfile.tsx` uses mock data with a fake `setTimeout` instead of reading from the `profiles` Supabase table. The profile name, email, and creation date are all fabricated.

**Fix**:
- Fetch real profile data from the `profiles` table using `user.id`
- Display actual email from `useAuth`
- Show real account creation date from Supabase auth
- Remove the mock delay and hardcoded values

**Files**: `src/pages/UserProfile.tsx`

---

### 4. Extract Shared Navigation Header (Code Quality - Medium Priority)

**Problem**: The header with logo, nav links, wallet connect button, and dropdown menu is duplicated across 4 pages (Dashboard, Portfolio, Markets, Alerts) with ~50 lines of identical JSX each. Any change requires updating all 4 files.

**Fix**: Create a shared `AppHeader` component:
- Accept `activePage` prop to highlight the current nav item
- Include the wallet connect/disconnect logic with mobile-safe handling
- Include the dropdown menu with Profile/Settings/Disconnect

Then update all 4 pages to use `<AppHeader activePage="dashboard" />` instead of the duplicated code.

**Files**: 
- Create `src/components/AppHeader.tsx`
- Update `src/pages/Dashboard.tsx`, `src/pages/Portfolio.tsx`, `src/pages/Markets.tsx`, `src/pages/Alerts.tsx`

---

### 5. Remove Dead Code (Code Quality - Low Priority)

**Problem**: `useMarketData.ts` still exports `useWatchlist()` and `usePortfolio()` which use localStorage. These are fully replaced by the Supabase-backed `useWatchlistDb` and `usePortfolioDb` hooks. No component imports them.

**Fix**: Remove the `useWatchlist` and `usePortfolio` functions from `src/hooks/useMarketData.ts`, along with the unused `WatchlistItem` interface export from that file.

**Files**: `src/hooks/useMarketData.ts`

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/AppHeader.tsx` | New shared header component |
| `src/pages/Portfolio.tsx` | Fix wallet connect, use AppHeader |
| `src/pages/Markets.tsx` | Fix wallet connect, use AppHeader |
| `src/pages/Alerts.tsx` | Fix wallet connect, use AppHeader |
| `src/pages/Dashboard.tsx` | Pass userId to chat history, use AppHeader |
| `src/hooks/useChatHistory.ts` | Support userId for email-only users |
| `src/pages/UserProfile.tsx` | Use real Supabase profile data |
| `src/hooks/useMarketData.ts` | Remove dead localStorage hooks |

**Database**: No schema changes needed. The existing `chat_conversations` table already has nullable `user_id` and `wallet_address` columns with appropriate RLS policies.

