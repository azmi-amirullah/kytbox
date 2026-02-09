# Pre-Monetization Improvements & Readiness

This document outlines the critical improvements and operational requirements needed **before** enabling payments. The goal is to ensure the product is polished, legally compliant, and architecturally ready for paid users.

> [!NOTE]
> **Documentation Strategy:** We are detailing these requirements **now**—even if some implementation happens later—so we clearly understand the "Why" behind our implementation order. Knowing why we wait is just as important as knowing what we build.

---

## 1. Bio Dashboard Architecture (UX Refactor)

### 1.1 Problem Analysis

The current `/bio` dashboard is a monolithic view combining analytics, link management, and appearance.

- **Scalability Risk:** Adding Pro features (SEO, Advanced Analytics) will make this unmanageable.
- **Performance Risk:** Re-rendering the entire dashboard for minor edits is inefficient.

### 1.2 Solution: Tab-Based Architecture

Restructure the Bio Dashboard into isolated contexts using URL-driven state (`?tab=links`).

| Tab scope           | Components                   | State Strategy                     |
| :------------------ | :--------------------------- | :--------------------------------- |
| **Links** (Default) | `LinkManager`, `StatsBar`    | Real-time updates (Server Actions) |
| **Appearance**      | `ThemePicker`, `StyleEditor` | Debounced auto-save                |
| **Settings**        | `SeoEditor` (Pro), `Config`  | Form-based submission              |

**Technical Implementation:**

- Maintain `PhonePreview` as a **layout-level persistent component** to prevent unmounting during tab switches.
- Use `shadcn/tabs` syncing with `searchParams` for rigorous deep-linking support.

### 1.3 Architecture Decision Record: Tabs vs Sidebar

**Decision:** Use **Tabs** within the left editor column.
**Alternative Considered:** Adding a left-side navigation sidebar.
**Rationale:**

- A sidebar typically consumes ~250px of horizontal width.
- On standard laptops (1366px or 1440px), `Sidebar (250px) + Editor (600px) + Preview (400px)` exceeds the viewport.
- **The Live Preview is our Killer Feature.** It must _never_ be hidden or squashed.
- Tabs preserve the 2-column layout, ensuring the Preview remains visible on all desktop sizes.

---

## 2. Appearance Editor Enhancement

### 2.1 UX Improvements

- **Visual Hierarchy:** Group themes by category (Solid vs Gradient).
- **Free Themes (Auto-Save):** Remove "Save" button. Implement `useDebounce` (1000ms) to auto-save changes.
- **Pro Themes (Try Before Buy):**
  - **Preview:** Clicking a locked theme updates the preview _instantly_ (Optimistic UI).
  - **No Auto-Save:** Does _not_ save to database.
  - **Upgrade Trigger:** If the user tries to navigate away or "Publish", show the Upgrade Modal.

### 2.2 Data Model Impact

No schema changes required. Theme preferences continue to be stored in `profiles.theme_config` JSONB column.

---

## 3. Operational Readiness (Critical)

**We cannot accept money without these legal and support structures.**

### 3.1 Legal Compliance

Merchant of Record (Lemon Squeezy) requires these pages to be publicly accessible:

- [ ] **Terms of Service:** Define acceptable use, cancellation policy, and liability.
- [ ] **Privacy Policy:** GDPR/CCPA compliance statement.
- [ ] **Refund Policy:** Explicit rules (e.g., "14-day money-back guarantee").

### 3.2 Support Infrastructure

Paid users expect support.

- [ ] **Support Channel:** Email alias (`support@ukit.com`) or Intercom/Crisp widget.
- [ ] **Documentation:** Public help center for common issues (Domain setup, Billing).

---

## 4. Technical Foundations for Monetization

Before integrating the payment provider, we must prepare the application core.

### 4.1 The "User Tier" System

**Schema Update:**

```sql
alter table profiles add column tier text default 'free' check (tier in ('free', 'pro'));
alter table profiles add column subscription_status text default 'none';
```

**Rationale:** Front-end components should never query the billing database directly. They should check `profile.tier`.

### 4.2 Feature Flag Utility

Create a centralized utility to manage feature access.

```typescript
// lib/permissions.ts
export const canAccess = (
  tier: string,
  feature: 'custom_domain' | 'remove_branding',
) => {
  if (tier === 'pro') return true;
  return false;
};
```

---

## 5. Implementation Roadmap

### Phase 1: Architecture & UX (Immediate)

1.  **Tab System:** Refactor Bio Dashboard layout.
2.  **Appearance:** Implement auto-save and categories.

### Phase 2: Operational (Before Stripe/Lemon Squeezy)

1.  **Legal Pages:** Add `/terms` and `/privacy`.
2.  **Support:** Set up support email reception.

### Phase 3: Monetization Core

1.  **Schema:** Run migrations for `subscriptions` and `profiles`.
2.  **Integration:** Connect Lemon Squeezy API.

---

## 6. Priority Checklist

- [ ] **High:** Refactor Bio Dashboard to Tabs (UX Scalability).
- [ ] **High:** Create Legal Pages (Compliance).
- [ ] **High:** Add `tier` column to schema (Architecture).
- [ ] **Medium:** Auto-save for appearance.
- [ ] **Low:** Advanced empty states.

_Last Updated: February 2025_
