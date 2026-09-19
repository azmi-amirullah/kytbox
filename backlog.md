# 📌 Kytbox Product Backlog

> **Single Source of Truth** for high-impact, curated product improvements, architectural upgrades, and strategic features across the Kytbox ecosystem.
>
> *Filter Philosophy*: Speculative gimmicks (AI chatbots, fragile ecommerce scrapers, third-party bank-scraping money pits, and noisy autoplay widgets) have been ruthlessly discarded. Only features that deliver measurable user value, maintain strict data integrity, and adhere to the 2026 Enterprise Protocol are preserved here.

---

## 🎯 Priority Matrix Overview

| App / Domain | Feature | Impact | Effort | Status |
| :--- | :--- | :---: | :---: | :---: |
| 💰 **Cashflow** | **Inter-Book Account Transfers & Net Worth** | 🔥🔥🔥 | Medium | **Top Priority** |
| 💰 **Cashflow** | **Cash Horizon & Bill Due-Date Calendar** | 🔥🔥🔥 | Medium | **High Priority** |
| 💰 **Cashflow** | **Merchant Memory & Auto-Categorization** | 🔥🔥 | Low | Ready |
| 💰 **Cashflow** | **Debt Snowball & Avalanche Payoff Planner** | 🔥🔥 | Medium | Scheduled |
| 💰 **Cashflow** | **Receipt OCR & Itemization via Gemini Flash** | 🔥🔥🔥 | Low | Ready |
| 💰 **Cashflow** | **Smart CSV Import & Duplicate Detection** | 🔥🔥 | Low | Ready |
| 💰 **Cashflow** | **True Expenses Sinking Funds Amortizer** | 🔥🔥 | Low | Ready |
| 💰 **Cashflow** | **1-Click Split Settlement Sync (`/split` → Book)** | 🔥🔥 | Low | Ready |
| 💰 **Cashflow** | **Payday-to-Payday Custom Budget Cycles** | 🔥🔥 | Low | Backlog |
| 💰 **Cashflow** | **50/30/20 Macro Allocation Health Score** | 🔥🔥 | Low | Backlog |
| 💰 **Cashflow** | **Subscription Creep & Price Spike Watchdog** | 🔥 | Low | Backlog |
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

---

## 💰 Cashflow App (`/cashflow`)

### 1. Inter-Book Account Transfers (`type: 'transfer'`) & Consolidated Net Worth
* **Problem**: Cashflow entries are strictly siloed as `income | expense`. When a user transfers $500 from Checking to Savings, or pays a credit card balance from a checking account, recording it creates artificial spikes in both income and expense analytics.
* **Solution**:
  * Introduce `type: 'transfer'` with linked debit/credit entries between books (`target_cashflow_id` / `linked_entry_id`).
  * Transfers are **cashflow-neutral** in P&L, spending breakdowns, and monthly reports, while accurately adjusting each book's real-time balance.
  * Unlocks a unified **Consolidated Net Worth & Total Liquidity** widget across all active books on `/cashflow`.
* **Complexity**: Medium (Schema addition, isolation in `math.ts` aggregation, and atomic server action).

### 2. Cash Horizon & Bill Due-Date Calendar
* **Problem**: `SafeToSpendCard` provides a single static number, but personal finance is a timing problem. Users need to know *when* upcoming bills hit relative to their next paycheck to avoid liquidity cliffs.
* **Solution**:
  * An interactive monthly calendar grid visualizing recurring rules (subscriptions, bills, payroll) and past entries.
  * Projected daily balance graph highlighting days where balance dips near zero before expected income arrives.
  * 1-click "Mark as Paid / Post Entry" directly from bill chips.
* **Complexity**: Medium (Leverages existing `@/components/ui` and List calendar patterns; purely calculated from `recurringRules` and `entries`).

### 3. Merchant Memory & Rule-Based Auto-Categorization
* **Problem**: Manual transaction creation and bank CSV imports force users to repeatedly assign categories and tags for known merchants ("Grab", "Starbucks", "Netflix", "Indomaret").
* **Solution**:
  * Rule-based engine that learns from transaction history or user-defined keyword mappings.
  * Automatically populates category and tags when a description matches, and pre-categorizes batches in `ImportCsvModal`.
* **Complexity**: Low (Client-side frequency map or lightweight user-level pattern table).

### 4. Debt Snowball & Avalanche Payoff Planner
* **Problem**: Users with multiple debts in `goals` (marked `type: 'debt'`) have no guidance on whether to pay off the smallest balance first (Snowball) or highest interest first (Avalanche).
* **Solution**:
  * Payoff simulator comparing total interest saved and payoff horizon under both strategies.
  * Calculates monthly contribution recommendations based on monthly surplus from `SafeToSpend`.
* **Complexity**: Medium (Pure mathematical modeling with clear interactive charts).

