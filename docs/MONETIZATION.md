# Kytbox Monetization Strategy & Architecture

This document defines the monetization model, pricing strategy, and technical architecture for Kytbox.

> [!IMPORTANT]
> **Core Philosophy:** Free users get a fully functional product. Pro users pay for **advanced power**, **custom branding**, and **higher limits**.
> **Strategic Pivot (Feb 2025):** We use a **Merchant of Record (MoR)** strategy to avoid global tax liability.
>
> **STATUS UPDATE (Feb 2026):** Implementation of this monetization architecture is currently **ON HOLD**. The team is prioritizing core product features (Bio Editor, Auto-save, etc.) before introducing payment gates. All schema migrations and integrations below are deferred.

---

## 1. Competitor Analysis

### 1.1 Link-in-Bio Market

| Platform   | Free Links   | Free Analytics | Free Themes   | Pro Price | Primary Pro Gate                  |
| ---------- | ------------ | -------------- | ------------- | --------- | --------------------------------- |
| Linktree   | Unlimited    | Basic          | Basic         | $9/mo     | Branding, advanced analytics, SEO |
| Beacons    | Unlimited    | Basic          | Full          | $10/mo    | 9% tx fee removal, custom domain  |
| Stan Store | No free plan | —              | —             | $29/mo    | Pure SaaS model                   |
| Lnk.Bio    | Unlimited    | Basic          | 442 templates | $0.99/mo  | Cheap upsell                      |
| Direct.me  | Unlimited    | Full           | Full          | $5-15/mo  | Custom domain                     |

**Key Insight:** Industry standard is **unlimited links for free**. Competitors gate on branding removal, analytics depth, and custom domains.

### 1.2 Personal Finance Market

| Platform  | Free Tier | Key Limits                     | Pro Price | User Sentiment                 |
| --------- | --------- | ------------------------------ | --------- | ------------------------------ |
| Splitwise | Yes       | 3-4 expenses/day, 10s cooldown | $4.99/mo  | Negative (Reddit backlash)     |
| YNAB      | No        | 34-day trial only              | $14.99/mo | Accepted (premium positioning) |
| Toshl     | Yes       | 2 accounts, 200 entries/month  | $2.99/mo  | Mixed                          |

**Key Insight:** Aggressive limits (Splitwise-style) cause user backlash. Entry limits feel punitive.

---

## 2. Kytbox Pricing Tiers

### Launch Pricing (Early Adopter)

| Plan        | Launch Price | Notes                               |
| ----------- | ------------ | ----------------------------------- |
| Free        | $0           | Always free                         |
| Pro Monthly | **$2/month** | Break-even anchor (covers fees)     |
| Pro Annual  | **$10/year** | **Strategic Focus** (5 months free) |

### Pricing Strategy Rationale

1.  **The $2 Floor:** We set the monthly price to $2 to cover Merchant of Record (MoR) fees (~60¢) and ensure profitability. $1/mo is not viable with MoR fees.
2.  **Annual Incentive:** The $10/year plan is the primary growth driver. It offers massive value to users (equivalent to $0.83/mo) while minimizing transaction fees (one charge vs twelve).
3.  **Merchant of Record (MoR):** We use **Lemon Squeezy** instead of Stripe to handle global tax compliance (VAT, Sales Tax) automatically.

### Why Merchant of Record (MoR)?

We chose Lemon Squeezy (MoR) over Stripe (Payment Processor) for one critical reason: **Liability.**

| Feature                  | Stripe (Standard)                                                                                                            | Lemon Squeezy (MoR)                                     |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| **Who is the Merchant?** | **YOU** are the merchant.                                                                                                    | **Lemon Squeezy** is the merchant.                      |
| **Sales Tax / VAT**      | You are liable. You must register, calculate, and file taxes in every jurisdiction (UK, EU, US States) where you meet nexus. | LS handles collection, filing, and remittance globally. |
| **Fee**                  | ~2.9% + 30¢                                                                                                                  | ~5% + 50¢                                               |
| **Invoice Compliance**   | You must generate compliant invoices.                                                                                        | LS generates compliant invoices.                        |

**Verdict:** For a small team, the operational cost of tax compliance (or the risk of non-compliance) far outweighs the extra ~2% fee. We pay Lemon Squeezy to be our "shield".

---

## 3. Technical Architecture

### 3.1 Stack Choice

- **Payment Provider:** Lemon Squeezy (MoR)
- **Database:** Supabase (PostgreSQL)
- **Framework:** Next.js 16 (React Server Components)

### 3.2 Database Schema

