# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Project Summary

## `azkar.json` Status (297 entries)

### Completed
- **sourceReference & sourceReferenceEn**: All 297 entries have authentic, verified references from Hisn Muslim (حصن المسلم) using sunnah.com citations
- **fadl & fadlEn**: All 297 entries have virtue/merit text from authentic hadith

### Key Scripts
- `C:\Users\ABDALL~1\AppData\Local\Temp\opencode\fix_all_remaining.py` — fixed source references for 170 entries
- `C:\Users\ABDALL~1\AppData\Local\Temp\opencode\add_fadl_batch2.py` — added fadl for 93 entries
- `C:\Users\ABDALL~1\AppData\Local\Temp\opencode\add_fadl_batch3.py` — added fadl for 90 entries
- `C:\Users\ABDALL~1\AppData\Local\Temp\opencode\show_remaining_fadl.py` — diagnostic tool

### File Location
`C:\Users\Abdallah Saeed\Desktop\ZIKR APP\assets\azkar.json`

# Performance Optimizations (June 2026)

## Problem
App was sluggish: counter animation stuttered, save/unsave in fihrist lagged, menu transitions felt heavy.

## Root Causes Found & Fixed

### 1. Monolithic Context Re-renders
- `ZikrProvider` had one giant context; any state change (counter tap, save, language, theme) re-rendered **all** consumers.
- **Fix**: Split into 4 granular contexts:
  - `CurrentZikrContext` — stable reference, rarely changes
  - `CounterContext` — only changes on count/progress taps
  - `SavedContext` — only changes on save/unsave
  - `DispatchContext` — forever-stable dispatch function
- Added granular hooks: `useCurrentZikr()`, `useZikrCounter()`, `useZikrSaved()`

### 2. AsyncStorage I/O on Every Tap
- Every counter increment wrote to AsyncStorage synchronously, blocking JS thread.
- **Fix**: 500ms debounce on progress writes via `useDebouncedCallback`.

### 3. CounterProgress on JS Thread
- Used RN `Animated.timing` with `useNativeDriver: false` (needed for SVG `strokeDashoffset`).
- **Fix**: Replaced with Reanimated `useSharedValue` + `useAnimatedProps` running entirely on UI thread.

### 4. Unstable Theme Colors
- `getAdaptiveTheme()` returned a new object every render, breaking `React.memo` on children.
- **Fix**: Wrapped in `useMemo` keyed by `theme.adaptive`.

### 5. DrawerLayout Re-rendering on Counter Taps
- `DrawerLayout` was re-created on every counter increment.
- **Fix**: Wrapped in `React.memo` with stable `keyExtractor` (`zikr.id`).

### 6. fihrist Save Handlers Unstable
- `handleToggleSaveItem` and `handleToggleSaveCategory` used `useCallback` with `savedZikr`/`savedCategoryIds` in deps → new reference every save → FlatList re-rendered all items.
- **Fix**: Used `useRef` to hold latest saved values; callbacks depend only on `dispatch`.
- Also: `filteredItems` recalculated on every `savedZikr` change even for non-saved views → split into `baseData` (ref + conditional dep) + `filteredItems` (pure search filter).

## Key Files Modified
- `src/providers/ZikrProvider.tsx` — split into 4 contexts
- `src/providers/ThemeProvider.tsx` — memoized adaptive colors
- `src/features/zikr/CounterProgress.tsx` — Reanimated conversion
- `src/features/drawer/DrawerLayout.tsx` — React.memo
- `app/index.tsx` — ProgressSyncer, granular hooks, React.memo Drawer
- `app/fihrist.tsx` — granular hooks, ref-based handlers, stabilized filteredItems
- `app/history.tsx`, `app/search.tsx` — granular hooks
