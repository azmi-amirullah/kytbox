# 📅 Code Audit: June 2026

Systematic Security > Stability > Performance > Code Quality audit of every commit day in June 2026 to identify bugs and issues.

---

## Executive Summary

**Overall Grade: B+ (Upgraded to A post-resolution on June 30)**

June 2026 focused on improving cashflow performance, visual refinements (smooth transitions, pagination controls, collapsible states), and creator marketing assets. 

At the end of the month, a systematic security and architectural audit was performed, exposing serious IDOR vulnerabilities in the share system, rate-limiting gaps, and CSP configuration issues. These were promptly patched on June 30 in a series of security and architectural cleanups.

---

## Audit Progress

| Date | Push? | Day | Audited | Findings |
| :--- | :---: | :--- | :---: | :--- |
| Jun 01–17 | ❌ | — | N/A | No push |
| Jun 18 | ✅ | Thursday | ✅ | Clean — instant modal close, collapsible projection card on mobile |
| Jun 19–22 | ❌ | — | N/A | No push |
| Jun 23 | ✅ | Tuesday | ✅ | Clean — client-side pagination, fade animations, desktop collapsible card |
| Jun 24–27 | ❌ | — | N/A | No push |
| Jun 28 | ✅ | Sunday | ✅ | Clean — marketing CV download button, creator link centralization |
| Jun 29 | ❌ | — | N/A | No push |
| Jun 30 | ✅ | Tuesday | ✅ | 12 issues resolved: IDOR vulnerability, missing rate limiters, CSP unsafe-inline, redundant auth calls, SEO robots/sitemaps, FSD directory violation |

**✅ Audit complete — all June push days reviewed.**

---

## Audit Details

### Jun 18
**2 commits** — Decoupled modal state from data refresh, mobile collapsible projection cards.

| Severity | Category | Issue | File(s) | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| ✅ Clean | UX | **Instant Modal Close** | `EntryModal.tsx`, `CashflowCard.tsx` | Decoupled UI closing state from background refresh to reduce perceived latency. |
| ✅ Clean | UX | **Collapsible Mobile Projections** | `ProjectionsView.tsx` | Added accordion behavior to projections card on screens `< md` breakpoint. |

---

### Jun 23
**9 commits** — Client pagination, table styles, card collapsible states, padding fixes.

| Severity | Category | Issue | File(s) | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| ✅ Clean | Performance | **Client-Side pagination** | `CashflowDetail.tsx` | Avoids database query waterfall on pagination switches. |
| ✅ Clean | UX | **Smooth page-switch fade animations** | `CashflowDetail.tsx` | CSS transitions added to table body for page switches. |
| ✅ Clean | UX | **Collapsible Desktop Projections** | `ProjectionsView.tsx` | Expanded collapsible behavior to desktop viewports. |

---

### Jun 28
**1 commit** — CV Download button.

| Severity | Category | Issue | File(s) | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| ✅ Clean | UX | **Creator link centralization** | `(marketing)/page.tsx` | Added CV download button and cleaner link spacing. |

---

### Jun 30
**3 commits** — Full Codebase Audit resolutions.

| Severity | Category | Issue | File(s) | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| 🚨 Critical | Security | **`removeShare` IDOR Vulnerability** | `share-actions.ts` | **Fixed**. Deletion was allowed without verifying cashflow ownership. Fixed by verifying user matches cashflow owner before firing delete. |
| ⚠️ Medium | Security | **Unprotected setting username check** | `settings/actions.ts` | **Fixed**. Centralized `checkUsername` lacked rate limits. Added Upstash redis username rate limiter check. |
| ⚠️ Medium | Security | **Unsafe inline scripts fallback in CSP** | `csp.ts` | **Fixed**. Removed `'unsafe-inline'` from script-src as nonces are fully enforced. |
| ⚠️ Medium | Performance | **Duplicate auth calls on homepage** | `app/page.tsx` | **Fixed**. Eliminated redundant second `getUser()` / profile fetch. |
| ✅ Clean | SEO | **Robots.txt & Sitemap dynamic routing** | `robots.ts` [NEW], `sitemap.ts` [NEW] | Added automated sitemap generators to list and profile paths. |
| ✅ Clean | Code Quality | **FSD Architecture compliance** | `social-icons.tsx` | **Fixed**. Moved JSX-returning icons utility from `lib/` to `components/ui/`. |