### 5. Instant Receipt OCR & Itemization via Gemini Flash (Multimodal Edge)
* **Problem**: Users frequently attach receipts using `ReceiptLightbox`, but they still have to manually type the date, amount, merchant, and item breakdown.
* **Solution**:
  * `[ 📷 Scan Receipt ]` action in `EntryModal`.
  * Passes image to Gemini 2.0 Flash via Server Action with structured JSON output: `{ date, totalAmount, merchant, items: [{ name, price, category }] }`.
  * Pre-fills transaction inputs and `PurchaseBreakdownEditor` in < 1 second with 1-tap review.
* **Complexity**: Low (Leverages Google GenAI SDK with native JSON mode; graceful fallback to manual entry if parsing fails).

### 6. Smart CSV Import with Duplicate Detection & Clean Merchant Parsing
* **Problem**: When importing monthly bank CSV statements, overlapping date ranges create duplicate entries, and messy bank descriptions (`POS DEBIT 0918 SQ *STORE 123`) clutter transaction tables.
* **Solution**:
  * During the CSV preview step in `ImportCsvModal`, batch-check existing entries matching `(date ± 2 days, exact amount, normalized description)`.
  * Pre-uncheck suspected duplicates with an explicit toggle (`[ ] 3 duplicates detected — skip`).
  * Regex cleaner strips common banking noise (`POS DEBIT`, `PURCHASE AUTHORIZATION`, trailing store IDs).
* **Complexity**: Low (Single batched SQL range query; zero row-by-row N+1 DB calls).

### 7. "True Expenses" Sinking Funds Amortizer (Annual & Irregular Bills)
* **Problem**: Non-monthly bills (annual vehicle tax, insurance, software renewals, holiday expenses) blindside users. A user thinks they have $1,500 safe to spend, only for an annual $1,200 bill to arrive next week.
* **Solution**:
  * Amortizes non-monthly recurring rules (`yearly_calculation` or `recurrence_interval = 'yearly'`) into a monthly reserve target (`Annual Cost / 12 = Monthly Sinking Target`).
  * Automatically factors the monthly amortized reserve into the `SafeToSpendCard` daily/monthly spending allowance.
* **Complexity**: Low (**Zero new database tables**; pure mathematical extension to `calculateSafeToSpend()`).

### 8. 1-Click Split Settlement Sync (`/split/[token]` → Cashflow Book)
* **Problem**: Users settle shared trip/roommate expenses in `/split/[token]`, but then have to manually open Cashflow and recreate an income/expense entry to keep their personal ledger accurate.
* **Solution**:
  * Authenticated `[ 📥 Record Settlement to Cashflow ]` button on `/split/[token]` net-balance settlement cards.
  * Pre-selects user's default cashflow book, auto-labels `[Split: {Group Title}] Settlement from {Name}`, and creates the entry in 1 click.
* **Complexity**: Low (Reuses existing `createEntry` Server Action via clean feature boundary).

### 9. Payday-to-Payday / Custom Budget Cycles (Bi-Weekly & Custom Cut-Off Days)
* **Problem**: Calendar-month budgets (1st–31st) desync for users paid bi-weekly, on the 15th/25th, or on the last Friday of the month, making month-start envelope budgeting artificially constrained.
* **Solution**:
  * Add `budget_cycle_start_day: integer default 1` to `cashflows`.
  * Date filter pills, envelope allocations, and safe-to-spend projections anchor dynamically to `[cycleStart, cycleEnd]` instead of hardcoding `startOfMonth(now())`.
* **Complexity**: Low (Single column addition on `cashflows` and date utility extension).

### 10. "Needs vs. Wants vs. Savings" (50/30/20) Macro Allocation Health Score
* **Problem**: Category pie charts with 20+ slices provide micro-details but fail to answer the macro question: *Is my core lifestyle sustainable?*
* **Solution**:
  * Categories map to macro buckets: `Need` (Essentials), `Want` (Discretionary), or `Savings/Debt`.
  * Compact 50/30/20 benchmark card on Cashflow Dashboard tracking actual ratio vs target.
* **Complexity**: Low (Pre-populated default mapping dictionary on existing categories; zero DB migration required if stored in category metadata).

### 11. Subscription Creep & Price Spike Watchdog
* **Problem**: Recurring subscription fees silently increase ($12.99 becomes $15.99; utility surges), and users don't notice for months.
* **Solution**:
  * When logging or importing an entry matching an active recurring rule, compare `amount` against the rule's baseline.
  * If `new_amount > baseline_amount * 1.10`, display an inline warning badge with 1-click options: `[Update Baseline]` or `[Flag for Review]`.
* **Complexity**: Low (Pure in-memory math check on entry creation; zero background cron jobs).

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

---

_Last Updated: September 2026_
