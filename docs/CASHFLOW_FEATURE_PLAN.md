# Cashflow Feature Build Plan

> **Session handoff doc.** Read this file first in any new session.
> Complete sequence for all 13 Cashflow backlog items + 1 Platform item.
> Delete or move to `docs/archive/` when the sequence is finished.

---

## 1. Current State

| Item | Status | Commit |
|---|---|---|
| Cash Horizon & Bill Due-Date Calendar | ✅ shipped, removed from `backlog.md` + renumbered | `ecb9eb3` |
| Burn Pace Projection | ✅ shipped, removed from `backlog.md` | `84ba8de` |
| `formatCurrencyCompact` fraction-digit fix | ✅ shipped | `bbd89f0` |
| `AGENTS.md` graphify backgrounding rule | ✅ local only (gitignored, `.gitignore:49`) | — |

Working tree clean as of `ecb9eb3` (code). This doc follows in a separate
docs commit.

---

## 2. ⚠️ Numbering Trap — Read Before Doing Anything

Three numbering schemes exist and they **do not agree**:

1. **`backlog.md` `### N.` headings** — the real one. Always cite this.
2. An older 10-feature research list — **obsolete**, its table was never
   persisted and is not recoverable. Do not use its numbers.
3. "Build order #1, #2…" — means *sequence position*, **not** file position.

**Example of the trap:** earlier conversation said *"build #1, the Daily
Balance Forecast Calendar."* That meant **first in build order**. Its actual
position *was* `backlog.md` `### 2.` — it shipped, was removed, and everything
below it shifted down by one. The numbers are not stable.

