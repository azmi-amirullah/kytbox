# 📅 Code Audit: Feb 2026

Systematic security + code quality review of every commit day in February 2026.

## Audit Progress

| Date   | Push? | Day       | Audited | Findings                                                                                   |
| :----- | :---: | :-------- | :-----: | :----------------------------------------------------------------------------------------- |
| Feb 01 |  ❌   | Sunday    |   N/A   | No push                                                                                    |
| Feb 02 |  ✅   | Monday    |   ✅    | 4 fixes: IP spoofing, rate limit DoS, background task crash, cashflow `is_public` bypass   |
| Feb 03 |  ✅   | Tuesday   |   ✅    | 3 fixes: Ghost share RLS bypass, privilege escalation (trigger), guest privilege retention |
| Feb 04 |  ❌   | Wednesday |   N/A   | No push                                                                                    |
| Feb 05 |  ✅   | Thursday  |   ✅    | Clean — security hardening (explicit edit checks), reserved usernames, UI fixes            |
| Feb 06 |  ❌   | Friday    |   N/A   | No push                                                                                    |
| Feb 07 |  ✅   | Saturday  |   ✅    | Clean — middleware auth refactor, query parallelization, analytics skeleton                |
| Feb 08 |  ❌   | Sunday    |   N/A   | No push                                                                                    |
| Feb 09 |  ✅   | Monday    |   ✅    | Clean — docs only (monetization strategy, support system spec)                             |
| Feb 10 |  ✅   | Tuesday   |   ✅    | Clean — legal pages (static), Kytbox rebrand (text-only)                                   |
| Feb 11 |  ✅   | Wednesday |   ✅    | Clean — support system (RLS correct, Zod validation, admin checks, RPC guards)             |
| Feb 12 |  ❌   | Thursday  |   N/A   | No push                                                                                    |
| Feb 13 |  ✅   | Friday    |   ✅    | Clean — legal pages (GDPR compliance, shared constants)                                    |
| Feb 14 |  ❌   | Saturday  |   N/A   | No push                                                                                    |
| Feb 15 |  ❌   | Sunday    |   N/A   | No push                                                                                    |
| Feb 16 |  ❌   | Monday    |   N/A   | No push                                                                                    |
| Feb 17 |  ❌   | Tuesday   |   N/A   | No push                                                                                    |
| Feb 18 |  ✅   | Wednesday |   ✅    | Clean — UI only (skeleton architecture, mobile layout, button shapes)                      |
| Feb 19 |  ✅   | Thursday  |   ✅    | Clean — social links (jsonb), auto-save, profile architecture refactor                     |
| Feb 20 |  ✅   | Friday    |   ✅    | Clean — custom theme engine (normalizeHex sanitizes CSS injection)                         |
| Feb 21 |  ✅   | Saturday  |   ✅    | Clean — nested folders (DB trigger depth guard), security patches (our audit)              |

**✅ Audit complete — all 15 push days reviewed.**

## Audit Details

### Feb 02

| Severity    | Issue                                      | File                      | Fix                        |
| :---------- | :----------------------------------------- | :------------------------ | :------------------------- |
| 🚨 Critical | IP spoofing via `x-forwarded-for`          | `route.ts`, `tracking.ts` | Prioritized Vercel headers |
| 🚨 Critical | Rate-limited requests still queried DB     | `route.ts`                | Immediate 429 response     |
| ⚠️ Medium   | Background `after()` silently crashes      | `route.ts`                | Added try/catch            |
| ⚠️ Medium   | Blind `is_public` check on cashflow shares | `actions.ts`              | Explicit server-side check |

### Feb 03

| Severity    | Issue                                        | File               | Fix                                       |
| :---------- | :------------------------------------------- | :----------------- | :---------------------------------------- |
| 🚨 Critical | Ghost share RLS bypass on private cashflows  | `share-actions.ts` | Context-aware `is_public` check           |
| 🚨 Critical | Self-role escalation via unrestricted UPDATE | RLS policy         | DB trigger on restricted columns          |
| ⚠️ Medium   | Guest privilege retention on removal         | `share-actions.ts` | Full delete for guests, unpin for invites |

