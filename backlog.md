# 📌 Kytbox Product Backlog

> **Single Source of Truth** for high-impact, curated product improvements, architectural upgrades, and strategic features across the Kytbox ecosystem.
>
> *Filter Philosophy*: Speculative gimmicks (AI chatbots, fragile ecommerce scrapers, third-party bank-scraping money pits, and noisy autoplay widgets) have been ruthlessly discarded. Only features that deliver measurable user value, maintain strict data integrity, and adhere to the 2026 Enterprise Protocol are preserved here.

---

## 🎯 Priority Matrix Overview

| App / Domain | Feature | Impact | Effort | Status |
| :--- | :--- | :---: | :---: | :---: |
| 💰 **Cashflow** | **Inter-Book Account Transfers & Net Worth** | 🔥🔥🔥 | Medium | **Top Priority** |
| 💰 **Cashflow** | **Debt Snowball & Avalanche Payoff Planner** | 🔥🔥 | Medium | Scheduled |
| 💰 **Cashflow** | **Smart CSV Import & Duplicate Detection** | 🔥🔥 | Low | Ready |
| 💰 **Cashflow** | **"Can I Afford It?" Purchase Sandbox** | 🔥🔥🔥 | Low | Ready |
| 💰 **Cashflow** | **1-Click Split Settlement Sync (`/split` → Book)** | 🔥🔥 | Low | Ready |
| 💰 **Cashflow** | **Payday-to-Payday Custom Budget Cycles** | 🔥🔥 | Low | Backlog |
| 💰 **Cashflow** | **50/30/20 Macro Allocation Health Score** | 🔥🔥 | Low | Backlog |
| 💰 **Cashflow** | **Subscription Creep & Price Spike Watchdog** | 🔥 | Low | Backlog |
| 💰 **Cashflow** | **Auto-Detect Recurring Bills from History** | 🔥🔥 | Low | Backlog |
| 💰 **Cashflow** | **Bill & Payday Calendar Sync (`.ics` Feed)** | 🔥🔥 | Low | Backlog |
| 💰 **Cashflow** | **Entry Reconciliation & Import Matching** | 🔥🔥 | Medium | Backlog |
| 💰 **Cashflow** | **Zero-Based "Underfunded" Assignment Panel** | 🔥🔥 | Medium | Backlog |
| 🏎️ **Garage** | **Service Invoice & Receipt Photo Attachment** | 🔥🔥 | Low | Ready |
| 🏎️ **Garage** | **OBD-II Fault Code (DTC) Offline Lookup** | 🔥🔥🔥 | Medium | Ready |
| 🏎️ **Garage** | **Tire Tread & Brake Wear Depth Tracker** | 🔥🔥 | Low | Backlog |
| 🔗 **Bio** | **Creator Tip Jar & Donation Tile** | 🔥🔥🔥 | Low | Ready |
| 🔗 **Bio** | **Link Click Spatial Heatmap** | 🔥🔥🔥 | Medium | Backlog |
| 🔗 **Bio** | **Custom Rich Content Blocks (FAQ, Markdown)** | 🔥🔥 | Low | Ready |
| 🔗 **Bio** | **Folder Open & Interaction Analytics** | 🔥🔥 | Low | Ready |
| 📋 **List** | **Board Collaboration & ACL Permissions** | 🔥🔥🔥 | Medium | High Priority |
| 📋 **List** | **Card Comments & Real-Time Activity Stream** | 🔥🔥 | Medium | Backlog |
| 📋 **List** | **Card File & Image Attachments** | 🔥🔥 | Low | Ready |
| 📋 **List** | **Two-Way External Calendar Sync (iCal)** | 🔥🔥🔥 | Medium | Scheduled |
| 🛡️ **Platform** | **Two-Factor Authentication (TOTP 2FA)** | 🔥🔥🔥 | Medium | High Priority |
| 🛡️ **Platform** | **Lemon Squeezy MoR Billing & `/pricing`** | 🔥🔥🔥 | High | Strategic |
| 🛡️ **Platform** | **Multi-Language Framework (`next-intl`)** | 🔥🔥 | High | Strategic |
| 🛡️ **Platform** | **Session Management & Device Revocation** | 🔥🔥 | Medium | Backlog |
| 🛡️ **Platform** | **Mobile Native Shell (Capacitor PWA)** | 🔥🔥🔥 | High | Strategic |
| 🛡️ **Platform** | **Weekly Financial Health Digest** | 🔥🔥 | Low | Ready |

