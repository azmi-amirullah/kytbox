# UKIT Monetization Strategy & Architecture

This document defines the monetization model, pricing strategy, and technical architecture for UKIT.

> [!IMPORTANT]
> **Core Philosophy:** Free users get a fully functional product. Pro users pay for **advanced power**, **custom branding**, and **higher limits**.
> **Strategic Pivot (Feb 2025):** We use a **Merchant of Record (MoR)** strategy to avoid global tax liability.
>
> **Documentation Note:** This document includes detailed architectural specs for future phases (Payment Integration, Gating). We document them **now** so we understand the _implementation path_ and _structural requirements_ early, avoiding costly refactors later. **Knowing "Why later" is as important as knowing "What now".**

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

## 2. UKIT Pricing Tiers

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
  user_id uuid references auth.users not null,
  store_id text,          -- Lemon Squeezy Store ID
  customer_id text,       -- Lemon Squeezy Customer ID
  subscription_id text,   -- Lemon Squeezy Subscription ID
  status text,            -- 'active', 'past_due', 'on_trial', 'unpaid', 'paused', 'cancelled'
  variant_id text,        -- Plan ID (Monthly vs Annual)
  renews_at timestamptz,  -- When the next billing happens
  ends_at timestamptz,    -- When existing access expires (if cancelled)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: Users can read their own subscription
create policy "Users can read own subscription" on subscriptions
  for select using (auth.uid() = user_id);
```

### 3.2 The "IsPro" Check (Performance)

**Problem:** Joining the `subscriptions` table on every request is expensive and strictly unnecessary.
**Solution:** Cache the status on the user's profile.

1.  **Database Trigger:** When `subscriptions` changes, update `profiles.tier`.
    ```sql
    -- Pseudo-code for trigger function
    if (new.status = 'active') then
      update profiles set tier = 'pro' where id = new.user_id;
    else
      update profiles set tier = 'free' where id = new.user_id;
    end if;
    ```
2.  **Frontend Check:**
    ```typescript
    // Fast, no JOIN check
    if (user.profile.tier === 'pro') {
      return <PremiumFeature />;
    }
    ```

### 3.3 Webhook Integration strategy

We must handle webhooks securely to keep the database in sync.

- **Endpoint:** `/api/webhooks/lemonsqueezy`
- **Security:** Verify `X-Signature` header using the Signing Secret.
- **Event Handling:**

| Event                    | Action                                                                               |
| :----------------------- | :----------------------------------------------------------------------------------- |
| `subscription_created`   | Insert new row into `subscriptions`.                                                 |
| `subscription_updated`   | Update `status`, `renews_at`, `variant_id`.                                          |
| `subscription_cancelled` | Update `status` to `cancelled`, set `ends_at`. _User allows access until `ends_at`._ |
| `subscription_expired`   | Update `status` to `expired`. _Access revoked._                                      |

---

---

## 5. Phasing Strategy Rationale

**Why do we implement features in this specific order?**

1.  **Bio First (Phase 2):**
    - The Bio app is **public-facing**. Every free user is a walking billboard for UKIT (via the "Powered by UKIT" footer).
    - Monetizing "Branding Removal" capitalizes on this viral loop immediately.
    - Cashflow is private; it has no viral loop to monetize yet.

2.  **Payment Integration Last (Phase 4):**
    - We must build the _value_ (themes, analytics, expert features) before we build the _gate_.
    - Asking for money without a polished product leads to high churn.
    - Legal compliance (Terms/Privacy) must exist before taking a single cent.

3.  **Deferred Features (Post-Launch):**
    - **Link Scheduling:** Complex UI, niche use case. High effort, low initial impact.
    - **Team Collaboration:** Requires complex permissions. Not a priority for solo creators (our initial target).

---

## 6. Implementation Status

### Phase 1: Foundation (Pre-Monetization)

- [ ] Create `subscriptions` table.
- [ ] Add `tier` column to `profiles`.
- [ ] Implement `usePro` hook in frontend.

### Phase 2: Integration

- [ ] Set up Lemon Squeezy Store & Products.
- [ ] Create API Route for Checkout Session creation.
- [ ] Create API Route for Webhook handling.

### Phase 3: Gating & UI

- [ ] Add "Upgrade" buttons in UI.
- [ ] Gate "Remove Branding" feature.
- [ ] Gate "Custom Themes".

### Phase 4: Launch

- [ ] Test purchase flow (Sandbox).
- [ ] Verify webhook reliability.
- [ ] Live switch.

---

_Last Updated: February 2025_
