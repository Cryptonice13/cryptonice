

## Plan: AI Credit System

### Overview
Implement a credit-based system that gates all AI features. Users get 100 free credits on signup, 10 daily login credits, and can purchase more via three pricing tiers. A coupon code "CryptoAI" gives a discount.

### Database Changes (3 new tables)

**1. `user_credits`** -- stores current balance
- `id` uuid PK, `user_id` uuid (nullable), `wallet_address` text (nullable), `balance` integer default 100, `created_at`, `updated_at`
- RLS: users can view/update their own row

**2. `credit_transactions`** -- logs every debit/credit
- `id` uuid PK, `user_id` uuid, `wallet_address` text, `amount` integer (positive=add, negative=deduct), `transaction_type` text (signup_bonus, daily_login, usage, purchase), `description` text, `created_at`
- RLS: users can view/insert their own

**3. `credit_purchases`** -- purchase records
- `id` uuid PK, `user_id` uuid, `wallet_address` text, `plan` text (basic/pro/enterprise), `credits` integer, `amount_usd` numeric, `coupon_code` text nullable, `status` text default 'completed', `created_at`
- RLS: users can view/insert their own

### Credit Costs
| AI Feature | Credits |
|---|---|
| Chat message | 1 |
| Portfolio analysis | 3 |
| Market prediction | 3 |
| Trading signal | 2 |
| Technical/Fundamental analysis | 5 |
| Crypto analyst query | 2 |
| Whale activity | 2 |

### Pricing Plans
- **Basic**: $5 → 150 credits
- **Pro**: $25 → 800 credits
- **Enterprise**: $100 → 3,500 credits
- Coupon "CryptoAI" → 20% bonus credits

### New Files

**1. `src/hooks/useCredits.ts`**
- Hook that manages credit balance: `fetchBalance()`, `deductCredits(amount, description)`, `addCredits(amount, type, description)`, `hasEnoughCredits(amount)`
- On mount: fetch from `user_credits`. If no row exists, create one with 100 credits (signup bonus) and log to `credit_transactions`
- Daily login bonus: check `credit_transactions` for today's `daily_login` entry; if none, add 10 credits
- Export `credits`, `isLoading`, `deductCredits`, `purchaseCredits(plan, couponCode?)`

**2. `src/pages/Credits.tsx`**
- New page showing: current balance, usage history (from `credit_transactions`), and purchase section with 3 pricing cards
- Coupon code input field -- when "CryptoAI" entered, show 20% bonus
- Purchase button (for now, simulates purchase by inserting into `credit_purchases` and adding credits)
- Clean UI with cards, badges, and transaction history table

### Modified Files

**3. `src/components/AppHeader.tsx`**
- Import `useCredits`, show credit balance next to the Brain icon as a small badge (e.g., `⚡ 87`)

**4. `src/pages/UserProfile.tsx`**
- Add a "Credits & Usage" button that navigates to `/credits`

**5. `src/App.tsx`**
- Add route `/credits` → `<Credits />`

**6. AI hooks -- add credit checks before API calls:**
- `src/hooks/useCryptoAI.ts`: In `sendMessage` deduct 1 credit, in `analyzePortfolio` deduct 3, in `getPrediction` deduct 3, in `getSignal` deduct 2. If insufficient, set error "Insufficient credits" and return early.
- `src/hooks/useAnalysis.ts`: In `runAnalysis` deduct 5 credits for technical/fundamental analysis.
- `src/components/ai/CryptoAnalystAgent.tsx`: Deduct 2 credits per query.

Each hook will import `useCredits` and call `deductCredits()` before making the API call. If balance < cost, show toast "Insufficient credits -- buy more" and abort.

**7. `src/hooks/useAuth.tsx`**
- On `SIGNED_IN` event, trigger credit initialization (create `user_credits` row if not exists + daily login bonus). This will be handled by `useCredits` hook being mounted in AppHeader which is on every authenticated page.

### Flow
1. User signs up → first time `useCredits` mounts, creates row with 100 credits
2. User logs in daily → `useCredits` checks for today's daily_login transaction, adds 10 if missing
3. User uses AI → credits deducted before API call; if 0, shows "Buy Credits" message
4. User navigates to `/credits` → sees balance, history, and can purchase plans
5. Coupon "CryptoAI" → 20% bonus credits on purchase