Strict tracking of subscription status in Supabase.

```sql
-- public.subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique, -- One active subscription per user
  store_id text,          -- Lemon Squeezy Store ID
  customer_id text,       -- Lemon Squeezy Customer ID
  subscription_id text unique, -- Lemon Squeezy Subscription ID (for idempotency)
  status text not null default 'none'
    check (status in ('active', 'past_due', 'on_trial', 'unpaid', 'paused', 'cancelled', 'expired', 'none')),
  variant_id text,        -- Plan ID (Monthly vs Annual)
  renews_at timestamptz,  -- When the next billing happens
  ends_at timestamptz,    -- When existing access expires (if cancelled)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for quick lookups by user
create index idx_subscriptions_user_id on subscriptions (user_id);

-- RLS: Users can read their own subscription
create policy "Users can read own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- public.profiles modifications
alter table profiles add column tier text not null default 'free'
  check (tier in ('free', 'pro'));
alter table profiles add column subscription_status text not null default 'none';
```

### 3.3 The "IsPro" Check (Performance)

**Problem:** Joining the `subscriptions` table on every request is expensive and strictly unnecessary.
**Solution:** Cache the status on the user's profile.

> [!IMPORTANT]
> The `profiles.tier` column is the **single source of truth** for feature gating on the frontend. The `subscriptions` table is the **billing record**. A database trigger keeps them in sync.

**Database Trigger:** When `subscriptions` changes, update `profiles.tier`. Handles the cancellation grace period (`ends_at`).

```sql
create or replace function sync_tier_from_subscription()
returns trigger as $$
begin
  if new.status in ('active', 'on_trial') then
    -- Actively subscribed → Pro
    update profiles set tier = 'pro' where id = new.user_id;
  elsif new.status = 'cancelled' and new.ends_at is not null and new.ends_at > now() then
    -- Cancelled but still within paid period → stay Pro until ends_at
    -- A scheduled cron job (pg_cron) will demote after ends_at passes
    update profiles set tier = 'pro' where id = new.user_id;
  elsif new.status = 'past_due' then
    -- Grace period for failed payments → stay Pro briefly
    -- Lemon Squeezy retries the charge automatically
    update profiles set tier = 'pro' where id = new.user_id;
  else
    -- expired, unpaid, paused, none → Free
    update profiles set tier = 'free' where id = new.user_id;
  end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_subscription_change
  before insert or update on subscriptions
  for each row execute function sync_tier_from_subscription();
```

**Cancellation Grace Period Cleanup (pg_cron):**

```sql
-- Runs daily: demote users whose cancelled subscriptions have expired
select cron.schedule(
  'demote-expired-subscriptions',
  '0 0 * * *', -- Every midnight UTC
  $$
    update profiles set tier = 'free'
    where id in (
      select user_id from subscriptions
      where status = 'cancelled' and ends_at <= now()
    );
    update subscriptions set status = 'expired'
    where status = 'cancelled' and ends_at <= now();
  $$
);
```

**Frontend Check:**

```typescript
// Fast, no JOIN check
if (user.profile.tier === 'pro') {
  return <PremiumFeature />;
}
```

### 3.4 Webhook Integration Strategy

We must handle webhooks securely and idempotently to keep the database in sync.

- **Endpoint:** `/api/webhooks/lemonsqueezy`
- **Security:** Verify `X-Signature` header using the Signing Secret.
- **Idempotency:** Use `subscription_id` (unique) as the dedup key. On `subscription_created`, use `INSERT ... ON CONFLICT (subscription_id) DO UPDATE` to safely handle duplicate webhook deliveries.

**Event Handling:**

| Event                    | Action                                                                                |
| :----------------------- | :------------------------------------------------------------------------------------ |
| `subscription_created`   | Upsert row into `subscriptions` (idempotent via `subscription_id` unique constraint). |
| `subscription_updated`   | Update `status`, `renews_at`, `variant_id`.                                           |
| `subscription_cancelled` | Update `status` to `cancelled`, set `ends_at`. _User retains access until `ends_at`._ |
| `subscription_expired`   | Update `status` to `expired`. _Access revoked via trigger._                           |

> [!WARNING]
> **Webhook Reliability:** Lemon Squeezy (and all webhook providers) may deliver the same event multiple times. Every webhook handler **must** be idempotent. Never assume a webhook fires exactly once.

### 3.5 Feature Gating Utility

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

### 3.6 Pro Feature Boundaries

The table below defines what is gated behind Pro.