---

## 💰 Cashflow App (`/cashflow`)

### 1. Inter-Book Account Transfers (`type: 'transfer'`) & Consolidated Net Worth
* **Problem**: Cashflow entries are strictly siloed as `income | expense`. When a user transfers $500 from Checking to Savings, or pays a credit card balance from a checking account, recording it creates artificial spikes in both income and expense analytics.
* **Solution**:
  * Introduce `type: 'transfer'` with linked debit/credit entries between books (`target_cashflow_id` / `linked_entry_id`).
  * Transfers are **cashflow-neutral** in P&L, spending breakdowns, and monthly reports, while accurately adjusting each book's real-time balance.
  * Unlocks a unified **Consolidated Net Worth & Total Liquidity** widget across all active books on `/cashflow`.
* **Complexity**: Medium (Schema addition, isolation in `math.ts` aggregation, and atomic server action).

### 2. Debt Snowball & Avalanche Payoff Planner
* **Problem**: Users with multiple debts in `goals` (marked `type: 'debt'`) have no guidance on whether to pay off the smallest balance first (Snowball) or highest interest first (Avalanche).
* **Solution**:
  * Payoff simulator comparing total interest saved and payoff horizon under both strategies.
  * Calculates monthly contribution recommendations based on monthly surplus from `SafeToSpend`.
* **Complexity**: Medium (Pure mathematical modeling with clear interactive charts).

### 3. Smart CSV Import with Duplicate Detection & Clean Merchant Parsing
* **Problem**: When importing monthly bank CSV statements, overlapping date ranges create duplicate entries, and messy bank descriptions (`POS DEBIT 0918 SQ *STORE 123`) clutter transaction tables.
* **Solution**:
  * During the CSV preview step in `ImportCsvModal`, batch-check existing entries matching `(date ± 2 days, exact amount, normalized description)`.
  * Pre-uncheck suspected duplicates with an explicit toggle (`[ ] 3 duplicates detected — skip`).
  * Regex cleaner strips common banking noise (`POS DEBIT`, `PURCHASE AUTHORIZATION`, trailing store IDs).
* **Complexity**: Low (Single batched SQL range query; zero row-by-row N+1 DB calls).

### 4. "Can I Afford It?" Purchase Sandbox (Impulse Buy Guard)
* **Problem**: Users see a $1,200 laptop or $450 flight and experience decision paralysis. Backward-looking expense charts don't tell them if this purchase will blow up next month's rent or derail their savings goal.
* **Solution**:
  * Ephemeral simulator modal where users input `Amount`, `Category`, and `Date`.
  * Previews ripple effects in real time: impact on **Safe-to-Spend** daily allowance, threshold breach on **Active Budgets**, and delay on **Savings Goals** target dates.
  * Single click converts the simulated transaction into a real expense entry.
* **Complexity**: Low (Purely client-side preview via `safe-to-spend.ts`; zero DB writes until explicitly committed).

### 5. 1-Click Split Settlement Sync (`/split/[token]` → Cashflow Book)
* **Problem**: Users settle shared trip/roommate expenses in `/split/[token]`, but then have to manually open Cashflow and recreate an income/expense entry to keep their personal ledger accurate.
* **Solution**:
  * Authenticated `[ 📥 Record Settlement to Cashflow ]` button on `/split/[token]` net-balance settlement cards.
  * Pre-selects user's default cashflow book, auto-labels `[Split: {Group Title}] Settlement from {Name}`, and creates the entry in 1 click.