---

## Legal Hardening (Feb 21)

10 fixes applied across Terms, Privacy, and Refund pages:

| #   | Fix                                                            | Page           | Status                           |
| :-- | :------------------------------------------------------------- | :------------- | :------------------------------- |
| 1   | Min age requirement (13 / 16 EEA)                              | Terms          | ✅                               |
| 2   | EU consumer jurisdiction carve-out                             | Terms          | ✅                               |
| 3   | EU Representative (Art. 27)                                    | —              | ❌ Skipped (not needed at scale) |
| 4   | 72-hour breach notification                                    | Privacy        | ✅                               |
| 5   | Upstash added to sub-processors                                | Privacy        | ✅                               |
| 6   | Liability cap ($100 / 12-month)                                | Terms          | ✅                               |
| 7   | Log retention period (soft language)                           | Privacy        | ✅                               |
| 8   | Annual plan not pro-rated                                      | Refund         | ✅                               |
| 9   | Speed Insights added to sub-processors                         | Privacy        | ✅                               |
| 10  | Fixed false claims (export, self-service deletion, auto-purge) | Terms, Privacy | ✅                               |

---

## Code Quality Audit (Feb 21)

Full codebase scan: 8 server action files, 2 API routes, auth helpers, admin client, public routes, all components, and configuration. (Analyzed via `@[/code-reviewer]` standards)

### Performance & Architecture

| ID    | Severity  | File                     | Issue                                                                                          | Fix                                      |
| :---- | :-------- | :----------------------- | :--------------------------------------------------------------------------------------------- | :--------------------------------------- |
| ✅ P1 | 🚨 High   | `analytics/actions.ts`   | ~~**4 sequential DB calls** in `getAnalyticsData` (chart → referer → topLinks → views)~~       | ✅ Fixed                                 |
| P2    | ⚠️ Medium | `bio/actions.ts`         | `addLink` runs 2 sequential independent queries (sort_order + RPC)                             | `Promise.all()`                          |
| P3    | ⚠️ Medium | `cashflow/actions.ts`    | `updateEntry` / `deleteEntry`: 3 sequential queries (entry → cashflow → share)                 | Join or RPC                              |
| P4    | ⚠️ Medium | `[username]/page.tsx`    | **Profile queried twice** — once in `page()`, once in `generateMetadata()`                     | Use `cache()` wrapper or request dedup   |
| P5    | ⚠️ Medium | `cashflow/[id]/page.tsx` | **Sequential queries** — fetches cashflow inside `Promise.all`, then awaits `share` separately | Move share query to `Promise.all`        |
| P6    | 💡 Low    | `src/lib/data-cache.ts`  | **Dead code** — `unstable_cache` helpers are defined but never used                            | Implement in static pages or remove      |
| P7    | 💡 Low    | 9 pages                  | `select('*')` over-fetches columns (profiles, links, cashflows, tickets)                       | Select only needed columns               |
| P8    | 🚨 High   | `cashflow_shares` (DB)   | **Missing `email` index** on `cashflow_shares` causes full sequential table scans for users    | `CREATE INDEX idx_cashflow_shares_email` |

### Code Quality & Security

| ID  | Severity    | File                  | Issue                                                                                   | Fix                                                                      |
| :-- | :---------- | :-------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| Q1  | ⚠️ Medium   | `cashflow/actions.ts` | **Edit-permission logic duplicated 3x** across `addEntry`, `updateEntry`, `deleteEntry` | Extract `checkEditPermission()` helper                                   |
| Q2  | 💡 Low      | `share-actions.ts`    | `updateShareRole` lacks App-level ownership check (DB trigger already protects this)    | Add explicit ownership verification                                      |
| Q3  | 💡 Low      | `cashflow/page.tsx`   | Triple `as unknown as` casts — Supabase types mismatch                                  | Fix types or use `.returns<T>()`                                         |
| Q4  | 🚨 Critical | Server Actions        | **No schema validation** on `FormData` processing, relying blindly on type casting      | Implement strict parsing (Valibot for Edge, or Zod 4)                    |
| Q5  | 🚨 Critical | `components/`         | **Component Data Leaks** — Risk of passing entire DB rows from Server to Client props   | Map strictly to DTOs in Client layers. NEVER pass raw DB rows to client. |

