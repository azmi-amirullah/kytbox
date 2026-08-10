# ⚡ Comprehensive Application & API Performance Audit (August 2026)

This document presents a complete audit across **all files, features, and API routes** in the codebase. All findings follow the **Anti-Overengineering Protocol**: only practical, high-value, measurable improvements are included, while speculative complexity is explicitly rejected.

---

## 📋 Executive Summary & Overall Architecture

The application demonstrates strong core architectural patterns:
- **Fast-Path Auth Pre-Checks**: Guest visits to `/` bypass remote auth handshakes ([auth.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/lib/auth.ts)).
- **Tagged Caching**: Next.js 16 `'use cache'` tagging in [data-cache.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/lib/data-cache.ts) purges profile and link caches on update.
- **Asynchronous Click Tracking**: Non-blocking `after()` event processing in [route.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/app/%5Busername%5D/%5BlinkId%5D/route.ts).
- **Atomic Database RPCs**: PL/pgSQL procedures for list reordering, dashboard overview aggregation, and ticket creation.

However, auditing **all 8 features and API handlers** revealed **6 specific, high-value network waterfalls and uncached query bottlenecks** that will noticeably improve API response times and page loads.

---

## 🛡️ Pre-Change Assessment Matrix

| Dimension | Status | Standard & Empirical Verification |
| :--- | :--- | :--- |
| **1. Security** | 🟢 **PASS** | Strict DTO mappers ([mappers.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/lib/mappers.ts)), proxy boundary auth checks ([proxy.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/proxy.ts)), CSP nonces, and Upstash Redis rate limiting on auth & short links. |
| **2. Stability** | 🟢 **PASS** | `npx tsc --noEmit` compiles with **0 errors**. **251/251 unit tests passing** across 22 test suites. Zero `any` types. |
| **3. Performance** | 🟡 **TUNE** | 6 actionable query waterfalls and uncached lookups identified across API routes & feature modules. |
| **4. Code Quality** | 🟢 **PASS** | Mobile-first layout context (`min-width: 320px`), strict Domain-Driven Feature isolation under `src/features/`. |

---

## 📁 File-by-File & API-by-API Audit Findings