* **Complexity**: Low (Reuses existing `createEntry` Server Action via clean feature boundary).

### 6. Payday-to-Payday / Custom Budget Cycles (Bi-Weekly & Custom Cut-Off Days)
* **Problem**: Calendar-month budgets (1st–31st) desync for users paid bi-weekly, on the 15th/25th, or on the last Friday of the month, making month-start envelope budgeting artificially constrained.
* **Solution**:
  * Add `budget_cycle_start_day: integer default 1` to `cashflows`.
  * Date filter pills, envelope allocations, and safe-to-spend projections anchor dynamically to `[cycleStart, cycleEnd]` instead of hardcoding `startOfMonth(now())`.
* **Complexity**: Low (Single column addition on `cashflows` and date utility extension).

### 7. "Needs vs. Wants vs. Savings" (50/30/20) Macro Allocation Health Score
* **Problem**: Category pie charts with 20+ slices provide micro-details but fail to answer the macro question: *Is my core lifestyle sustainable?*
* **Solution**:
  * Categories map to macro buckets: `Need` (Essentials), `Want` (Discretionary), or `Savings/Debt`.
  * Compact 50/30/20 benchmark card on Cashflow Dashboard tracking actual ratio vs target.
* **Complexity**: Low (Pre-populated default mapping dictionary on existing categories; zero DB migration required if stored in category metadata).

### 8. Subscription Creep & Price Spike Watchdog
* **Problem**: Recurring subscription fees silently increase ($12.99 becomes $15.99; utility surges), and users don't notice for months.
* **Solution**:
  * When logging or importing an entry matching an active recurring rule, compare `amount` against the rule's baseline.
  * If `new_amount > baseline_amount * 1.10`, display an inline warning badge with 1-click options: `[Update Baseline]` or `[Flag for Review]`.
  * **30-Day Annual Warning & Zombie Sentinel**: Alerts 30 days and 7 days prior to annual renewals; flags recurring commitments unreviewed for > 60 days.
* **Complexity**: Low (Pure in-memory math check on entry creation and dashboard load; zero heavy background workers).

### 9. Auto-Detect Recurring Bills from Entry History
* **Problem**: `cashflow_recurring_rules` require manual setup. That setup friction is the single biggest blocker to the Safe-to-Spend engine and the Bill Calendar — a feature nobody configures is a feature nobody gets. Competitors (Monarch) market automatic recurring-charge detection as a headline capability.
* **Solution**:
  * Scan a book's entry history for normalized merchant signatures matching 2+ occurrences on a consistent cadence (monthly ±3 days, yearly ±7 days).
  * Present a one-click review queue: `[✓ Netflix $15.99 — monthly, last 3 on the 14th] [Create rule] [Dismiss]`.
  * Confidence-gated: only propose on ≥3 matches or 2 matches with identical amount; never silently create rules.
* **Complexity**: Low (Single grouped SQL query over existing entries + a review UI; zero new tables).

### 10. Bill & Payday Calendar Sync (`.ics` Subscription Feed)
* **Problem**: Bills only surface when the user *opens* Kytbox. Real bills collide with real life — users need upcoming bills and paydays sitting next to meetings in the calendar they already check daily.
* **Solution**:
  * Authenticated route handler emitting RFC 5545 iCalendar events generated from `cashflow_recurring_rules` (bills, paydays, annual renewals).
  * Opaque, revocable token URL (never exposes cashflow IDs); re-generable from settings to revoke access.
  * Mirrors the iCal pattern already planned for List boards — same route-handler approach, reusable helper.
* **Complexity**: Low (One route handler + a token column; no third-party calendar API dependency).

