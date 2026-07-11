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
| Feb 22 |  ❌   | Sunday    |   N/A   | No push                                                                                    |
| Feb 23 |  ✅   | Monday    |   ✅    | 11 fixes: Query parallelizations, type safety fixes, ownership auth, missing index         |
| Feb 24 |  ✅   | Tuesday   |   ✅    | Clean — Zod 4 hardening (Q4 resolved), rate limit alignment, email cooldowns, UI fixes     |
| Feb 25 |  ✅   | Wednesday |   ✅    | Clean — Error boundaries (E1), cashflow permission refactor (Q1/P3), TS cast fixes (T3)    |
| Feb 26 |  ✅   | Thursday  |   ✅    | Clean — Origin validation (E3), `use cache` migration (P6), type decentralization (Q3)     |
| Feb 27 |  ✅   | Friday    |   ✅    | Clean — DTO mapping (Q5), ARIA attributes (A1), ESLint enterprise, loading architecture    |
| Feb 28 |  ✅   | Saturday  |   ✅    | Clean — Zod type narrowing (T2), `select(*)` optimization (P7), analytics RPC migration    |

**✅ Audit complete — all February push days (Feb 1–28) reviewed and clean.**

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

### Feb 24

**4 commits** — Security hardening (rate limits + Zod validation), cashflow UI fix, label refactoring.

| Severity | Category   | Issue                                                                             | File(s)                                                    | Verdict                     |
| :------- | :--------- | :-------------------------------------------------------------------------------- | :--------------------------------------------------------- | :-------------------------- |
| ✅ Clean | Security   | IP extraction centralized into `getIp()` (eliminates duplicate code)              | `src/lib/ip.ts` [NEW]                                      | Correct Vercel header order |
| ✅ Clean | Security   | Auth rate limits: 5 req/min on login/signup/reset, 30 req/min on username check   | `src/lib/upstash/redis.ts`, `(auth)/actions.ts`            | Proper sliding window       |
| ✅ Clean | Security   | Email cooldown (62s) prevents Supabase email spam on signup/reset                 | `(auth)/actions.ts`                                        | Redis TTL-based lock        |
| ✅ Clean | Validation | **Zod 4 schemas** for ALL server actions (auth, bio, cashflow, settings, support) | `src/lib/schemas.ts` [NEW], 5 action files                 | **Resolves audit Q4**       |
| ✅ Clean | Validation | `Object.fromEntries(formData)` + `.safeParse()` replaces blind `as string` casts  | All action files                                           | Proper type narrowing       |
| ✅ Clean | Validation | `z.coerce.number().positive()` for cashflow amounts (replaces `parseFloat`)       | `cashflow/actions.ts`                                      | No more NaN edge cases      |
| ✅ Clean | Validation | `z.instanceof(File)` for avatar upload validation                                 | `settings/actions.ts`                                      | Runtime type safety         |
| ✅ Clean | API Compat | `createFolder` / `moveToFolder` refactored from args to `FormData` intake         | `bio/actions.ts`, `LinkModal.tsx`, `MoveToFolderModal.tsx` | Consistent with Zod pattern |
| ✅ Clean | UX         | Rate limit errors now show countdown seconds (`Wait Xs`)                          | `(auth)/actions.ts`                                        | Better user feedback        |
| ✅ Clean | UX         | Cashflow modal close simplified (removed `shouldClose` state + microtask hack)    | `CashflowModal.tsx`                                        | Cleaner lifecycle           |
| ✅ Clean | UX         | Removed unnecessary `e.preventDefault()` on dropdown menu actions                 | `CashflowList.tsx`                                         | Fixed dropdown close bug    |
| ✅ Clean | UX         | Labels updated from "Add Link" → "Add Item" / "Add Folder" for folder support     | `LinkList.tsx`, `LinkModal.tsx`, `LinksTabContent.tsx`     | Correct taxonomy            |

> **@code-reviewer verdict:** This is the strongest day of February. The Zod 4 migration is comprehensive — every server action now validates at the boundary. The rate limiting architecture with separate sliding windows per action type and the email cooldown mechanism are production-grade. The `getIp()` centralization eliminates a class of IP-spoofing bugs. No findings. **Resolves audit items Q4, E5, E4, T1.**

