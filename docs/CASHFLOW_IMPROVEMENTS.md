# Cashflow Feature — Improvement Roadmap

This document captures the current state of the Cashflow feature and the planned improvements to elevate it from a functional CRUD tool to a premium financial tracking experience.

> [!NOTE]
> **Prerequisite:** Complete remaining Tier 1 items (Env Validation, SEO Metadata) from [MARCH_ROADMAP_2026.md](./MARCH_ROADMAP_2026.md) before starting Cashflow improvements.

---

## Current State (March 2026)

### ✅ What Exists

| Feature                                     | Component(s)                          |
| :------------------------------------------ | :------------------------------------ |
| CRUD cashflows (create/edit/delete)         | `CashflowModal`, `CashflowDashboard`  |
| CRUD entries (income/expense)               | `EntryModal`, `CashflowDetail`        |
| Summary stat cards (income/expense/balance) | `CashflowDashboard`, `CashflowDetail` |
| Sharing (public, read, edit roles)          | `ShareModal`, `share-actions.ts`      |
| Bookmark shared cashflows                   | `CashflowDetail`                      |
| DTO layer (no raw DB types in client)       | `CashflowDTO`, `CashflowEntryDTO`     |
| Currency formatting                         | `formatCurrencyCompact`               |
| Entry table with date/description/amount    | `CashflowDetail`, `CashflowCard`      |

### ❌ What's Missing

| Gap                          | Impact                                                           |
| :--------------------------- | :--------------------------------------------------------------- |
| **No charts/visualizations** | Users see 3 number cards and a table — zero visual trend insight |
| **No entry categories**      | Everything is just "income" or "expense" — no spending breakdown |
| **No date range filtering**  | All entries shown at once — unusable at scale                    |
| **No monthly summary**       | Zero month-over-month comparison                                 |
| **No export (CSV/PDF)**      | Users can't get their data out                                   |

---

## Planned Improvements

### Phase 1: Charts & Visualization (~2 sessions)

Add an income vs. expense chart to `CashflowDetail` using a lightweight charting library (e.g., Recharts).

**Scope:**

- **Bar chart**: Monthly income vs. expense comparison (grouped bars)
- **Line chart**: Running balance over time
- Responsive via `@container` queries (not media queries)
- Uses Shadcn theme colors (`--chart-1` through `--chart-5`)
- Mobile: stacked layout (chart above table). Desktop: side-by-side or tabbed

**Data Strategy:**

- Aggregate entries by month client-side (entries already fetched)
- If entry volume grows, move aggregation to a Supabase RPC

**Files to create/modify:**

- `[NEW]` `cashflow/components/CashflowChart.tsx` — chart component
- `[NEW]` `cashflow/components/ChartTooltip.tsx` — custom themed tooltip
- `[MODIFY]` `CashflowDetail.tsx` — integrate chart above entries table

---

### Phase 2: Categories & Tags (~1-2 sessions)

Add a `category` field to `cashflow_entries` for spending breakdown.

**Scope:**

- DB migration: add `category text` column to `cashflow_entries` (nullable, backward-compatible)
- Predefined categories: `food`, `transport`, `utilities`, `entertainment`, `salary`, `freelance`, `other`
- Category selector in `EntryModal`
- **Donut/pie chart**: Expense breakdown by category

**Files to create/modify:**

- `[NEW]` Supabase migration for `category` column
- `[MODIFY]` `EntryModal.tsx` — add category select
- `[MODIFY]` `CashflowDTO` / `CashflowEntryDTO` — add `category` field
- `[NEW]` `cashflow/components/CategoryChart.tsx` — donut chart

---

### ~~Phase 3: Date Filtering~~ ✅ Done

Date range controls to filter entries.

**Delivered:**

- Preset pills: "All Time", "This Month", "Last Month", "Last 3 Months", "Custom"
- Custom date range via native `<input type="date">` (no extra dep — `react-day-picker` not installed)
- Client-side `useMemo` filtering against ISO `YYYY-MM-DD` strings — zero timezone drift
- Summary stats (Income / Expense / Balance) react to filter
- Entry table and charts receive `filteredEntries`
- Projections and BudgetManager intentionally kept on unfiltered entries (time-aware logic)
- `dateFilterPresetSchema` added to `validation.schemas.client.ts` (Zod/mini)
- WCAG 2.2: `role="radiogroup"` / `aria-checked` on preset pills; labelled date inputs

**Files created/modified:**

- `[NEW]` `cashflow/components/DateFilter.tsx`
- `[MODIFY]` `CashflowDetail.tsx` — filter state, filteredEntries, wired to table + charts + stats
- `[MODIFY]` `src/lib/validation.schemas.client.ts` — `dateFilterPresetSchema`

---

### Phase 4: Export (~1 session)

Allow users to download their cashflow data.

**Scope:**

- CSV export (client-side generation, `Blob` download)
- Respects current date filter
- Export button in `CashflowDetail` header

**Files to create/modify:**

- `[NEW]` `lib/export.ts` — CSV generation utility
- `[MODIFY]` `CashflowDetail.tsx` — add export button

---

## Execution Order

```
Tier 1 (Security/SEO)         ✅  Env Validation → SEO Metadata
Cashflow Phase 1 (Charts)     ✅  Bar + Line + Category charts
Cashflow Phase 2 (Categories) ✅  DB migration + category picker + donut chart
Cashflow Phase 3 (Filtering)  ✅  Date range filter bar
Cashflow Phase 4 (Export)     🔲  CSV download (next)
```

> [!TIP]
> Phases 1-2 deliver the most visual impact. Phases 3-4 are quality-of-life. Prioritize accordingly based on user feedback after Phase 1.

_Last Updated: March 11, 2026_