### 11. Entry Reconciliation & Import Matching
* **Problem**: Backlog #3 only catches duplicates *during* CSV import. It does nothing for the real trust-destroyer: a manual entry and an imported entry describing the same transaction, both counted, silently double-inflating spending and breaking every derived number (Safe-to-Spend, budgets, reports).
* **Solution**:
  * Fuzzy match pass over existing entries: `(±2 days, exact amount, normalized merchant via existing `merchant-rules.ts` cleaner)` — same normalization already used by import.
  * Surface matches in a review queue; resolving either **merges** (keeps earliest, preserves tags/receipt) or **dismisses** the pairing permanently.
  * Optional `matched_entry_id` column for durable "don't re-flag this pair" state.
* **Complexity**: Medium (One batched range query for detection; merge path needs an atomic server action + RLS review).

### 12. Zero-Based "Underfunded" Assignment Panel
* **Problem**: Kytbox tells users what they *spent*, never what is **still unassigned**. Income lands, categories get partially funded, and the remainder silently absorbs into overspending — the exact failure YNAB's "give every dollar a job" method was built to prevent. This is the widest methodological gap versus the market leader.
* **Solution**:
  * Aggregate this cycle's income against the sum of assigned budget limits: `unassigned = income - Σ effectiveLimit`.
  * Compact panel: *"Income $4,000 — $610 not yet given a job"* with a 1-click "Assign to [category]" shortcut.
  * Reuses `enable_rollover` / `effectiveLimit` math already computed in `calculateBudgetStatus` — no new aggregation path.