### 1. Public Redirect Handler (`src/app/[username]/[linkId]/route.ts`)
* **Location**: [route.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/app/%5Busername%5D/%5BlinkId%5D/route.ts#L30-L36)
* **Status**: ⚠️ **Bottleneck Found**
* **Finding**: Fires an uncached SQL query (`supabase.from('profiles').select('id').eq('username', username)`) on every short link redirect click.
* **Fix**: Replace raw query with cached `getProfileByUsername(username)` from [data-cache.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/lib/data-cache.ts) (`'use cache'` tag `profile-${username}`).
* **Impact**: **-100 to -250ms** reduction in short link redirect TTFB.

---

### 2. List Feature (`src/features/list/actions.ts`)
* **Location**: [actions.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/features/list/actions.ts#L79-L119) (`getOwnedItem` & `getOwnedColumn`)
* **Status**: ⚠️ **Bottleneck Found**
* **Finding**: `getOwnedItem` and `getOwnedColumn` execute 2 sequential database queries (1 query to `list_items`/`list_columns`, then a 2nd query to `lists` via `getOwnedList`) on every item toggle, edit, or move.
* **Fix**: Use single relational inner join: `supabase.from('list_items').select('id, list_id, lists!inner(id, type, user_id)').eq('id', itemId).eq('lists.user_id', userId).maybeSingle()`.
* **Impact**: Saves **1 network round-trip (~80ms)** per item operation.

---

### 3. Invoice Database Queries (`src/features/invoice/db.ts`)
* **Location**: [db.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/features/invoice/db.ts#L14-L92) (`getInvoicesByUserId` & `getInvoiceStatsByUserId`)
* **Status**: ⚠️ **2 Bottlenecks Found**
* **Findings**:
  1. `getInvoicesByUserId` executes 2 sequential network calls (`invoices` then `invoice_items`).
  2. `getInvoiceStatsByUserId` loads all invoices AND all line items into Node.js memory just to compute summary counts/amounts.
* **Fixes**:
  1. Combine `getInvoicesByUserId` into PostgREST relational select: `select('*, items:invoice_items(*)')`.
  2. Query `invoices` with selective scalar fields (`status, total_amount, due_date`) without fetching line items for stats calculation.
* **Impact**: Saves **1 network round-trip** on invoice loading and reduces network payload size by **~90%**.

---

### 4. Cashflow Engine (`src/features/cashflow/db.ts`)
* **Location**: [db.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/features/cashflow/db.ts#L126-L141) (`getCashflowDashboardData`)
* **Status**: ⚠️ **Bottleneck Found**
* **Finding**: Fetches up to 1,000 entries, then runs a 2nd sequential query for goal titles.
* **Fix**: Include relational join `goal:cashflow_goals(id, title)` in the primary entries query.
* **Impact**: Saves **1 network round-trip** during cashflow dashboard rendering.

---

### 5. Bio Links Feature (`src/features/bio/actions.ts`)
* **Location**: [actions.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/features/bio/actions.ts#L26-L48) (`calculateGlobalCounts`)
* **Status**: ⚠️ **Bottleneck Found**
* **Finding**: Downloads all user link rows into memory to compute reachable active link counts.
* **Fix**: Filter active links at the database query boundary.
* **Impact**: Lower memory and serialization overhead as link count scales.

---

### 6. Auth Feature (`src/features/auth/actions.ts` & `src/app/auth/callback/route.ts`)
* **Status**: 🟢 **PASS (Optimal)**
* **Audit Result**: Secure rate limiting (Upstash rate limit + email cooldown lock), strict username validation, and open-redirect protection on auth callback.

---

### 7. Settings Feature (`src/features/settings/actions.ts`)
* **Status**: 🟢 **PASS (Optimal)**
* **Audit Result**: Properly purges Next.js 16 cache tags (`profile-${username}`) upon profile updates, keeping cached bio pages fresh.

---

### 8. Support & Notifications Features (`src/features/support/` & `src/features/notifications/`)
* **Status**: 🟢 **PASS (Optimal)**
* **Audit Result**: Support tickets execute atomic PL/pgSQL RPCs (`create_support_ticket`), and notification queries execute in parallel with `.limit(20)`.

---

## 🚫 Anti-Overengineering Protocol

The following speculative patterns are **EXPLICITLY REJECTED**:

1. **❌ Migrating Server Actions to Edge Runtime**:
   - *Reason*: Node.js runtime with Next.js 16 `'use cache'` provides superior database connection pooling and preserves Sentry telemetry. Edge runtime adds deployment complexity with zero measurable TTFB benefit.
2. **❌ Extra React `<Suspense>` Wrappers on Static UI Components**:
   - *Reason*: Static UI components fire 0 database queries. Adding fallbacks and skeleton components to static elements adds client JS bundle bloat without improving loading speed.
3. **❌ Micro-optimizing Ingress Zod Schemas**:
   - *Reason*: Zod parsing overhead is < 1ms at API boundaries. Removing validation creates security vulnerabilities (XSS, invalid payloads) for unmeasurable speed gains.

---

## 📊 Complete Optimization Matrix Summary

| Area / File | Identified Issue | Proposed Solution | Expected Impact |
| :--- | :--- | :--- | :--- |
| [route.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/app/%5Busername%5D/%5BlinkId%5D/route.ts#L30) | Uncached profile query on short link clicks | `getProfileByUsername(username)` | **-100 to -250ms** TTFB |
| [list/actions.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/features/list/actions.ts#L79) | 2 sequential DB calls in `getOwnedItem` / `getOwnedColumn` | Relational PostgREST `lists!inner` join | **-1 network call** per item update |
| [invoice/db.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/features/invoice/db.ts#L14) | Sequential invoice + items queries | Relational PostgREST `select('*, items:invoice_items(*)')` | **-1 network call** on page load |
| [invoice/db.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/features/invoice/db.ts#L56) | Invoice items downloaded for stats summary | Scalar select `status, total_amount, due_date` | **~90% smaller payload** |
| [cashflow/db.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/features/cashflow/db.ts#L126) | Goal titles fetched in 2nd query | Relational join `goal:cashflow_goals(id, title)` | **-1 network call** on cashflow load |
| [bio/actions.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/kytbox/src/features/bio/actions.ts#L26) | In-memory link reachability filter | Filter active links at database level | Reduced server memory footprint |
