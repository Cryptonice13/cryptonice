

## Plan: Fix Analysis Data Flow and Add History Navigation

### Problems Identified
1. **MarketInsightsPanel**: Only shows analysis data if `runAnalysis` was called in the current session. When user selects an asset that already has saved analysis in DB, it shows "Run Analysis" button instead of the existing results.
2. **Analysis page**: Same issue -- on page load, doesn't fetch latest analysis from DB. History items are displayed but not clickable/loadable.
3. No way to view a specific historical analysis.

### Changes

#### 1. `src/hooks/useAnalysis.ts`
- Add `loadLatestForAsset(assetId)` function that queries `ai_analysis` table for the most recent technical and fundamental analysis for the given asset, then sets `technicalData` and `fundamentalData` state accordingly.
- Add `loadSpecificAnalysis(id)` function that loads a single history record by ID and sets the corresponding state.
- Track `currentAssetId` so when asset changes, we can reset/reload.
- Export `setTechnicalData` and `setFundamentalData` indirectly via a `selectHistoryItem(item)` function.

#### 2. `src/components/ai/MarketInsightsPanel.tsx`
- On `selectedAssetId` change, call `loadLatestForAsset(assetId)` to auto-fetch existing analysis from DB.
- This means when user clicks an asset in the table, the Technical/Fundamental tabs immediately show the latest saved analysis (if any), or show "Run Analysis" if none exists.

#### 3. `src/pages/Analysis.tsx`
- On mount / `assetId` change, call `loadLatestForAsset(assetId)` to populate technical/fundamental data from DB.
- Make history items clickable -- clicking a history item calls `selectHistoryItem(item)` which updates the displayed analysis.
- Highlight the currently viewed history item.
- After `runAnalysis` completes, refresh history list.

### Files to Modify
- `src/hooks/useAnalysis.ts` -- add `loadLatestForAsset`, `selectHistoryItem`
- `src/components/ai/MarketInsightsPanel.tsx` -- add `useEffect` to load latest on asset change
- `src/pages/Analysis.tsx` -- add `useEffect` to load latest on mount, make history items clickable

