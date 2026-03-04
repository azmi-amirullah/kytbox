# 🗺️ March 2026 — Unified Roadmap

February audit is **complete**. Now we build forward. This is the **single source of truth** for what to work on and in what order.

Ranked by: **Security > Stability > Performance > Code Quality > Features**, combined with what unblocks monetization fastest.

---

## � Priority Matrix

Every item — infrastructure AND features — scored and ranked together.

| Rank  | Item                                  | Category    | Pillar          | Effort         | Status      |
| :---: | :------------------------------------ | :---------- | :-------------- | :------------- | :---------- |
| ~~1~~ | ~~Security Headers (CSP + HSTS)~~     | ~~Infra~~   | ~~Security~~    | ~~1 session~~  | ~~✅ Done~~ |
| ~~2~~ | ~~AVIF Optimization~~                 | ~~Infra~~   | ~~Performance~~ | ~~5 min~~      | ~~✅ Done~~ |
| ~~3~~ | ~~**Env Validation (Zod + T3-Env)**~~ | ~~Infra~~   | ~~Security~~    | ~~1 session~~  | ~~✅ Done~~ |
| ~~4~~ | ~~**SEO `generateMetadata`**~~        | ~~Infra~~   | ~~Performance~~ | ~~1 session~~  | ~~✅ Done~~ |
| ~~5~~ | ~~**Cashflow: Charts**~~              | ~~Feature~~ | ~~UX~~          | ~~2 sessions~~ | ~~✅ Done~~ |
|   6   | **Cashflow: Categories**              | Feature     | UX              | ~1-2 sessions  | 🔲 Pending  |
|   7   | **Automated Testing (Vitest)**        | Infra       | Stability       | 2-3 sessions   | 🔲 Pending  |
|   8   | **CI/CD Pipeline (GitHub Actions)**   | Infra       | Stability       | ~1 session     | 🔲 Pending  |
|   9   | **`canAccess` Feature Gate**          | Feature     | Architecture    | ~1 session     | 🔲 Pending  |
|  10   | **Cashflow: Date Filtering**          | Feature     | UX              | ~1 session     | 🔲 Pending  |
|  11   | **Cashflow: Export (CSV)**            | Feature     | UX              | ~1 session     | 🔲 Pending  |
|  12   | **PWA Manifest + Service Worker**     | Infra       | UX              | ~1 session     | 🔲 Pending  |
|  13   | **Observability (Sentry)**            | Infra       | Stability       | 1-2 sessions   | 🔲 Pending  |
|  14   | **i18n Infrastructure**               | Infra       | Scale           | 2-3 sessions   | 🔲 Pending  |
|  15   | **Container Queries Migration**       | Infra       | Code Quality    | 2-3 sessions   | 🔲 Pending  |
|  16   | **Hybrid FSD Architecture (A3)**      | Infra       | Code Quality    | Multi-session  | 🔲 Pending  |

---

## 🧠 Ranking Rationale

### Why Env Validation (#3) before features?

One missing `SUPABASE_URL` on deploy = **entire app silently breaks in production**. 1 session to eliminate this risk permanently. Non-negotiable.

### Why SEO (#4) before Cashflow?

Marketing/legal pages have zero `generateMetadata`. Google can't index them properly, social shares look broken. Free discoverability win, ~1 session.

### Why Cashflow Charts (#5-6) before Testing (#7)?

Cashflow is **bare-bones** right now — 3 number cards and a table. Charts + categories transform it from a prototype to a product feature users actually want to use. Testing is critical but doesn't ship user value.

### Why Testing (#7-8) before `canAccess` (#9)?

You've refactored auth, cashflow permissions, DTOs — all untested. Without tests, `canAccess` would ship on an unstable foundation. Safety net first, then gate features behind it.

### Why Cashflow Filtering/Export (#10-11) after core infra?

Nice-to-have UX polish. Charts (#5-6) deliver 80% of the visual impact. Filtering and export can wait until user feedback confirms demand.

---

## 📌 Execution Plan

```
Week 1:  #3 Env Validation → #4 SEO Metadata
Week 2:  #5 Cashflow Charts → #6 Cashflow Categories
Week 3:  #7 Vitest + Tests → #8 CI/CD Pipeline
Week 4:  #9 canAccess Gate → #10 Cashflow Filtering
Week 5:  #12 PWA → #13 Sentry
```

> [!TIP]
> Items #10-11 (Cashflow filtering/export) are flexible — slot them in whenever there's downtime or user demand.
> See [CASHFLOW_IMPROVEMENTS.md](./CASHFLOW_IMPROVEMENTS.md) for detailed Cashflow scope per phase.

---

## 📎 Reference Docs

| Doc                                                                    | Purpose                                            |
| :--------------------------------------------------------------------- | :------------------------------------------------- |
| [CASHFLOW_IMPROVEMENTS.md](./CASHFLOW_IMPROVEMENTS.md)                 | Detailed Cashflow feature phases, file-level scope |
| [PRE_MONETIZATION_IMPROVEMENTS.md](./PRE_MONETIZATION_IMPROVEMENTS.md) | Pre-payment checklist, `canAccess` spec            |
| [AUDIT_FEB_2026.md](./AUDIT_FEB_2026.md)                               | February audit findings (all resolved)             |

_Last Updated: March 04, 2026_