### Error Handling & Reliability

| ID    | Severity    | File                                  | Issue                                                                                       | Fix                              |
| :---- | :---------- | :------------------------------------ | :------------------------------------------------------------------------------------------ | :------------------------------- |
| E1    | 🚨 High     | `cashflow/`, `support-admin/`, `app/` | **Missing `error.tsx` boundaries** — only bio, settings, [username] have them               | Add error boundaries             |
| ✅ E2 | 🚨 High     | `cashflow/[id]/page.tsx`              | ~~**Unsafe non-null assertion** — `user.email!.toLowerCase()` will crash if email missing~~ | ✅ Fixed                         |
| E3    | 💡 Low      | `(auth)/actions.ts` L106              | `resetPassword` builds redirect URL from `origin` header — could be manipulated             | Validate against allowed origins |
| E4    | ⚠️ Medium   | `(auth)/actions.ts` L142              | `checkUsernameAvailable` has NO rate limiting — active username enumeration risk            | Add rate limit or debounce       |
| E5    | 🚨 Critical | `(auth)/actions.ts`                   | **Missing auth rate limiting** on `/login`, `/signup`, `/forgot-password`                   | Add Upstash Redis rate limiting  |

### Accessibility & Configuration (A11y/Infra)

| ID    | Severity  | File           | Issue                                                                                 | Fix                                |
| :---- | :-------- | :------------- | :------------------------------------------------------------------------------------ | :--------------------------------- |
| A1    | ⚠️ Medium | All Components | **Missing ARIA attributes** — only 1 `aria-expanded` found in entire UI layer         | Add standard radix/aria tags       |
| ✅ A2 | 💡 Low    | `package.json` | ~~**Phantom dependency** — `@types/crypto-js` in devDeps but no `crypto-js` in deps~~ | ✅ Fixed                           |
| A3    | 💡 Low    | `components/`  | **UI Architecture Compliance** — Missing clear Atomic Design directory splits         | Refactor into atoms/molecules/orgs |

### Type Safety

| ID    | Severity | File                                                         | Issue                                                                   | Fix                                                     |
| :---- | :------- | :----------------------------------------------------------- | :---------------------------------------------------------------------- | :------------------------------------------------------ |
| ✅ T1 | 🚨 High  | `bio/actions.ts`, `cashflow/actions.ts`, `(auth)/actions.ts` | ~~**Unsafe casting** — `formData.get() as string` without null checks~~ | ✅ Fixed                                                |
| T2    | 💡 Low   | `bio/page.tsx`                                               | `profile={{} as Profile}` for loading states lies to the type system    | Use proper loading skeleton or `Partial<Profile>` types |
| T3    | 💡 Low   | `AppearanceEditor.tsx`                                       | 14 `as` casts, 2 unsafe `as unknown as Record`                          | Fix types to remove unsafe casts                        |

### ⚠️ Missing Pillars (Unaudited, Tracked for March)

The following enterprise categories are completely missing from the codebase and therefore could not be audited. They must be implemented to reach production-grade maturity:

| Pillar                | Issue                                                         | Impact                                                            |
| :-------------------- | :------------------------------------------------------------ | :---------------------------------------------------------------- |
| **Automated Testing** | Zero testing frameworks installed (no Jest, Playwright, etc.) | Regressions in business logic cannot be caught automatically      |
| **CI/CD Pipelines**   | No automated deployment workflows (e.g., GitHub Actions)      | Code is deployed without pre-flight linting or type-checking      |
| **Observability**     | No application-layer error tracking (e.g., Sentry)            | Server crashes and client exceptions fail silently in production  |
| **SEO & OpenGraph**   | Missing `generateMetadata` on core marketing/legal pages      | Search engine visibility and social shareability are bottlenecked |