### Feb 25

**7 commits** — Error boundaries, auth-aware recovery, proxy fix, cashflow refactor, TS cast cleanup, parallelization.

| Severity | Category     | Issue                                                                                                                 | File(s)                                                | Verdict                   |
| :------- | :----------- | :-------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- | :------------------------ |
| ✅ Clean | Stability    | **Consolidated error boundaries** — `app/error.tsx`, `(platform)/error.tsx`, `(admin)/error.tsx`, `support/error.tsx` | 4 new `error.tsx` files, deleted 2 per-page duplicates | **Resolves audit E1**     |
| ✅ Clean | Stability    | Auth-aware recovery boundaries for auth, marketing, onboarding, public profile, public cashflow                       | 6 new `error.tsx` files                                | Full route coverage       |
| ✅ Clean | UX           | `ErrorState` upgraded — context path display, responsive sizing, pill buttons, backdrop blur                          | `error-state.tsx`                                      | Premium error UX          |
| ⚠️ Note  | Security     | Proxy refined: `/cashflow` exact match protected, sub-paths `/cashflow/[id]` public                                   | `src/proxy.ts`                                         | Correct — page-level auth |
| ✅ Clean | Code Quality | **Permission helper extracted** — `checkEditPermission()` replaces 3x duplicated logic blocks                         | `cashflow/actions.ts`                                  | **Resolves audit Q1**     |
| ✅ Clean | Performance  | Permission checks parallelized with `Promise.all` (owner + share queries)                                             | `cashflow/actions.ts`                                  | **Resolves audit P3**     |
| ✅ Clean | Performance  | Joined queries (`cashflows(user_id)`) in `updateEntry`/`deleteEntry` to skip extra fetch                              | `cashflow/actions.ts`                                  | Eliminates waterfall      |
| ✅ Clean | Type Safety  | 14 `as` casts removed from `AppearanceEditor` — replaced with `as const`, type narrowing, Zod                         | `AppearanceEditor.tsx`                                 | **Resolves audit T3**     |
| ✅ Clean | Type Safety  | Inline `import()` types replaced with proper top-level `CustomThemeData` import                                       | `bio/page.tsx`, `[username]/page.tsx`                  | Cleaner module boundaries |
| ✅ Clean | Docs         | Updated audit docs, Kytbox spec, support system spec, cashflow docs                                                   | 5 doc files                                            | Housekeeping              |

> **@code-reviewer verdict:** Solid structural day. The error boundary architecture is now comprehensive — every route group has context-aware recovery with structured telemetry. The `checkEditPermission` extraction with the `cachedOwnerId` optimization is elegant: it uses joined queries to avoid the extra fetch when possible, and falls back to parallel queries otherwise. The `as` cast cleanup in `AppearanceEditor` is thorough. One note: the proxy change for `/cashflow` exact-match protection is correct but relies on page-level auth for sub-paths — verified that `cashflow/[id]/page.tsx` properly checks `is_public` before rendering. **Resolves audit items E1, Q1, P3, T3.**

### Feb 26

**6 commits** — Caching modernization, origin validation, type decentralization, loading splash, forgot password fix.

