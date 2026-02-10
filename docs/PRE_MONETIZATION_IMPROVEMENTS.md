# Pre-Monetization Improvements & Readiness

This document outlines the critical improvements and operational requirements needed **before** enabling payments. The goal is to ensure the product is polished, legally compliant, and architecturally ready for paid users.

> [!NOTE]
> **Documentation Strategy:** We are detailing these requirements **now**—even if some implementation happens later—so we clearly understand the "Why" behind our implementation order. Knowing why we wait is just as important as knowing what we build.
>
> **See Also:** [MONETIZATION.md](./MONETIZATION.md) for pricing, payment integration architecture, and the full implementation roadmap.

---

## 1. Bio Dashboard Architecture (UX Refactor)

### 1.1 Problem Analysis

The current `/bio` dashboard is a monolithic view (`DashboardClient.tsx`) combining analytics, link management, and appearance into a single component.

- **Scalability Risk:** Adding Pro features (SEO, Advanced Analytics) will make this unmanageable.
- **Performance Risk:** Re-rendering the entire dashboard for minor edits is inefficient.

> [!NOTE]
> **Current State:** The dashboard is still monolithic as of February 2026. This refactor is a prerequisite for implementing Pro feature tabs.

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

No schema changes required. Theme preferences are stored as individual columns on `profiles`:

- `theme_name` — Theme ID string (e.g., `'gradient'`, `'dark'`)
- `button_style` — Button fill style (e.g., `'solid'`, `'outline'`)
- `button_shape` — Button corner style (e.g., `'rounded'`, `'square'`)

---

## 3. Operational Readiness (Critical)

**We cannot accept money without these legal and support structures.**

### 3.1 Legal Compliance

Merchant of Record (Lemon Squeezy) requires these pages to be publicly accessible:

- [ ] **Terms of Service:** Define acceptable use, cancellation policy, and liability.
- [ ] **Privacy Policy:** GDPR/CCPA compliance statement.
- [ ] **Refund Policy:** Explicit rules (e.g., "14-day money-back guarantee").

### 3.2 Support Infrastructure (Internal Ticket System)

Paid users expect priority support. Email is messy and hard to track. We will build a **lightweight internal ticket system** (doubles as the "Contact Us" feature for all users).

**Why Internal?**

- Keeps users on the platform.
- Allows us to track "Urgency" programmatically.
- No need to pay for Intercom/Zendesk yet.
- Admin dashboard can sort by "Paid User" + "Urgency".

> [!WARNING]
> **YAGNI Check:** This system is planned for when we have paying users. If launch volume is low (< 50 tickets/month), consider starting with a simple email funnel and migrating to this system when ticket volume justifies it.

#### 3.2.1 User Experience

1. **Submit Ticket:** Simple form (Subject, Message, Category) in `/app/support`.
2. **Urgency Bump:** Users can click a "Bump Urgency" button once every 24 hours.
   - _Logic:_ `urgency_score = (days_waiting * 1) + (bumps * 10)`
   - _Constraint:_ 1 bump per 24h window.

#### 3.2.2 Admin Experience

- **Queue View:** List of open tickets.
- **Sorting:** Sort by `urgency_score` desc.
- **Action:** Reply (sends email notification), Resolve, or Ignore.

#### 3.2.3 Data Model

```sql
create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  subject text not null,
  message text not null,
  category text not null default 'general'
    check (category in ('general', 'bug', 'billing', 'feature_request', 'account')),
  status text default 'open'
    check (status in ('open', 'resolved', 'closed')),
  urgency_score int default 0,
  last_bumped_at timestamptz,
  created_at timestamptz default now()
);
```

---

## 4. Technical Foundations for Monetization

Before integrating the payment provider, we must prepare the application core.

### 4.1 The "User Tier" System

**Schema Update:**

```sql
alter table profiles add column tier text not null default 'free'
  check (tier in ('free', 'pro'));
alter table profiles add column subscription_status text not null default 'none';
```

**Rationale:** Front-end components should never query the billing database directly. They should check `profile.tier`. The sync between `subscriptions` and `profiles.tier` is handled by a database trigger — see [MONETIZATION.md § 3.3](./MONETIZATION.md#33-the-ispro-check-performance) for the full trigger implementation.

### 4.2 Feature Flag Utility

Create a centralized utility to manage feature access. Uses a feature map for easy extension.

```typescript
// lib/permissions.ts
const PRO_FEATURES = [
  'custom_theme',
  'remove_branding',
  'custom_domain',
  'advanced_analytics',
] as const;

type ProFeature = (typeof PRO_FEATURES)[number];

const FEATURE_ACCESS: Record<ProFeature, string[]> = {
  custom_theme: ['pro'],
  remove_branding: ['pro'],
  custom_domain: ['pro'],
  advanced_analytics: ['pro'],
};

export function canAccess(tier: string, feature: ProFeature): boolean {
  return FEATURE_ACCESS[feature]?.includes(tier) ?? false;
}
```

---

## 5. Implementation Roadmap

### Phase 1: Architecture & UX (Immediate)

1.  **Tab System:** Refactor Bio Dashboard layout.
2.  **Appearance:** Implement auto-save and categories.

### Phase 2: Operational (Before Lemon Squeezy Integration)

1.  **Legal Pages:** Add `/terms`, `/privacy`, and `/refund`.
2.  **Support System:** Build `/app/support` (User) and `/admin/support` (Admin).

### Phase 3: Monetization Core

1.  **Schema:** Run migrations for `subscriptions` and `profiles.tier`.
2.  **Integration:** Connect Lemon Squeezy API (see [MONETIZATION.md](./MONETIZATION.md)).

---

## 6. Priority Checklist

- [ ] **High:** Refactor Bio Dashboard to Tabs (UX Scalability).
- [ ] **High:** Create Legal Pages (Compliance).
- [ ] **High:** Build Internal Support System (Critical for Trust).
- [ ] **High:** Add `tier` column to schema (Architecture).
- [ ] **Medium:** Auto-save for appearance.
- [ ] **Low:** Advanced empty states.

_Last Updated: February 2026_
