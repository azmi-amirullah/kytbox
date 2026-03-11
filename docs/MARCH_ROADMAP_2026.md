# 🗺️ March 2026 — Unified Roadmap (Revised)

February audit is **complete**. Now we build forward. This is the **single source of truth** for what to work on and in what order.

Ranked by: **Security > Stability > Performance > Code Quality > Features**, combined with what ships the most user value fastest.

> [!NOTE]
> **March Revision Decisions:**
> - **CI/CD Pipeline removed**: Vercel handles auto-deploy on push. GitHub Actions is redundant overhead.
> - **`canAccess` Feature Gate deferred**: No monetization until the user base exists. Premature architecture for a product with zero users.
> - **i18n deferred**: No validated non-English market yet. 2-3 sessions of scaffolding for a hypothesis is premature optimization.
> - **FSD Architecture deferred**: A disruptive multi-session refactor. Do it when the current structure hurts, not before.

---

## 🎯 Priority Matrix

| Rank | Item | Category | Pillar | Effort | Status |
| :---: | :------------------------------------ | :---------- | :-------------- | :------------- | :---------- |
| ~~1~~ | ~~Security Headers (CSP + HSTS)~~ | ~~Infra~~ | ~~Security~~ | ~~1 session~~ | ~~✅ Done~~ |
| ~~2~~ | ~~AVIF Optimization~~ | ~~Infra~~ | ~~Performance~~ | ~~5 min~~ | ~~✅ Done~~ |
| ~~3~~ | ~~**Env Validation (Zod + T3-Env)**~~ | ~~Infra~~ | ~~Security~~ | ~~1 session~~ | ~~✅ Done~~ |
| ~~4~~ | ~~**SEO `generateMetadata`**~~ | ~~Infra~~ | ~~Performance~~ | ~~1 session~~ | ~~✅ Done~~ |
| ~~5~~ | ~~**Cashflow: Charts**~~ | ~~Feature~~ | ~~UX~~ | ~~2 sessions~~ | ~~✅ Done~~ |
| ~~6~~ | ~~**Cashflow: Categories**~~ | ~~Feature~~ | ~~UX~~ | ~~1 session~~ | ~~✅ Done~~ |
| ~~7~~ | ~~**Cashflow: Recurring + Projections**~~ | ~~Feature~~ | ~~UX~~ | ~~2 sessions~~ | ~~✅ Done~~ |
| ~~8~~ | ~~**Container Queries Migration**~~ | ~~Infra~~ | ~~Code Quality~~ | ~~2 sessions~~ | ~~✅ Done~~ |
| ~~9~~ | ~~**Hard Budgets & Alerts**~~ | ~~Feature~~ | ~~UX~~ | ~~2 sessions~~ | ~~✅ Done~~ |
| ~~10~~ | ~~**Cashflow: Date Filtering**~~ | ~~Feature~~ | ~~UX~~ | ~~1 session~~ | ~~✅ Done~~ |
| 11 | **Cashflow: Export (CSV)** | Feature | UX | ~1 session | 🔲 Pending |
| 12 | **Bio: Link List Pagination** | Feature | Stability | ~1 session | 🔲 Pending |
| 13 | **Automated Testing (Vitest)** | Infra | Stability | 2-3 sessions | 🔲 Pending |
| 14 | **Observability (Sentry)** | Infra | Stability | 1-2 sessions | 🔲 Pending |
| 15 | **PWA Manifest + Service Worker** | Infra | UX | ~1 session | 🔲 Pending |
| 16 | **`canAccess` Feature Gate** | Feature | Architecture | ~1 session | ⏸️ Deferred |
| 17 | **i18n Infrastructure** | Infra | Scale | 2-3 sessions | ⏸️ Deferred |
| 18 | **Hybrid FSD Architecture (A3)** | Infra | Code Quality | Multi-session | ⏸️ Deferred |

---

## 🧠 Ranking Rationale

### Why Hard Budgets (#9) before Filtering/Export (#10-11)?

Hard Budgets closes the **product loop** for Cashflow. Right now the app is a mirror — it tells you what happened. Budgets make it a shield — it warns you before damage is done. This is the last major feature before Cashflow is a complete product. Filtering and Export are quality-of-life on top of a complete foundation.

### Why Date Filtering (#10) before CSV Export (#11)?

Filtering is a prerequisite for a useful export. Exporting 2 years of unfiltered data is noise. The user should be able to filter first, then export exactly what they need.

### Why Bio Pagination (#12) after Cashflow features?

The bio folder architecture naturally limits root-level link volume for most users. Cashflow gaps are felt on every session. Pagination is a polish/stability item — important, but not blocking anyone today.

### Why Vitest (#13) after features?

Testing a moving target wastes effort. Once Hard Budgets and Cashflow filtering are done, the feature set stabilizes and tests have a fixed contract to validate. Tests written now will be rewritten in 2 sessions anyway.

### Why `canAccess` is deferred?

No monetization planned until there are actual users. Building a feature gate for a product with zero paying customers is pure premature architecture. Revisit when the user base justifies it.

---

## 📌 Execution Plan

```
Done:      #10 Cashflow Date Filtering ✅
Now:       #11 Cashflow CSV Export
Then:      #12 Bio Link Pagination
Stability: #13 Vitest → #14 Sentry
Polish:    #15 PWA
Later:     #16 canAccess (when monetization is planned)
```

---

## 🐛 Known UX Gaps (Tracked)

| Gap | Affected Area | Severity | Notes |
| :-- | :------------ | :------- | :---- |
| **No link list pagination** | Bio dashboard + public profile | Medium | Both pages do unbounded `select` on `links`. No limit applied. Tolerated by folder architecture but will degrade for power users with 50+ items. |
| **No date range filtering** | Cashflow entries table | Medium | All entries render at once. Unusable at scale. |
| **No data export** | Cashflow | High | Users won't commit serious financial data to a "black box". Trust risk. |

---

## 📎 Reference Docs

| Doc | Purpose |
| :-- | :------ |
| [CASHFLOW_IMPROVEMENTS.md](./CASHFLOW_IMPROVEMENTS.md) | Detailed Cashflow feature phases, file-level scope |
| [PRE_MONETIZATION_IMPROVEMENTS.md](./PRE_MONETIZATION_IMPROVEMENTS.md) | Pre-payment checklist, `canAccess` spec |
| [AUDIT_FEB_2026.md](./AUDIT_FEB_2026.md) | February audit findings (all resolved) |
| [cashflow_expansion_plan.md](./cashflow_expansion_plan.md) | Hard Budgets schema + component spec |

_Last Updated: March 11, 2026_