| Severity | Category     | Issue                                                                                        | File(s)                                         | Verdict                  |
| :------- | :----------- | :------------------------------------------------------------------------------------------- | :---------------------------------------------- | :----------------------- |
| ✅ Clean | Security     | **Origin validation** — `getSafeOrigin()` whitelists allowed origins for password reset      | `src/lib/origin.ts` [NEW], `(auth)/actions.ts`  | **Resolves audit E3**    |
| ✅ Clean | Performance  | **`use cache` migration** — `getProfileByUsername` uses Next.js 16 `cacheTag()` directive    | `src/lib/data-cache.ts`                         | **Resolves audit P6**    |
| ✅ Clean | Performance  | `cacheComponents: true` enabled in `next.config.ts`                                          | `next.config.ts`                                | Next.js 16 standard      |
| ✅ Clean | Code Quality | **Type decentralization** — `src/types/database.ts` extracts row types from generated schema | `src/types/database.ts` [NEW], 28 files updated | **Resolves audit Q3**    |
| ✅ Clean | Code Quality | Eliminated `as unknown as` triple-casts in cashflow page via proper view types               | `cashflow/page.tsx`                             | Direct type consumption  |
| ✅ Clean | UX           | Premium loading splash with animated rings, backdrop blur, ARIA `role="status"`              | `loading-splash.tsx` [NEW]                      | Accessible loading state |
| ✅ Clean | UX           | `CurrentYear` server component uses `connection()` for hydration-safe rendering              | `current-year.tsx` [NEW]                        | No hydration mismatch    |
| ✅ Clean | UX           | Forgot password flow resets success/error state on back navigation                           | `forgot-password/page.tsx`                      | Prevents stale UI state  |
| ✅ Clean | Arch         | Public profile page switched from `createClient` to `createStaticClient` + centralized cache | `[username]/page.tsx`                           | Single source of truth   |
| ✅ Clean | Docs         | Updated audit docs, added Bio Architecture Deep Dive doc                                     | 2 doc files                                     | Housekeeping             |

> **@code-reviewer verdict:** Architecturally significant day. The `use cache` + `cacheTag()` migration is the correct Next.js 16 pattern — replacing the closure-heavy `unstable_cache` wrapper. The origin validation in `getSafeOrigin()` properly whitelists against `NEXT_PUBLIC_SITE_URL` and dev origins. The type decentralization via `src/types/database.ts` decouples business code from the generated Supabase schema, making the codebase CLI-safe for future `supabase gen types` runs. No findings. **Resolves audit items E3, P6, Q3.**

### Feb 27

**4 commits** — DTO mapping, ARIA attributes, ESLint enterprise enforcement, loading architecture modernization.

| Severity | Category    | Issue                                                                                             | File(s)                                                       | Verdict                        |
| :------- | :---------- | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------ | :----------------------------- |
| ✅ Clean | Security    | **DTO mapping** — `src/types/dto.ts` + `src/lib/mappers.ts` prevent raw DB rows flowing to client | `dto.ts` [NEW], `mappers.ts` [NEW], 18 component files        | **Resolves audit Q5**          |
| ✅ Clean | Security    | All Server→Client boundaries now use `mapProfileToDTO`, `mapLinkToDTO`, `mapCashflowToDTO`, etc   | `bio/page.tsx`, `cashflow/[id]/page.tsx`, cashflow components | Strict field whitelisting      |
| ✅ Clean | A11y        | **ARIA attributes added** — `aria-label` on password toggles, icon buttons, header logo, user nav | 10 files updated                                              | **Resolves audit A1**          |
| ✅ Clean | Enforcement | **ESLint enterprise rules** — `no-explicit-any: error`, `consistent-type-assertions: never`       | `eslint.config.mjs`                                           | Blocks `as` casts at lint time |
| ✅ Clean | Enforcement | **jsx-a11y plugin** integrated — recommended ruleset enforced                                     | `eslint.config.mjs`, `package.json`                           | Automated ARIA enforcement     |
| ✅ Clean | UX          | **Loading architecture modernized** — route-level skeletons for support, support-admin routes     | 5 new `loading.tsx` files                                     | Instant perceived load         |
| ✅ Clean | UX          | Global `LoadingSplash` deleted — replaced with silent `Suspense fallback={null}`                  | `loading-splash.tsx` [DELETED], `layout.tsx`                  | No more flash on navigation    |
| ✅ Clean | UX          | Bio page `Suspense` removed — relies on route-level `loading.tsx` skeleton instead                | `bio/page.tsx`                                                | Cleaner page component         |

> **@code-reviewer verdict:** This day closes the two most critical remaining audit items. The DTO layer is well-designed — explicit field whitelisting via mapper functions ensures no accidental sensitive data leakage to the client bundle. The ESLint config with `assertionStyle: 'never'` is aggressive but correct — it will block any future `as` casts at lint time, forcing proper type narrowing. The `jsx-a11y` integration automates ARIA enforcement going forward. The loading architecture cleanup (deleting `LoadingSplash`, using route-level skeletons) is the correct Next.js App Router pattern. **Resolves audit items Q5, A1.**

### Feb 28

