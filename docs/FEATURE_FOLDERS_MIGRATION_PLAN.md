# 🏗️ Domain-Driven Feature Folders Migration Plan

This document establishes the architectural blueprint, strict boundaries, and checklist for refactoring the codebase from a colocated App Router layout into a highly scalable, developer-friendly **Domain-Driven Feature Folders** architecture optimized for Next.js 16.

---

## 🎯 Architecture Mapping

The architecture strictly divides code into three main categories: Routing (thin entryways), Features (isolated business domains), and Shared (generic components and libraries).

### System Diagram

```
┌────────────────────────────────────────────────────────┐
│                      src/app/                          │  ◄── Routing & Layout Layer
│        (Thin pages, routing-only layout/loaders)       │      (No inline complex JSX/states/DB calls)
└───────────────────────────┬────────────────────────────┘
                            │ (Imports features & UI kit)
┌───────────────────────────▼────────────────────────────┐
│                    src/features/                       │  ◄── Feature Domain Layer
│   (Self-contained slices: UI, actions, db, schemas)   │      (STRICT: No cross-feature imports)
└───────────────────────────┬────────────────────────────┘
                            │ (Imports shared elements)
┌───────────────────────────▼────────────────────────────┐
│         src/components/ui/ & src/lib/ (Shared)         │  ◄── Shared Layer (Domain-Agnostic)
│   (Generic styled primitives & database/utility code)   │      (Zero knowledge of features)
└────────────────────────────────────────────────────────┘
```

### Layer Definitions

| Layer | Path | Responsibility |
| :--- | :--- | :--- |
| **Routing / Layout** | `src/app/` | Routing endpoints, layouts, metadata, and dynamic routing parameters. Imports features and UI components. Zero direct DB calls. |
| **Feature Slices** | `src/features/[feature]/` | Self-contained domain folders (e.g. `auth`, `cashflow`, `bio`, `list`). Contains UI components, Server Actions, DB queries, validation schemas, and types for that domain. |
| **Shared UI Kit** | `src/components/ui/` | Reusable, stateless, domain-agnostic UI primitives (e.g., buttons, inputs, dialogs) structured in a flat, Shadcn-like pattern. |
| **Shared Lib / Config** | `src/lib/` & `src/config/` | Domain-agnostic helpers, database clients, generic middlewares, and global system utilities. |

---

## 🔒 Feature Slice Anatomy

To avoid folder clutter and maintain high cohesion, each feature in `src/features/[feature]/` should follow a standard layout:

```text
src/features/[feature]/
├── components/          # React Components (both Server Components and Client Components)
├── actions.ts           # 'use server' - Mutations and form entry points
├── db.ts                # 'server-only' - Direct Database / Supabase read queries
├── schemas.client.ts    # Client-side validation schemas (using @zod/mini)
├── schemas.server.ts    # Server-side validation schemas & DTO mappers (using full Zod)
├── types.ts             # TS interfaces and DTO definitions
└── index.ts             # Public API entry point for the feature
```

### 1. Data Security & DTOs
- Never pass raw DB/API rows to Client Components. Convert entities to explicit DTOs in `db.ts` or `schemas.server.ts` before serialization.
- Code containing database queries must be marked with `import 'server-only'`.

### 2. Validation Schema Splitting
- **`schemas.client.ts`**: Lightweight validation schemas imported by forms in client components. Uses `@zod/mini`.
- **`schemas.server.ts`**: Heavy schemas for API requests, server action payload validation, and database mapping. Uses full `zod`.

---

## 🚫 Strict Boundary Rules

To prevent architectural decay, the boundary plugin enforces these rules:
1. **No Cross-Feature Imports**: Code in `src/features/cashflow` must never import from `src/features/list`. Shared domains go in `shared/` or remain fully isolated.
2. **Unidirectional Flow**:
   - `app` can import from `features`, `components/ui`, and `lib`.
   - `features` can import only from their own slice, `components/ui`, and `lib`.
   - `components/ui` and `lib` can **never** import from `features` or `app`.

---

## 📅 Step-by-Step Migration Checklist

### Phase 1: Foundation & Lint Infrastructure
- [x] Verify path alias mapping `@/*` -> `./src/*` exists in `tsconfig.json`.
- [x] Install `eslint-plugin-boundaries` in the workspace.
- [x] Verify root `src/proxy.ts` is configured correctly enforcing CSP/HSTS.
- [x] Configure ESLint boundaries in `eslint.config.mjs`.
- [x] Verify build compiles: `npm run build`.

### Phase 2: Auth Feature
- [x] Create `src/features/auth/` directory.
- [x] Suffix auth validation schemas: `schemas.client.ts` (@zod/mini), `schemas.server.ts` (full Zod).
- [x] Move login and signup form components from `src/app/(auth)/` and `src/app/update-password/` into `src/features/auth/components/`. Mark them with `'use client'`.
- [x] Move authentication actions to `src/features/auth/actions.ts`.
- [x] Convert route pages in `src/app/(auth)/` and `src/app/update-password/` to thin composition layouts rendering components from `src/features/auth/`.
- [x] Run validation tests to confirm auth flows are intact.

### Phase 3: Cashflow Feature
- [x] Create `src/features/cashflow/` directory.
- [x] Move cashflow-specific calculations from `src/lib/cashflow-math.ts` to `src/features/cashflow/lib/math.ts` or `src/features/cashflow/math.ts`.
- [x] Move components from `src/app/(platform)/cashflow/components/` into `src/features/cashflow/components/`.
- [x] Move cashflow data fetching and DB queries into `src/features/cashflow/db.ts` (marked with `server-only`).
- [x] Convert `src/app/(platform)/cashflow/page.tsx` into a thin wrapper rendering `CashflowDashboard` from the features layer.
- [x] Verify Vitest math suites and E2E cashflow flows compile and pass.

### Phase 4: Bio Links Feature
- [x] Create `src/features/bio/` directory.
- [x] Move bio-rendering components from `src/app/(platform)/bio/` and `src/app/[username]/` into `src/features/bio/components/`.
- [x] Colocate link CRUD database queries in `src/features/bio/db.ts` with strict DTO mappings to prevent private draft link leaks.
- [x] Convert `src/app/(platform)/bio/page.tsx` and public routing `src/app/[username]/page.tsx` to thin page components.
- [x] Test public profile layout and link ordering functionality.

### Phase 5: List Manager Feature
- [x] Create `src/features/list/` directory.
- [x] Move list and kanban components from `src/app/(platform)/list/components/` into `src/features/list/components/`.
- [x] Move list database actions and column mutation handlers into `src/features/list/actions.ts` & `src/features/list/column-actions.ts`.
- [x] Convert `src/app/(platform)/list/page.tsx` into a thin page.
- [x] Verify lists, boards, and ideas still load correctly.

### Phase 6: Settings & Support Features
- [x] Create `src/features/settings/` and `src/features/support/`.
- [x] Move setting forms, profile updates, and support ticket creation logic out of route components.
- [x] Delete empty legacy folders under `src/app/` and root `components/`.
- [x] Run final compilation build: `npm run build`.

---

## 🧪 Verification Protocol

Every PR implementing a phase of this migration **must** execute and pass the following validations. No exceptions.

```bash
# 1. Clear typescript compiler checks
npx tsc --noEmit

# 2. Verify all unit tests (Vitest)
npm run test

# 3. Run full E2E suites (Playwright)
npm run test:e2e

# 4. Confirm clean production build compilation
npm run build
```
