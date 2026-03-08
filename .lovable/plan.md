

## Plan: Full-Featured Alert History Section

### Current State
The Alert History is a basic side sheet showing a list of triggered alerts with read/unread status. It lacks filtering, analytics, bulk actions, and proper data presentation.

### Changes

#### 1. Upgrade Alert History from Sheet to Dedicated Tab
Replace the slide-out Sheet with a proper **4th tab** ("History") in the existing Tabs component. This gives it full page real estate and room for filters and analytics.

#### 2. Alert History Analytics Summary
Add a stats bar at the top of the History tab:
- **Total Alerts Triggered** (all time count)
- **Unread Alerts** count with badge
- **Most Alerted Asset** (asset with most triggers)
- **Last Triggered** (relative time of most recent alert)

Computed client-side from the `alertHistory` array.

#### 3. Filter & Sort Controls
Add inline controls:
- **Filter by asset** (dropdown of unique symbols from history)
- **Filter by type** (above/below/all)
- **Filter by read status** (all/unread/read)
- **Sort** (newest first / oldest first)

All client-side filtering on the fetched data.

#### 4. Table-Based History View
Replace the card list with a compact `Table` component showing columns:
- Status (read/unread dot)
- Asset (symbol)
- Type (above/below badge)
- Target Price
- Triggered Price
- Price Difference (% from target, color-coded)
- Date/Time
- Actions (mark read, mark all read)

#### 5. Bulk Actions
- **Mark All as Read** button
- Add a `markAllAlertsRead` function to `useWatchlistDb` hook that updates all unread alerts in one query

#### 6. Hook Enhancement (`useWatchlistDb.ts`)
- Add `markAllAlertsRead` callback that does `update({ is_read: true }).eq('is_read', false)` with the user filter
- Export it from the hook

#### 7. Remove History Sheet
Remove the Sheet/SheetTrigger from the page header since history now lives in its own tab. Keep the unread badge on the History tab trigger instead.

### Files Modified
- **`src/hooks/useWatchlistDb.ts`** -- Add `markAllAlertsRead` function
- **`src/pages/Alerts.tsx`** -- Replace Sheet with History tab, add filters, analytics summary, table view, bulk actions

### UI Layout (History Tab)
```text
+------------------------------------------+
| Stats: Total | Unread | Top Asset | Last |
+------------------------------------------+
| Filters: [Asset ▼] [Type ▼] [Status ▼]  |
| [Mark All Read]                          |
+------------------------------------------+
| ● | BTC | Above | $70,000 | $70,124 |.. |
|   | ETH | Below | $3,200  | $3,198  |.. |
+------------------------------------------+
```

No database schema changes needed -- all data already exists in `alert_history` table.