**3 commits** — Zod type narrowing enforcement, select over-fetching optimization, analytics RPC migration.

| Severity | Category    | Issue                                                                                                         | File(s)                                                       | Verdict                       |
| :------- | :---------- | :------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------ | :---------------------------- |
| ✅ Clean | Type Safety | **Zod type narrowing** — `validation.schemas.ts` (server) + `validation.schemas.client.ts` (client)           | 2 new schema files, 36 files updated                          | **Resolves audit T2**         |
| ✅ Clean | Type Safety | All remaining `as` casts replaced: `bioTabSchema.parse()`, `socialLinksSchema.parse()`, `joinedOwnerSchema`   | `bio/page.tsx`, `[username]/page.tsx`, `cashflow/actions.ts`  | Zero `as` casts remaining     |
| ✅ Clean | Type Safety | `isCustomThemeData()` type guard replaces `as CustomThemeData \| null` casts                                  | `bio/page.tsx`, `[username]/page.tsx`                         | Runtime validation            |
| ✅ Clean | Type Safety | `getTheme()` uses `isThemeId()` type guard instead of `as ThemeId` cast                                       | `theme.utils.ts`                                              | Validated theme lookup        |
| ✅ Clean | Type Safety | Reserved username check uses `.some()` instead of `.includes()` with cast                                     | `username.ts`                                                 | No cast needed                |
| ✅ Clean | Performance | **`select(*)` replaced with specific columns** across 9 pages                                                 | `bio/page.tsx`, `cashflow/page.tsx`, `settings/page.tsx`, etc | **Resolves audit P7**         |
| ✅ Clean | DB          | Analytics RPC `DEFAULT NULL` fix — `p_start_date` nullable in `get_analytics_chart_data` + `get_top_referers` | Migration file [NEW]                                          | Fixes generated TS types      |
| ✅ Clean | DB          | Both RPCs retain `SECURITY DEFINER` + `auth.uid()` ownership checks                                           | Migration SQL                                                 | Authorization preserved       |
| ✅ Clean | UX          | `StatsCard` uses Next.js `Link` instead of `<a>` for proper loading state integration                         | `StatsCard.tsx`                                               | Top loader triggers correctly |

> **@code-reviewer verdict:** This is the capstone day. The Zod schema split (`zod` for server, `zod/mini` for client) is the correct bundle-conscious approach. The `joinedOwnerSchema` pattern (`z.object().nullish().transform()`) for Supabase joined relations is particularly elegant — it replaces the last `as { user_id: string }` patterns. The `select(*)` cleanup across 9 pages eliminates unnecessary data transfer and reduces exposure surface. The analytics RPC migration is clean — `DEFAULT NULL` fixes the generated types while preserving the existing `IS NULL OR` guard logic. **Resolves audit items T2, P7.**

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

| ID    | Severity  | File                     | Issue                                                                                              | Fix                                      |
| :---- | :-------- | :----------------------- | :------------------------------------------------------------------------------------------------- | :--------------------------------------- |
| ✅ P1 | 🚨 High   | `analytics/actions.ts`   | ~~**4 sequential DB calls** in `getAnalyticsData` (chart → referer → topLinks → views)~~           | ✅ Fixed                                 |
| ✅ P1 | 🚨 High   | `analytics/actions.ts`   | ~~**4 sequential DB calls** in `getAnalyticsData` (chart → referer → topLinks → views)~~           | ✅ Fixed                                 |
| ✅ P2 | ⚠️ Medium | `bio/actions.ts`         | ~~`addLink` runs 2 sequential independent queries (sort_order + RPC)~~                             | ✅ Fixed                                 |
| P3    | ⚠️ Medium | `cashflow/actions.ts`    | `updateEntry` / `deleteEntry`: 3 sequential queries (entry → cashflow → share)                     | Join or RPC                              |
| ✅ P4 | ⚠️ Medium | `[username]/page.tsx`    | ~~**Profile queried twice** — once in `page()`, once in `generateMetadata()`~~                     | ✅ Fixed                                 |
| ✅ P5 | ⚠️ Medium | `cashflow/[id]/page.tsx` | ~~**Sequential queries** — fetches cashflow inside `Promise.all`, then awaits `share` separately~~ | ✅ Fixed                                 |
| ✅ P6 | 💡 Low    | `src/lib/data-cache.ts`  | ~~**Dead code** — `unstable_cache` helpers are defined but never used~~                            | ✅ Fixed                                 |
| P7    | 💡 Low    | 9 pages                  | `select('*')` over-fetches columns (profiles, links, cashflows, tickets)                           | Select only needed columns               |
| P8    | 🚨 High   | `cashflow_shares` (DB)   | **Missing `email` index** on `cashflow_shares` causes full sequential table scans for users        | `CREATE INDEX idx_cashflow_shares_email` |