* **Complexity**: Medium (Requires a defined cycle anchor; pairs naturally with backlog #6 Payday-to-Payday cycles).

---

## 🏎️ Garage App (`/garage`)

### 1. Service Invoice & Receipt Photo Attachment
* **Problem**: Users log vehicle services but lose the paper workshop receipts or parts warranty documentation.
* **Solution**:
  * Attach compressed WebP receipts/invoices to service log entries using Supabase Storage (reusing Cashflow's proven `ReceiptLightbox` architecture).
* **Complexity**: Low (Reuses existing client image compression and signed URL infrastructure).

### 2. OBD-II Diagnostic Trouble Code (DTC) Offline Lookup
* **Problem**: When a vehicle check-engine light triggers, drivers are given cryptic alphanumeric codes (e.g., P0300, P0420) without context.
* **Solution**:
  * Fast, static client-side lookup database for standard OBD-II generic fault codes.
  * Displays severity, common symptoms, likely causes, and whether it is safe to continue driving.
* **Complexity**: Medium (Static indexed JSON dictionary; zero runtime API costs).

### 3. Tire Tread & Brake Wear Depth Tracker
* **Problem**: Wear items are forgotten until failure or annual inspections.
* **Solution**:
  * Log millimeter measurements for front/rear tire treads and brake pad thickness during regular services.
  * Simple visual wear gauge predicting remaining safe kilometers before minimum legal threshold.
* **Complexity**: Low.

---

## 🔗 Bio App (`/{username}`)

### 1. Creator Tip Jar & Donation Tile
* **Problem**: Creators on Kytbox currently have to link to external payment pages without native inline presentation.
* **Solution**:
  * Dedicated monetization tile supporting Buy Me a Coffee, Ko-fi, Saweria, or direct PayPal/Stripe payment links.
* **Complexity**: Low (Custom Bento tile variant with currency preset).

### 2. Link Click Spatial Heatmap & Visual Drop-off
* **Problem**: Analytics charts show total clicks, but creators cannot see where visitors' eyes and fingers actually drop off on their Bento layout.
* **Solution**:
  * Visual heatmap overlay rendered directly on top of the creator's live Bento grid in the admin preview.
* **Complexity**: Medium (Visual canvas overlay utilizing existing coordinate tracking).

### 3. Custom Rich Content Blocks (FAQ Accordion, Quotes)
* **Problem**: Creators selling digital goods, coaching, or freelance services need structured text without leaving their bio page.
* **Solution**:
  * Accordion-style FAQ block and formatted callout quote tiles.
* **Complexity**: Low.

### 4. Folder Open & Interaction Analytics
* **Problem**: Nested links inside folders currently lack drill-down visibility into whether users actually opened the parent folder.
* **Solution**:
  * Track "Folder Open" events alongside standard outbound link clicks to measure discoverability.
* **Complexity**: Low.

---

## 📋 List App (`/list`)

### 1. Board Collaboration & ACL Permissions (`Viewer | Editor`)
* **Problem**: Todo and Kanban boards are currently single-user or public read-only. Team or family collaboration is blocked.
* **Solution**:
  * Extend Cashflow's proven share permission model (`owner`, `edit`, `read`) to List boards.
  * Role-based mutation guards on board actions.
* **Complexity**: Medium (Schema addition for `list_shares` + RLS policies).

### 2. Card Comments & Real-Time Activity Stream
* **Problem**: Once boards are shared, collaborators have no way to discuss specific cards or leave status updates.
* **Solution**:
  * Threaded discussion comments on card modals with timestamps and user attribution.
* **Complexity**: Medium.

### 3. Card File & Image Attachments
* **Problem**: Task cards lack visual reference materials (screenshots, invoices, specs).
* **Solution**:
  * Upload and attach files/images directly to cards via Supabase Storage.
* **Complexity**: Low.

### 4. Two-Way External Calendar Sync (iCal / Google Calendar)
* **Problem**: Users manage deadlines in Kytbox but need them visible in their native device calendar.
* **Solution**:
  * Generate a secure private `.ics` subscription URL for boards with due dates.
* **Complexity**: Medium (Route handler serving RFC 5545 iCalendar format).

---

## 🛡️ Platform, Security & Monetization

### 1. Two-Factor Authentication (`TOTP 2FA + Recovery Codes`)
* **Problem**: High-value user accounts holding financial records and personal data need stronger authentication than single passwords/OAuth.
* **Solution**:
  * Supabase Auth MFA integration with standard Authenticator apps (Google Authenticator, 1Password).
  * Hashed one-time emergency recovery codes.
* **Complexity**: Medium.

### 2. Lemon Squeezy MoR Billing & `/pricing`
* **Problem**: No automated commercial monetization layer exists to convert power users to Pro tier.
* **Solution**:
  * Merchant of Record (Lemon Squeezy) integration handling global taxes and checkout.
  * Webhook listener syncing `subscriptions` table.
  * Public `/pricing` comparison page and in-app feature paywalls.
* **Complexity**: High (Billing webhooks, idempotency, subscription lifecycle).

### 3. Multi-Language Framework (`next-intl`)
* **Problem**: Non-English markets (e.g. Indonesian, Spanish) face language barriers.
* **Solution**:
  * Server-side internationalization using `next-intl` with zero layout shift and localized number/date formatting.
* **Complexity**: High (Translation dictionary extraction across all apps).

### 4. Session Management & Device Revocation
* **Problem**: Users cannot see where they are logged in or revoke compromised devices.
* **Solution**:
  * Account settings panel listing active sessions (OS, browser, last active IP) with 1-click remote termination.
* **Complexity**: Medium.

### 5. Mobile Native Shell (Capacitor PWA)
* **Problem**: Many mobile users prefer app store downloads over browser shortcuts.
* **Solution**:
  * Wrap existing responsive Next.js PWA into native iOS and Android binaries using Capacitor.
* **Complexity**: High.

### 6. Proactive Weekly Financial Health Digest
* **Problem**: Passive dashboards require users to remember to log in. By the time they check their budgets, the month is already over.
* **Solution**:
  * Automated weekly snapshot summary delivered via in-app notification or transactional email:
    * 7-day trailing spend vs budget pace (*"Spent $340 — 15% under budget"*).
    * Top spend category.
    * Current Safe-to-Spend daily rate.
    * Upcoming recurring commitments due this week.
* **Complexity**: Low (Scheduled Server Action aggregating trailing 7-day metrics into a clean, unstyled digest payload).

---

_Last Updated: September 2026_
