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

Full codebase scan: 8 server action files, 2 API routes, auth helpers, admin client, public routes, all components.

### Performance

| ID  | Severity  | File                   | Issue                                                                                | Fix                                    |
| :-- | :-------- | :--------------------- | :----------------------------------------------------------------------------------- | :------------------------------------- |
| P1  | 🚨 High   | `analytics/actions.ts` | **4 sequential DB calls** in `getAnalyticsData` (chart → referer → topLinks → views) | `Promise.all()` — est. 4x speedup      |
| P2  | ⚠️ Medium | `bio/actions.ts`       | `addLink` runs 2 sequential independent queries (sort_order + RPC)                   | `Promise.all()`                        |
| P3  | ⚠️ Medium | `cashflow/actions.ts`  | `updateEntry` / `deleteEntry`: 3 sequential queries (entry → cashflow → share)       | Join or RPC                            |
| P4  | ⚠️ Medium | `[username]/page.tsx`  | **Profile queried twice** — once in `page()`, once in `generateMetadata()`           | Use `cache()` wrapper or request dedup |
| P5  | 💡 Low    | 9 pages                | `select('*')` over-fetches columns (profiles, links, cashflows, tickets)             | Select only needed columns             |

### Code Quality

| ID  | Severity  | File                  | Issue                                                                                   | Fix                                    |
| :-- | :-------- | :-------------------- | :-------------------------------------------------------------------------------------- | :------------------------------------- |
| Q1  | ⚠️ Medium | `cashflow/actions.ts` | **Edit-permission logic duplicated 3x** across `addEntry`, `updateEntry`, `deleteEntry` | Extract `checkEditPermission()` helper |
| Q2  | ⚠️ Medium | `share-actions.ts`    | `updateShareRole` has **no ownership check** (unlike `inviteUser`)                      | Add explicit ownership verification    |
| Q3  | 💡 Low    | `cashflow/page.tsx`   | Triple `as unknown as` casts — Supabase types mismatch                                  | Fix types or use `.returns<T>()`       |

### Error Handling

| ID  | Severity  | File                                  | Issue                                                                           | Fix                                    |
| :-- | :-------- | :------------------------------------ | :------------------------------------------------------------------------------ | :------------------------------------- |
| E1  | ⚠️ Medium | `cashflow/`, `support-admin/`, `app/` | **Missing `error.tsx` boundaries** — only bio, settings, [username] have them   | Add error boundaries                   |
| E2  | 💡 Low    | `(auth)/actions.ts` L106-108          | `resetPassword` builds redirect URL from `origin` header — could be manipulated | Validate against allowed origins       |
| E3  | 💡 Low    | `(auth)/actions.ts` L142              | `checkUsernameAvailable` has no rate limiting — enumeration risk                | Add rate limit or debounce server-side |

### Type Safety

| ID  | Severity | File                                                         | Issue                                                                |
| :-- | :------- | :----------------------------------------------------------- | :------------------------------------------------------------------- |
| T1  | 💡 Low   | `bio/actions.ts`, `cashflow/actions.ts`, `(auth)/actions.ts` | `formData.get() as string` without null checks (~15 occurrences)     |
| T2  | 💡 Low   | `bio/page.tsx`                                               | `profile={{} as Profile}` for loading states lies to the type system |
| T3  | 💡 Low   | `AppearanceEditor.tsx`                                       | 14 `as` casts, 2 unsafe `as unknown as Record`                       |

### What's Already Good ✅

- **Zero XSS vectors** — no `dangerouslySetInnerHTML` anywhere in the codebase
- **Admin client** only used in link redirect route (server-side, properly scoped)
- **Environment variables** — only `NEXT_PUBLIC_SUPABASE_URL` and publishable key exposed (safe)
- **Error boundaries** exist for bio, settings, and public profile pages
- **Auth helper** uses `getUser()` (server-verified) not `getSession()` (client-spoofable)
- **All actions** return consistent `{ error }` / `{ success }` shapes with `console.error`
- **URL validation** thorough with protocol + TLD checks
- **Cashflow page** already uses `Promise.all` for parallel queries

### Fix Priority

1. **P1** — Parallelize analytics queries (biggest user-facing speedup)
2. **Q1** — Extract edit-permission helper (reduce 45 lines duplication)
3. **Q2** — Add ownership check to `updateShareRole` (defense in depth)
4. **E1** — Add missing error boundaries (crash resilience)
5. **P2** — Parallelize `addLink` queries (minor speed win)
6. **P4** — Cache public profile query (avoid double fetch)
7. **E2, E3, T1-T3, P5** — Low priority polish