### Code Quality & Security

| ID    | Severity    | File                  | Issue                                                                                       | Fix                                                                      |
| :---- | :---------- | :-------------------- | :------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------- |
| ✅ Q1 | ⚠️ Medium   | `cashflow/actions.ts` | ~~**Edit-permission logic duplicated 3x** across `addEntry`, `updateEntry`, `deleteEntry`~~ | ✅ Fixed                                                                 |
| ✅ Q2 | 💡 Low      | `share-actions.ts`    | ~~`updateShareRole` lacks App-level ownership check (DB trigger already protects this)~~    | ✅ Fixed                                                                 |
| ✅ Q3 | 💡 Low      | `cashflow/page.tsx`   | ~~Triple `as unknown as` casts — Supabase types mismatch~~                                  | ✅ Fixed                                                                 |
| Q4    | 🚨 Critical | Server Actions        | **No schema validation** on `FormData` processing, relying blindly on type casting          | Implement strict parsing (Valibot for Edge, or Zod 4)                    |
| Q5    | 🚨 Critical | `components/`         | **Component Data Leaks** — Risk of passing entire DB rows from Server to Client props       | Map strictly to DTOs in Client layers. NEVER pass raw DB rows to client. |

### Error Handling & Reliability

| ID    | Severity    | File                                  | Issue                                                                                       | Fix                                          |
| :---- | :---------- | :------------------------------------ | :------------------------------------------------------------------------------------------ | :------------------------------------------- |
| ✅ E1 | 🚨 High     | `cashflow/`, `support-admin/`, `app/` | ~~**Missing `error.tsx` boundaries** — only bio, settings, [username] have them~~           | ✅ Fixed (Consolidated shared boundaries)    |
| ✅ E2 | 🚨 High     | `cashflow/[id]/page.tsx`              | ~~**Unsafe non-null assertion** — `user.email!.toLowerCase()` will crash if email missing~~ | ✅ Fixed                                     |
| ✅ E3 | 💡 Low      | `(auth)/actions.ts` L106              | ~~`resetPassword` builds redirect URL from `origin` header — could be manipulated~~         | ✅ Fixed (Validated against allowed origins) |
| ✅ E4 | ⚠️ Medium   | `(auth)/actions.ts` L142              | ~~`checkUsernameAvailable` has NO rate limiting — active username enumeration risk~~        | ✅ Fixed                                     |
| ✅ E5 | 🚨 Critical | `(auth)/actions.ts`                   | ~~**Missing auth rate limiting** on `/login`, `/signup`, `/forgot-password`~~               | ✅ Fixed                                     |

### Accessibility & Configuration (A11y/Infra)

| ID    | Severity  | File           | Issue                                                                                    | Fix                                                       |
| :---- | :-------- | :------------- | :--------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| ✅ A1 | ⚠️ Medium | All Components | ~~**Missing ARIA attributes** — only 1 `aria-expanded` found in entire UI layer~~        | ✅ Fixed                                                  |
| ✅ A2 | 💡 Low    | `package.json` | ~~**Phantom dependency** — `@types/crypto-js` in devDeps but no `crypto-js` in deps~~    | ✅ Fixed                                                  |
| A3    | 💡 Low    | `components/`  | **Architectural Soup** — Relying purely on Atomic Design for _logic_ separation is weak. | Implement Hybrid: FSD for logic, Atomic for UI components |

### Type Safety