### What's Already Good ✅

- **XSS Mitigations** — no `dangerouslySetInnerHTML`. However, **requires validation** that user inputs like `href={userLink}` strictly sanitize protocol schemes (e.g., prevents `javascript:alert('pwned')`).
- **Admin client** only used in link redirect route (server-side, properly scoped)
- **Environment variables** — only `NEXT_PUBLIC_SUPABASE_URL` and publishable key exposed (safe)
- **Error boundaries** exist for bio, settings, and public profile pages
- **Auth helper** uses `getUser()` (server-verified) not `getSession()` (client-spoofable)
- **All actions** return consistent `{ error }` / `{ success }` shapes with `console.error`
- **URL validation** thorough with protocol + TLD checks (as long as it's enforced on ALL user inputs)
- **NPM Audit** — 14 vulnerabilities remaining (0 moderate, 14 high). Resolved moderate `ajv` ReDoS via `npm audit fix`. Remaining 14 are `minimatch` ReDoS in `devDependencies` (ESLint toolchain) — zero impact on production bundle.

### Action Plan Matrix

| ID         | Issue                                                              | Severity        | Effort Target          |
| :--------- | :----------------------------------------------------------------- | :-------------- | :--------------------- |
| ~~**P8**~~ | ~~Add missing `email` index to `cashflow_shares`~~                 | ~~🚨 Critical~~ | ~~✅ Fixed (DB Only)~~ |
| ~~**T1**~~ | ~~Fix blind `as string` casts in `formData` (add `?.toString()`)~~ | ~~🚨 High~~     | ~~✅ Fixed~~           |
| ~~**E2**~~ | ~~Fix unsafe non-null assertion `user.email!` in cashflow route~~  | ~~🚨 High~~     | ~~✅ Fixed~~           |
| ~~**A2**~~ | ~~Uninstall phantom dependency `@types/crypto-js`~~                | ~~💡 Low~~      | ~~✅ Fixed~~           |
| **E5**     | Implement Upstash Rate Limiting on auth actions                    | 🚨 Critical     | 🧰 Medium (Infra)      |
| **Q4**     | Install and enforce **Zod 4** validation for ALL actions           | 🚨 Critical     | 🛠️ Hard Refactor       |
| **Q5**     | Component Data Leaks (Map API/DB returns to strict DTOs)           | 🚨 Critical     | 🛠️ Hard Refactor       |
| **E1**     | Add missing `error.tsx` boundaries to route tree                   | 🚨 High         | 🧰 Medium              |
| ~~**P1**~~ | ~~Optimize Analytics queries (Promise.all)~~                       | ~~🚨 High~~     | ~~✅ Fixed~~           |
| **E4**     | Rate limit `checkUsernameAvailable` endpoint                       | ⚠️ Medium       | 🧰 Medium              |
| **P2**     | Parallelize `addLink` queries                                      | ⚠️ Medium       | ⚡ Quick Win           |
| **P4**     | Cache public profile query (prevent db double-fetch)               | ⚠️ Medium       | ⚡ Quick Win           |
| **P5**     | Parallelize cashflow share query in Promise.all                    | ⚠️ Medium       | ⚡ Quick Win           |
| **Q1**     | Extract edit-permission helper logic                               | 💡 Low          | 🧰 Medium (Refactor)   |
| **Q2**     | Add redundant ownership check to share roles                       | 💡 Low          | ⚡ Quick Win           |
| **T2**     | Fix TS lie: `profile={{} as Profile}`                              | 💡 Low          | ⚡ Quick Win           |
| **T3**     | Fix unsafe TS casts in `AppearanceEditor`                          | 💡 Low          | 🧰 Medium              |
| **A3**     | Architecture: Refactor components to Atomic Design                 | 💡 Low          | 🧱 Long-term Refactor  |

> **[@code-reviewer note]**: The audit document was updated by `@code-reviewer` to reflect accurate severities, prioritizing Security > Stability > Performance > Code Quality. The list above is the true priority list required for an enterprise-ready release.