| Feature           | Free                      | Pro                                   |
| :---------------- | :------------------------ | :------------------------------------ |
| **Links**         | Unlimited                 | Unlimited                             |
| **Themes**        | Preset themes only        | + **Custom High-Performance Themes**  |
| **Branding**      | "Powered by Kytbox" shown | Removable                             |
| **Analytics**     | Basic (clicks, views)     | Advanced (referrer breakdown, export) |
| **Custom Domain** | ✗                         | ✓ (future)                            |

---

## 4. Operational & UX Readiness Foundations

These structures were implemented in Phase 1 and Phase 2 to prepare Kytbox for payment gateways.

### 4.1 Bio Dashboard UX Refactor (Tabs Architecture)
The Bio Dashboard is refactored from a monolithic client view into isolated contexts using URL-driven state (`?tab=links`).
* **Persistent Preview**: `PhonePreview` remains visible across tab switches.
* **Layout Integrity**: The 2-column layout ensures the live mobile preview is never squashed or hidden on standard desktop sizes.

### 4.2 Legal Compliance
Merchant of Record (Lemon Squeezy) requires these pages to be publicly accessible:
* **Terms of Service**: Defines acceptable use, cancellation policy, and warranties.
* **Privacy Policy**: GDPR-compliant with legal basis for data processing.
* **Refund Policy**: Explicit rules (e.g., "14-day money-back guarantee").

### 4.3 Support Infrastructure (Ticket System)
Paid users expect priority support. We built a lightweight internal ticketing system (`/support` and `/support-admin`) to score ticket urgency (`total_urgency = age_days + urgency_score`) and prioritize paid users without Intercom/Zendesk subscription overhead.

---

## 5. Phasing Strategy & Rationale

**Why do we implement features in this specific order?**

1.  **Bio First:**
    - The Bio app is **public-facing**. Every free user is a walking billboard for Kytbox (via the "Powered by Kytbox" footer).
    - Monetizing "Branding Removal" capitalizes on this viral loop immediately.
    - Cashflow is private; it has no viral loop to monetize yet.

2.  **Payment Integration Last:**
    - We must build the _value_ (themes, analytics, expert features) before we build the _gate_.
    - Asking for money without a polished product leads to high churn.
    - Legal compliance (Terms/Privacy) must exist before taking a single cent.

3.  **Deferred Features (Post-Launch):**
    - **Link Scheduling:** Complex UI, niche use case. High effort, low initial impact.
    - **Team Collaboration:** Requires complex permissions. Not a priority for solo creators (our initial target).

---

## 6. Implementation Roadmap

### Phase 1: Foundation & UX (Pre-Monetization) - **[COMPLETED]**

- [x] Refactor Bio Dashboard to tab-based architecture.
- [x] Legal pages: `/terms`, `/privacy`, `/refund`.
- [x] Internal support ticket system.
- [x] High-performance Custom Theme engine (Debounced, CSS variables).
- [x] Add `tier` column to `profiles`.
- [ ] Implement `canAccess()` feature gate utility.

### Phase 2: Payment Integration - **[ON HOLD]**

- [ ] Set up Lemon Squeezy Store & Products.
- [ ] Create `subscriptions` table.
- [ ] Create API Route for Checkout Session creation.
- [ ] Create API Route for Webhook handling (idempotent).
- [ ] Set up `pg_cron` for grace period cleanup.

### Phase 3: Gating & UI - **[ON HOLD]**

- [ ] Add "Upgrade" buttons in UI.
- [ ] Gate "Remove Branding" feature.
- [ ] Gate "Custom Themes" (Engine is built, entry points need gating).

### Phase 4: Launch - **[ON HOLD]**

- [ ] Test purchase flow (Sandbox).
- [ ] Verify webhook reliability (multiple deliveries, edge cases).
- [ ] Live switch.

---

## 7. Rollback & Failure Modes

| Failure Scenario              | Impact                            | Mitigation                                                    |
| :---------------------------- | :-------------------------------- | :------------------------------------------------------------ |
| Webhook endpoint down         | Subscription changes not recorded | Lemon Squeezy retries webhooks for up to 72h. Monitor alerts. |
| Lemon Squeezy outage          | Users can't purchase/upgrade      | Display banner. Existing `profiles.tier` continues to work.   |
| Trigger function error        | `tier` out of sync with billing   | Admin can manually query `subscriptions` and fix `profiles`.  |
| `pg_cron` grace period missed | User retains Pro after `ends_at`  | Cron runs daily; max overshoot is ~24h. Acceptable trade-off. |

---

_Last Updated: July 20, 2026_