| ID    | Severity | File                                                         | Issue                                                                    | Fix                    |
| :---- | :------- | :----------------------------------------------------------- | :----------------------------------------------------------------------- | :--------------------- |
| ✅ T1 | 🚨 High  | `bio/actions.ts`, `cashflow/actions.ts`, `(auth)/actions.ts` | ~~**Unsafe casting** — `formData.get() as string` without null checks~~  | ✅ Fixed               |
| ✅ T2 | 💡 Low   | `bio/page.tsx`                                               | ~~`profile={{} as Profile}` for loading states lies to the type system~~ | ✅ Fixed               |
| ✅ T3 | 💡 Low   | `AppearanceEditor.tsx`                                       | ~~14 `as` casts, 2 unsafe `as unknown as Record`~~                       | ✅ Fixed (Zod schemas) |

### 🛠️ Pending Actions

| **A3** | Architecture: Refactor to Hybrid Atomic-FSD Design | 💡 Low | 🏗️ Enterprise Refactor |

### ✅ Resolved Actions

| ID         | Issue                                                                    | Severity        | Status                 |
| :--------- | :----------------------------------------------------------------------- | :-------------- | :--------------------- |
| ~~**P7**~~ | ~~Optimize `select(*)` over-fetching across 9 pages~~                    | ~~💡 Low~~      | ~~✅ Fixed~~           |
| ~~**A1**~~ | ~~Global ARIA/Accessibility Audit~~                                      | ~~⚠️ Medium~~   | ~~✅ Fixed~~           |
| ~~**Q5**~~ | ~~Component Data Leaks (Map API/DB returns to strict DTOs)~~             | ~~🚨 Critical~~ | ~~✅ Fixed~~           |
| ~~**E3**~~ | ~~Sanitize `origin` header in `resetPassword` redirect~~                 | ~~💡 Low~~      | ~~✅ Fixed~~           |
| ~~**P3**~~ | ~~Parallelize `updateEntry` / `deleteEntry` queries~~                    | ~~⚠️ Medium~~   | ~~✅ Fixed~~           |
| ~~**P8**~~ | ~~Add missing `email` index to `cashflow_shares`~~                       | ~~🚨 Critical~~ | ~~✅ Fixed (DB Only)~~ |
| ~~**E5**~~ | ~~Implement Upstash Rate Limiting on auth actions~~                      | ~~🚨 Critical~~ | ~~✅ Fixed~~           |
| ~~**Q4**~~ | ~~Install and enforce **Zod 4** validation for ALL actions~~             | ~~🚨 Critical~~ | ~~✅ Fixed~~           |
| ~~**T1**~~ | ~~Fix blind `as string` casts in `formData` (add `?.toString()`)~~       | ~~🚨 High~~     | ~~✅ Fixed~~           |
| ~~**E2**~~ | ~~Fix unsafe non-null assertion `user.email!` in cashflow route~~        | ~~🚨 High~~     | ~~✅ Fixed~~           |
| ~~**E1**~~ | ~~Smart Error Boundaries (Auth-Aware Recovery)~~                         | ~~🚨 High~~     | ~~✅ Fixed~~           |
| ~~**P1**~~ | ~~Optimize Analytics queries (Promise.all)~~                             | ~~🚨 High~~     | ~~✅ Fixed~~           |
| ~~**E4**~~ | ~~Rate limit `checkUsernameAvailable` endpoint~~                         | ~~⚠️ Medium~~   | ~~✅ Fixed~~           |
| ~~**P2**~~ | ~~Parallelize `addLink` queries~~                                        | ~~⚠️ Medium~~   | ~~✅ Fixed~~           |
| ~~**P6**~~ | ~~Modernize caching strategy ('use cache') & optimize static rendering~~ | ~~💡 Low~~      | ~~✅ Fixed~~           |
| ~~**P4**~~ | ~~Cache public profile query (prevent db double-fetch)~~                 | ~~⚠️ Medium~~   | ~~✅ Fixed~~           |
| ~~**P5**~~ | ~~Parallelize cashflow share query in Promise.all~~                      | ~~⚠️ Medium~~   | ~~✅ Fixed~~           |
| ~~**T3**~~ | ~~Fix 14 `as` casts in `AppearanceEditor.tsx` + type narrowing cleanup~~ | ~~💡 Low~~      | ~~✅ Fixed~~           |
| ~~**A2**~~ | ~~Uninstall phantom dependency `@types/crypto-js`~~                      | ~~💡 Low~~      | ~~✅ Fixed~~           |
| ~~**Q1**~~ | ~~Extract edit-permission helper logic~~                                 | ~~💡 Low~~      | ~~✅ Fixed~~           |
| ~~**Q2**~~ | ~~Add redundant ownership check to share roles~~                         | ~~💡 Low~~      | ~~✅ Fixed~~           |
| ~~**T2**~~ | ~~Fix TS lie: `profile={{} as Profile}`~~                                | ~~💡 Low~~      | ~~✅ Fixed~~           |
| ~~**T3**~~ | ~~Fix unsafe TS casts in `AppearanceEditor`~~                            | ~~💡 Low~~      | ~~✅ Fixed~~           |
| ~~**Q3**~~ | ~~Decouple generated types from manual helpers (CLI-Safe architecture)~~ | ~~💡 Low~~      | ~~✅ Fixed~~           |

