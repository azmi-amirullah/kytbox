# 🧪 Unified Testing Roadmap (August 2026)

Testing a moving target is a waste of time, but shipping a broken core is a waste of a product. We focus on **Security > Math Accuracy > Critical User Journeys**.

## 📊 Recommended Coverage Strategy

| Level | Target | Goal | Priority |
| :--- | :--- | :--- | :--- |
| **E2E (Playwright)** | Critical Paths | "Does the user succeed?" | 🔥 High |
| **Unit (Vitest)** | Pure Logic/Math | "is the math correct?" | 🔥 High |
| **Integration** | Server Actions | "Does DB sync work?" | 🟡 Medium |
| **Unit (UI)** | Components | "Does it look right?" | 🧊 Low |

---

## 🚀 Phase 1: Pre-Launch Stability (Completed Core)

### 1. Security & Data Integrity (Critical)
- [x] **Auth Setup**: Persist sessions between tests to avoid login spam (`tests/e2e/auth.setup.ts`).
- [x] **Protected Routes**: Verify `/bio`, `/cashflow`, `/list` redirect to `/login` when unauthenticated (`tests/e2e/security.test.ts`).
- [x] **Data Leak Prevention (DTOs)**: Unit tests for DTO mappers to ensure sensitive DB fields (hashes, raw IDs) never leak to client (`tests/unit/lib/mappers.test.ts`).
- [x] **Hierarchical Delete**: Verify that deleting a folder recursively cleans up links or orphan-checks them (`tests/e2e/folder-logic.test.ts`).

### 2. Cashflow Logic & Math (Critical)
- [x] **Math Engine**: Unit tests for projection logic (`tests/unit/features/cashflow-math.test.ts`).
- [x] **Budget Engine**: Tests for "Over Budget" vs "Maxed Out" status logic (`tests/unit/features/cashflow-budget.test.ts`).
- [x] **Date Filtering**: Verify edge cases for custom date ranges (`tests/unit/features/date-filter.test.ts`).

### 3. Core Product Lifecycles (High)
- [x] **Bio CRUD**: Create link/folder -> Edit -> Move -> Delete -> Verify Public visibility (`tests/e2e/bio.test.ts`).
- [x] **Nested Management**: Add, edit, delete, move, and drag-sort links *inside* folders -> Verify Public visibility (`tests/e2e/folder-logic.test.ts`).
- [x] **Support System (`tests/e2e/support.test.ts`)**: Create support ticket -> Verify user dashboard -> Send reply message -> Check `<SupportNotificationBell />` count & read state.
- [x] **Cashflow CRUD (`tests/e2e/cashflow.test.ts`)**: Create cashflow book -> Add Income/Expense entries -> Verify calculation math -> Test search bar & multi-criteria type/category filtering -> Cleanup test entries.
- [x] **List App E2E (`tests/e2e/list.test.ts`)**: Create Todo, Wishlist, Ideas -> Move cards across columns -> Sync done status.

### 4. Advanced Interaction & Analytics (Medium)
- [x] **Bio DnD & Scheduling (`tests/e2e/bio-advanced.test.ts`)**: Drag-and-drop reordering, link scheduling date boundaries, and country analytics aggregation.
- [x] **Visual Regression Baseline (`tests/e2e/visual-regression.test.ts`)**: Baseline screenshots for public profile, platform shell, cashflow details, and list boards.
- [x] **Export/Filter**: Apply date filter -> Verify table subset -> Trigger CSV export.

---

## 🛰️ Phase 2: Post-Production (Active Users)

Once the app is live with paying users, the strategy shifts from **"Does it work?"** to **"Is it still working at scale?"**

### 1. Observability (Sentry / LogSnag)
- **Error Tracking**: No more "silent failures". Every frontend/backend error must trigger an alert.
- **Performance Monitoring**: Track "Time to Interactive" for public profiles. If a profile takes >2s to load, users bounce.

### 2. Visual Regression Testing
- Use **Playwright Screenshots** to compare the UI before/after updates.
- **Goal**: Ensure a CSS change in the dashboard doesn't accidentally break the public profile layout.

### 3. Load & Stress testing
- Use tools like **Artillery** or **k6** to simulate 1,000 users hitting the public profiles at once.
- **Focus**: Does Supabase scale? Does the Edge Runtime caching hold up?

### 4. Zero-Downtime E2E
- Run E2E tests against the **Production** URL every hour (Smoke tests).
- Ensure core features (Login, Profile visibility) never go down without you knowing.

---

## 🛠️ Testing Standards (Ruthless)

1. **No Mocking the DB**: E2E tests MUST hit a real database (Supabase local or test branch).
2. **Clean Slate**: Every E2E test suite must include a cleanup phase or use unique `runId` tags.
3. **DTO Over Everything**: Never pass raw DB rows to the client. If it's not in the DTO, it shouldn't be in the test.