---

## 🟢 What's Already Good (Genuine Strengths)

* **Rapid Vulnerability Patching**: Critical security gaps (IDOR, rate-limiting) were fixed immediately once identified.
* **Modern Next.js 16 Patterns**: Caching using `use cache` and dynamic `sitemap.ts` shows proper leverage of framework features.

---

## 📊 Architecture Scorecard

| Category | Score | Notes |
| :--- | :---: | :--- |
| **Security** | 10/10 | IDOR patched, CSP hardened, action rate limiting applied. |
| **Performance** | 8.5/10 | Eliminated redundant database queries on loading. |
| **Type Safety** | 9.5/10 | Centralized schemas, eliminated inline page casts. |
| **Code Organization** | 9.0/10 | Component locations corrected (FSD compliance). |
| **Testing** | 6.5/10 | Absolute paths resolved in vitest, but test coverage gaps exist. |
| **A11y** | 7.0/10 | Good structure, but needs WCAG 2.2 verification. |
| **i18n Readiness** | 2.0/10 | All strings are hardcoded. Zero i18n keys. |

---

## Pending Actions (Backlog)

| ID | Issue | Severity | Status |
| :--- | :--- | :--- | :--- |
| **E3** | Header avatar/username flash on route transitions | 💡 Low | 🔲 Backlog |
| **E4** | Keep support notification bell persistent and toggle count badge only | 💡 Low | 🔲 Backlog |
| **Q4** | Centralize duplicate `recurrenceIntervalSchema` | 💡 Low | 🔲 Backlog |
| **Q2** | Replace `isCustomThemeData` type guard with Zod | 💡 Low | 🔲 Backlog |
| **Q3** | Remove redundant `getAvatarUrl` utility | 💡 Low | 🔲 Backlog |
| **U1** | Customize dark mode shadow tokens | 💡 Low | 🔲 Backlog |

## Resolved Actions

| ID | Issue | Severity | Status |
| :--- | :--- | :--- | :--- |
| ~~**E2**~~ | ~~Fix layout tag duplication in `GlobalError`~~ | ~~⚠️ Medium~~ | ~~✅ Fixed (July)~~ |
| ~~**A1**~~ | ~~Add `connection()` to static pages for dynamic safety~~ | ~~⚠️ Medium~~ | ~~✅ Fixed (July)~~ |
| ~~**E1**~~ | ~~Add `loading.tsx` skeletons for auth and link sub-routes~~ | ~~⚠️ Medium~~ | ~~✅ Fixed (July)~~ |
| ~~**T1**~~ | ~~Add tests for security-critical middleware (origin, IP, CSP)~~ | ~~⚠️ Medium~~ | ~~✅ Fixed (July)~~ |

---

## Recommended Priority Order

| Priority | Items | Effort | Status |
| :--- | :--- | :---: | :--- |
| **P0 — Critical** | **E2**: GlobalError layout fix | — | **FIXED** |
| **P0 — Critical** | **A1**: page `connection()` safety | — | **FIXED** |
| **P1 — High** | **E1**: Missing route skeletons | — | **FIXED** |
| **P1 — High** | **T1**: Security helper tests | — | **FIXED** |
| **P2 — Medium** | **E3**: Header transitions cache, **E4**: Persistent support bell | ~2 hours | 🔲 Backlog |
| **P2 — Medium** | **Q4**: DRY recurrence schema, **Q2**: Zod theme guard | ~2 hours | 🔲 Backlog |
| **P3 — Low** | **Q3**: Remove getAvatarUrl, **U1**: Dark mode shadows | ~1 hour | 🔲 Backlog |