### ⚠️ Missing Pillars (Unaudited, Tracked for March)

The following enterprise categories are completely missing from the codebase and therefore could not be audited. They must be implemented to reach production-grade maturity:

| Pillar                     | Verified 2026 Issue                                         | Enterprise Impact                                                            |
| :------------------------- | :---------------------------------------------------------- | :--------------------------------------------------------------------------- |
| ~~**Security Hardening**~~ | ~~Missing CSP (Content Security Policy) and HSTS headers~~  | ~~✅ Fixed (Mar 02) — `src/lib/csp.ts`, `proxy.ts`, `next.config.ts`~~       |
| **Linguistic Scale**       | Zero Internationalization (i18n) infrastructure             | Hard-coded strings prevent growth into non-English markets                   |
| **Env Integrity**          | No runtime validation of Environment Variables (Zod/T3-Env) | Potential runtime crashes or silent misconfigs due to missing/invalid `.env` |
| **Accessibility**          | Missing ARIA roles and keyboard navigation (WCAG 2.2)       | Legal risk and reduced user reach (Mandatory by April 2026)                  |
| **Modern Styling**         | Reliance on Media Queries over Container Queries & Subgrid  | Rigid components that don't scale well in complex FSD slices                 |
| **Runtime Perf**           | Server Actions not yet optimized for Edge Runtime           | Higher latency for global users vs. Edge-first architectures                 |
| **Automated Testing**      | Zero testing frameworks installed (Jest/Vitest, Playwright) | Regressions in business logic cannot be caught automatically                 |
| **CI/CD Pipelines**        | No automated deployment workflows (GitHub Actions)          | Code is deployed without pre-flight linting or type-checking                 |
| **Observability**          | No application-layer error tracking (Sentry/LogRocket)      | Server crashes and client exceptions fail silently in production             |
| **PWA Readiness**          | Missing `manifest.json` and service worker infrastructure   | No "Add to Home Screen" support—unacceptable for mobile-first apps           |
| ~~**Asset Optimization**~~ | ~~No AVIF support in `next.config.ts`~~                     | ~~✅ Fixed (Mar 02) — `formats: ['image/avif', 'image/webp']`~~              |
| **SEO & OpenGraph**        | Missing `generateMetadata` on core marketing/legal pages    | Search engine visibility and social shareability are bottlenecked            |

> [!NOTE]
> **Edge Security**: `src/proxy.ts` usage was verified via **Context7** as the correct Next.js 16 standard (replacing `middleware.ts`). The architectural finding has been retracted.

### What's Already Good ✅