Live example: build order **#3** (Auto-Detect Recurring Bills) is now
`backlog.md` **`### 9.`**, while **`### 3.`** is Smart CSV Import (build order
**#6**). Build order ≠ file position.

`backlog.md` `### 1.` is *Inter-Book Account Transfers*.

> **Rule:** numbering restarts **per app section** — Garage, Bio, List and
> Platform each carry their own `### 1.` Always cite the section too.
> Confirm against `backlog.md` before writing code.

---

## 3. Full Build Sequence

Provenance is marked on every row. **C = confirmed** in the prior session.
**D = derived** from the `backlog.md` Priority Matrix (L13–25) using the rule
in §3.3.

### 3.1 Confirmed order (items 1–4)

| # | `backlog.md` | Feature | Impact | Effort | Gate / note |
|---|---|---|---|---|---|
| **1** | *(removed)* | **Cash Horizon & Bill Due-Date Calendar** | 🔥🔥🔥 | Medium | ✅ **shipped** — removed + renumbered. Spec & gate results in §4 |
| **2** | `### 1.` | Inter-Book Transfers & Consolidated Net Worth | 🔥🔥🔥 | Medium | ⛔ **Blocked on user call:** backfill `type: 'transfer'` on existing entries, or start clean? |
| **3** | `### 9.` | Auto-Detect Recurring Bills from Entry History | 🔥🔥 | Low | Populates `cashflow_recurring_rules`, which feeds items 1, 10, 11 |
| **4** | Platform | Weekly Financial Health Digest (`backlog.md` L42) | 🔥🔥 | Low | 🟡 **Inferred** — prior session called this *"#5 alert digest."* **Confirm it's the right item before building.** |

### 3.2 Derived order (items 5–14)

Not yet agreed. Produced from the Priority Matrix so nothing is punted —
**reorder freely**, but do not silently skip.

| # | `backlog.md` | Feature | Impact | Effort | Status | Dependencies |
|---|---|---|---|---|---|---|
| 5 | `### 4.` | "Can I Afford It?" Purchase Sandbox | 🔥🔥🔥 | Low | Ready | — |
| 6 | `### 3.` | Smart CSV Import & Duplicate Detection | 🔥🔥 | Low | Ready | pairs with **12** |
| 7 | `### 5.` | 1-Click Split Settlement Sync | 🔥🔥 | Low | Ready | — |
| 8 | `### 6.` | Payday-to-Payday Custom Budget Cycles | 🔥🔥 | Low | Backlog | pairs with **13** |
| 9 | `### 7.` | 50/30/20 Macro Allocation Health Score | 🔥🔥 | Low | Backlog | — |
| 10 | `### 10.` | Bill & Payday Calendar Sync (`.ics` Feed) | 🔥🔥 | Low | Backlog | needs recurring rules → **3**; mirrors the List iCal pattern |
| 11 | `### 2.` | Debt Snowball & Avalanche Payoff Planner | 🔥🔥 | Medium | Scheduled | — |
| 12 | `### 11.` | Entry Reconciliation & Import Matching | 🔥🔥 | Medium | Backlog | extends **6**; reuses `merchant-rules.ts` |
| 13 | `### 12.` | Zero-Based "Underfunded" Assignment Panel | 🔥🔥 | Medium | Backlog | `backlog.md` states it *"pairs naturally with backlog #6"* → do **8** first |
| 14 | `### 8.` | Subscription Creep & Price Spike Watchdog | 🔥 | Low | Backlog | — |

### 3.3 Ranking rule used (for audit / override)

```
impact desc  →  effort asc (Low < Medium < High)
             →  status asc (Top Priority < High Priority < Scheduled < Ready < Backlog)
```

Dependencies override the rule where noted. Items **1–4 are confirmed** and
were ordered by prior-session decision, not by this rule.

### 3.4 Known dependency chain

```
3 (auto-detect recurring)
  ├─→ 1  Calendar         (needs recurring rules to place bill chips)
  ├─→ 10 .ics feed        (emits events FROM recurring rules)
  └─→ 14 Watchdog         (detects price spikes on detected subscriptions)

6 (smart CSV import)  ──→  12 (reconciliation extends duplicate detection)
8 (payday cycles)     ──→  13 (zero-based needs a cycle anchor)
```

---

## 4. ✅ Shipped — Cash Horizon & Bill Due-Date Calendar

> Formerly `backlog.md` `### 2.`. Removed from the backlog and renumbered on
> ship. The spec below is verbatim from the now-deleted section, kept as the
> record of what was built.

**Spec (verbatim from `backlog.md` L56–62):**

> - **Problem**: `SafeToSpendCard` provides a single static number, but personal
>   finance is a timing problem. Users need to know *when* upcoming bills hit
>   relative to their next paycheck to avoid liquidity cliffs.
> - **Solution**:
>   - An interactive monthly calendar grid visualizing recurring rules
>     (subscriptions, bills, payroll) and past entries.
>   - Projected daily balance graph highlighting days where balance dips near
>     zero before expected income arrives.
>   - 1-click "Mark as Paid / Post Entry" directly from bill chips.
> - **Complexity**: Medium (Leverages existing `@/components/ui` and List
>   calendar patterns; purely calculated from `recurringRules` and `entries`).

### 4.1 Implementation steps

| # | Step | Gate before advancing |
|---|---|---|
| 1 | Load `ui-ux-pro-max`; run `ui-ux-pro-max --design-system` against `design-system/kytbox/MASTER.md` | — |
| 2 | Build `calculateDailyBalanceProjection()` in `src/features/cashflow/math.ts` | — |
| 3 | Unit tests for the projection math | **tests green** |
| 4 | Cross-assert vs `src/features/cashflow/lib/safe-to-spend.ts` | no duplicated/conflicting daily-rate logic |
| 5 | Build calendar grid + daily-balance graph + bill chips | — |
| 6 | Gates: `vitest`, `eslint`, `tsc --noEmit` | **all three green** |
| 7 | A11y + E2E | `accessibility.test.ts` test 5 → `violations: []` |

**Do not build UI until step 3 is green.** Math first, pixels second.

**Results — 2026-09-26, all 7 green:** `vitest` 908/908, `eslint` clean,
`tsc --noEmit` exit 0, a11y test 5 → `violations: []`, visual test 7 passing.
The visual baseline `cashflow-detail-chromium-win32.png` **was regenerated**:
the pre-existing baseline dated `512f49a` (2026-09-02) had drifted from
unrelated commits (checkbox column, Quick Log, date-span label) and its
viewport never contained this card. Diff reviewed line-by-line, not
blind-accepted.

### 4.2 Known side effects

- `tests/e2e/visual-regression.test.ts` test 7 (`cashflow-detail.png`) baseline
  **will** change. Review the diff — do not blind-accept.
- `tests/e2e/accessibility.test.ts` test 5 axe-scans `/cashflow`, must stay
  `violations: []`.
- Playwright needs credentials + test data → **ask before running E2E**.

---

## 5. Rules (all still in force)

**Design & UI**
- Load `ui-ux-pro-max` **before** any UI change.
- `design-system/kytbox/MASTER.md` governs. No new palette, no new tokens.
- Mobile-first 320px min. `clamp()`, `flex-grow`, `grid-template-columns`.
- Shadcn theme colours. `@container` queries over arbitrary media-query pixels.
- WCAG 2.2. **Colour is never the sole indicator** — pair with text/icon/shape.

**Code**
- Zero `any`. Zero type assertions (`as`) — narrowing, unions, exhaustive
  `switch` only.
- No `eslint-disable`, not even file-level.
- No trailing semicolons in `.ts`. Match surrounding formatting.
- Zod at untrusted ingress. `zod/mini` client, full `zod` server. No runtime
  Zod on DB hot paths.
- Feature folders `src/features/[feature]/`; cross-feature imports only via
  the feature's public `index.ts`.

**Graphify**
- Codebase questions → `graphify query "<question>"` first.
- `graphify-out/` is **gitignored**; repo-root `glob`/`grep` prune it. Pass
  `path: graphify-out` explicitly. `graphify query` is unaffected.
- After edits are final: `graphify update .` **in the background** — never
  block your response on it.

**Gating**

| Blocks progress | Does not block |
|---|---|
| `vitest` results | `graphify update` |
| `eslint` results | screenshots / visual review |
| `tsc --noEmit` results | doc tweaks |

Only gate on output that changes what you do next.

---

## 6. Known Issues — Do Not Fix Unless Asked

- **`formatCurrencyCompact` doesn't compact.** Misleading name; it only
  groups. Renaming touches 56 call sites for zero user value → churn.
- **Pace flag window is narrow late in month.** On Sep 26 (26/30 days) it only
  trips at 86.7%–100% of limit; early month it's wide. Not a bug.
- **Burn Pace line never visually verified** (dark mode, 375px wrap).

---

## 7. Session Start Checklist

```
1. Read this file.
2. Read backlog.md → confirm target by ### N. heading, never by shorthand.
3. git log --oneline -5  → confirm nothing uncommitted.
4. Load ui-ux-pro-max (before any UI work).
5. Take the next unfinished row from §3.1, then §3.2.
6. On finishing an item: remove it from backlog.md matrix, renumber,
   ship, then update §3 here.
```

---

## 8. Session End Rule

**If it matters, write it to disk.** The original 10-feature research table
existed only in chat and is now unrecoverable. Do not repeat that — any
ranking, benchmark, or decision that will be needed later goes in a file in
this repo, in the session that produces it.
