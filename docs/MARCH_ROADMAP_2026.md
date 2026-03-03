# 🗺️ March 2026 — What To Do Next

Your February audit is **complete**. Every finding is resolved. The codebase is clean. Now we pivot from _fixing_ to _building forward_.

Here's my recommendation, ranked by **your own priority hierarchy** (Security > Stability > Performance > Code Quality), combined with what unblocks monetization fastest.

---

## 🔥 Tier 1: Do This Week (High-Impact, Low-Effort)

These are quick wins that shore up production readiness. Each is a 1–2 session task.

| #   | Item                                                | Why It Matters                                                                                                                                                      | Effort      |
| :-- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------- |
| 1   | ~~**Security Headers (CSP + HSTS)**~~               | ~~Nonce-based CSP via `proxy.ts` + HSTS/X-Frame/Referrer/Permissions headers via `next.config.ts`.~~                                                                | ~~✅ Done~~ |
| 2   | **Env Validation (`instrumentation.ts` + Zod)**     | No `instrumentation.ts` exists. If someone deploys with a missing `SUPABASE_URL`, the app silently breaks. Validate all env vars at startup with T3-Env or raw Zod. | ~1 session  |
| 3   | ~~**AVIF in `next.config.ts`**~~                    | ~~Added `formats: ['image/avif', 'image/webp']`. Free bandwidth savings.~~                                                                                          | ~~✅ Done~~ |
| 4   | **SEO `generateMetadata` on marketing/legal pages** | Your `/terms`, `/privacy`, `/refund`, and marketing pages likely have no `generateMetadata`. Social shares and Google indexing are handicapped.                     | ~1 session  |

> [!IMPORTANT]
> **Items 1 and 2 are non-negotiable before you accept any real users.** A missing CSP with user-generated link `href` values is a ticking XSS bomb.

---

## 🏗️ Tier 2: This Month (Foundation for Scale)

These are the structural investments that separate a side project from a product.

| #   | Item                                        | Why It Matters                                                                                                                                                                                                                               | Effort       |
| :-- | :------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| 5   | **Automated Testing (Vitest + Playwright)** | Zero tests. You've refactored auth, cashflow permissions, analytics RPCs, and DTOs — all untested. One bad merge and it's silent regression city. Start with server action unit tests (Vitest) and 3-5 critical path E2E tests (Playwright). | 2-3 sessions |
| 6   | **CI/CD Pipeline (GitHub Actions)**         | No pre-flight checks. Every push goes straight to prod without lint, type-check, or test validation. Set up `lint → type-check → test → build` pipeline.                                                                                     | ~1 session   |
| 7   | **PWA Manifest + Service Worker**           | No `manifest.json`. For a mobile-first link-in-bio product, "Add to Home Screen" is table stakes. Users expect app-like behavior.                                                                                                            | ~1 session   |
| 8   | **`canAccess` Feature Gate**                | Listed as pending in `PRE_MONETIZATION_IMPROVEMENTS.md`. This unblocks Phase 3 (Lemon Squeezy). Without it, you can't gate Pro features.                                                                                                     | ~1 session   |

---

## 🌍 Tier 3: Before Public Launch

These require more investment but are mandatory for a credible product.

| #   | Item                            | Why It Matters                                                                                                                                       | Effort        |
| :-- | :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ |
| 9   | **Observability (Sentry)**      | Silent failures in production. Error boundaries log to `console.error` — nobody sees those in prod. Sentry integration gives you real crash reports. | 1–2 sessions  |
| 10  | **i18n Infrastructure**         | Every UI string is hardcoded English. Setting up `next-intl` now (even if you only ship `en` initially) prevents a painful retrofit later.           | 2-3 sessions  |
| 11  | **Container Queries Migration** | Your components use media queries for component-level responsiveness. Migrating to `@container` makes components truly portable across FSD slices.   | 2-3 sessions  |
| 12  | **A3: Hybrid FSD Architecture** | The only remaining audit finding. Atomic Design alone doesn't isolate business logic. This is a longer refactor — plan it, don't rush it.            | Multi-session |

---

## 📌 Recommended Execution Order

```
Week 1:  ✅ CSP/HSTS Headers → Env Validation → ✅ AVIF → SEO Metadata
Week 2:  Vitest Setup + Server Action Tests → CI/CD Pipeline
Week 3:  canAccess Feature Gate → PWA Manifest
Week 4:  Sentry Integration → Begin i18n scaffold
```

> [!TIP]
> Every item above maps directly to the "Missing Pillars" section of `AUDIT_FEB_2026.md` (lines 261-278).

_Last Updated: March 02, 2026_