- **XSS Mitigations** — no `dangerouslySetInnerHTML`. However, **requires validation** that user inputs like `href={userLink}` strictly sanitize protocol schemes (e.g., prevents `javascript:alert('pwned')`).
- **Admin client** only used in link redirect route (server-side, properly scoped)
- **Environment variables** — only `NEXT_PUBLIC_SUPABASE_URL` and publishable key exposed (safe)
- **Error boundaries** exist for bio, settings, and public profile pages
- **Auth helper** uses `getUser()` (server-verified) not `getSession()` (client-spoofable)
- **All actions** return consistent `{ error }` / `{ success }` shapes with `console.error`
- **URL validation** thorough with protocol + TLD checks (as long as it's enforced on ALL user inputs)
- **NPM Audit** — 14 vulnerabilities remaining (0 moderate, 14 high). Resolved moderate `ajv` ReDoS via `npm audit fix`. Remaining 14 are `minimatch` ReDoS in `devDependencies` (ESLint toolchain) — zero impact on production bundle.

> **[@code-reviewer note]**: The audit document was updated by `@code-reviewer` to reflect accurate severities, prioritizing Security > Stability > Performance > Code Quality. The list above is the true priority list required for an enterprise-ready release.

### ⚖️ Ranking Parameter Key

The priority ranking in the Matrix above is calculated based on **Severity vs. Effort**:

1. **Hierarchy**: **Security** (RLS/Auth) > **Stability** (Crashes/Boundaries) > **Performance** (DB Hits) > **TS Quality** (Casts).
2. **Prioritization Logic**:
   - **Priority 1**: High Severity + Low Effort (The "Quick Wins").
   - **Priority 2**: High Severity + High Effort (The "Critical Refactors").
   - **Priority 3**: Low Severity + Low Effort (The "Polishing").
   - **Priority 4**: Architecture/Long-term items (The "Enterprise Roadmap").

### 🔬 @tech-stack-researcher: Q4 Validation Strategy (2026)

**Verdict:** Stop bikeshedding and use **Zod 4**.

Your codebase currently has ZERO validation and blind `as string` casts. Worrying about Valibot's micro-optimizations in bundle size when your app trusts raw form data blindly is missing the forest for the trees. Furthermore, in Next.js Server Actions, validation runs on the _server_, making Valibot's client-side bundle size advantages largely irrelevant to your architecture.

**Zod 4 (Released 2025) vs Valibot:**

- **The Zod 4 Reality:** Zod 4 obliterated Valibot's main advantage. It introduced `@zod/mini` (sub-2KB gzipped), parses objects 6.5x faster, and crucially, compiles TypeScript 10x faster than Zod 3.
- **Developer Experience (DX):** Valibot's functional API (`v.string()`, `v.minLength()`) requires importing a dozen utility functions per schema—a miserable DX compared to Zod's fluent method chaining (`z.string().min(1)`). Since your team is relying on blind casts, you need the tool with the absolute lowest friction.
- **Recommendation:** Overwhelmingly **Zod 4**. It integrates flawlessly with your stack, has vastly improved TS inference speed, and its chaining API will actually encourage you to write schemas before a malicious payload nukes your Supabase DB.

---

## 🔎 @code-reviewer Assessment: Feb 23 Commits

**Status: Approved, but don't get complacent.**

I've rigorously stress-tested your Feb 23 commits. The fixes address critical tech debt around type safety, query parallelization, and edge-case crashes.

**The Good:**

- **Parallelization (P1, P2, P5):** You finally stopped waterfalling your DB calls. The `Promise.all` implementations are robust. You safely accounted for Supabase returning `{ error }` objects without throwing unhandled exceptions.
- **Form Data Hardening (T1):** Using fallback strings (`?.toString() || ''`) on `formData.get()` is bulletproof against 500 crashes. You're no longer blindly trusting that client input matches the type system.
- **Security (Q2):** The explicit ownership check in `updateShareRole` properly closes the authorization hole.
- **Profile Query Cache (P4):** Using React's `cache` for `getProfile` is exactly the right pattern in Next.js App Router to avoid duplicate DB hits in metadata generation.

**The "Trash":**

- **Band-Aids Aren't Solutions:** Your `?.toString()` fixes stop the application from visibly crashing, but that's a band-aid. You are still actively avoiding the real fix: **Zod validation (Q4)**. You need strict schema validation at the server action boundary, not just type forcing.
- **Zero Automated Tests:** You just refactored highly critical parallel queries and core auth actions, yet this codebase STILL has zero automated tests. The logic holds up to my static analysis today, but shipping these refactors without a test suite is playing with fire. Future PRs will inevitably break this.

**Verdict:** The fixes are technically sound, pass `next build` stress testing, and introduce no new bugs. They are merged. But prioritize Q4 (Zod) immediately before you build any more weak foundations.
