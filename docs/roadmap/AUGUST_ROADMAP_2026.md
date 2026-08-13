# 🗺️ August 2026 Roadmap — Kytbox Ecosystem

> **Theme**: Product Features First, Platform Security & Global Accessibility  
> **Duration**: August 1, 2026 – August 31, 2026  
> **Status**: 🟢 Approved & Fully Specified (Feature-First Focus)  

---

## 📌 Table of Contents & Progress Checklist

- [x] [Day 1 — Bio: SEO Metadata Editor](#day-1)
- [x] [Day 2 — Bio: Custom Link Thumbnails](#day-2)
- [x] [Day 3 — Bio: Lead Capture Form Widget](#day-3)
- [x] [Day 4 — Bio: Pin Important Links & Sensitive Content Warning](#day-4)
- [x] [Day 5 — Bio: Custom Domain Mapping Engine](#day-5)
- [x] [Day 6 — Bio: Creator Features E2E Test Suite](#day-6)
- [x] [Day 7 — Weekly Sprint Audit & Security Boundary Check](#day-7)
- [x] [Day 8 — Cashflow: Split Transactions Engine](#day-8)
- [ ] [Day 9 — Cashflow: CSV / Bank Transaction Import & Auto-Parser](#day-9)
- [ ] [Day 10 — Cashflow: Monthly Comparison View](#day-10)
- [ ] [Day 11 — Cashflow: Custom Tags & Labels Engine](#day-11)
- [ ] [Day 12 — Cashflow: Receipt & Attachment Upload](#day-12)
- [ ] [Day 13 — Cashflow: Advanced Features E2E Test Suite](#day-13)
- [ ] [Day 14 — Weekly Sprint Audit & Financial Calculation Check](#day-14)
- [ ] [Day 15 — List: Card Due Dates & Reminders](#day-15)
- [ ] [Day 16 — List: Card Subtasks & Checklist Engine](#day-16)
- [ ] [Day 17 — List: Pre-built Board Templates](#day-17)
- [ ] [Day 18 — List: Card Priority Levels & Filtering](#day-18)
- [ ] [Day 19 — List: Card Attachments](#day-19)
- [ ] [Day 20 — List: Advanced Features E2E Test Suite](#day-20)
- [ ] [Day 21 — Weekly Sprint Audit & Accessibility (WCAG 2.2)](#day-21)
- [ ] [Day 22 — Platform: Two-Factor Authentication (TOTP 2FA Setup)](#day-22)
- [ ] [Day 23 — Platform: 2FA Challenge & Recovery Codes](#day-23)
- [ ] [Day 24 — Platform: Workspace Global Search (`Cmd+K`)](#day-24)
- [ ] [Day 25 — Platform: One-Click GDPR Data Export](#day-25)
- [ ] [Day 26 — Platform: Session Management Dashboard](#day-26)
- [ ] [Day 27 — Platform: Security & Search E2E Test Suite](#day-27)
- [ ] [Day 28 — Weekly Sprint Audit & System Integrity Verification](#day-28)
- [ ] [Day 29 — Platform: Multi-language Setup (`next-intl`)](#day-29)
- [ ] [Day 30 — Platform: Locale Switcher & Translation Dictionaries](#day-30)
- [ ] [Day 31 — August 30-Day Sprint Retrospective & September Planning](#day-31)

---

## 🎯 Strategic Goals

1. **Bio App Depth & Creator Tools**: Custom Domains, SEO Metadata Editor, Lead Capture Forms, Custom Thumbnails, Pinned Links, and Sensitive Content Warnings.
2. **Cashflow Productivity**: Receipt/Attachment Uploads, CSV/Bank Import, Monthly Comparison Views, Split Transactions, and Custom Tags/Labels.
3. **List App Power Features**: Due Dates & Reminders, Card Subtasks/Checklists, Pre-built Board Templates, Priority Levels, and Card Attachments.
4. **Platform Security & Growth**: Two-Factor Authentication (TOTP 2FA), Workspace Global Search (`Cmd+K`), One-Click GDPR Data Export, and Multi-language Support (`next-intl` i18n).

---

## 📅 Detailed August 2026 Execution Schedule

---

### Week 1 — Bio Creator Features & Custom Domains (Aug 1 - Aug 7)

<a id="day-1"></a>
#### Day 1 — Saturday, Aug 1 | ✨ Feature
##### Bio: SEO Metadata Editor
- **Why**: Creators need custom `<title>`, `<meta description>`, and OpenGraph social images per public bio profile for search engine ranking (SEO) and social sharing previews (Twitter/LinkedIn/Facebook cards). Without custom SEO metadata, shared profile links fall back to generic site titles, lowering click-through rates.
- **Implementation Blueprint**:
  - Add `meta_title`, `meta_description`, and `og_image_url` columns to `bio_profiles` table.
  - Colocate Zod validation schema in `src/features/bio/schemas.ts`.
  - Implement dynamic `<head>` metadata generation in Next.js Server Component `app/[username]/page.tsx`:
    ```typescript
    export async function generateMetadata({ params }: Props): Promise<Metadata> {
      const profile = await getBioProfile(params.username)
      return {
        title: profile.meta_title || `${profile.display_name} (@${profile.username}) | Kytbox`,
        description: profile.meta_description || profile.bio,
        openGraph: { images: [profile.og_image_url || profile.avatar_url] }
      }
    }
    ```

---

<a id="day-2"></a>
#### Day 2 — Sunday, Aug 2 | ✨ Feature
##### Bio: Custom Link Thumbnails
- **Why**: Plain text links look bare and unengaging. Automatically fetching favicons from target URLs combined with manual image upload overrides gives creator profiles a polished, professional brand appearance.
- **Implementation Blueprint**:
  - Add `icon_url` column to `bio_links` table.
  - Create automatic favicon resolver: `https://www.google.com/s2/favicons?domain=${url}&sz=128`.
  - Build `LinkThumbnailPicker.tsx` component with custom image upload handler targeting Supabase Storage bucket `link-icons`.

---

<a id="day-3"></a>
#### Day 3 — Monday, Aug 3 | ✨ Feature
##### Bio: Lead Capture Form Widget
- **Why**: Creators value owned email subscriber lists far more than passive social followers. Placing a simple opt-in email form directly on their bio page allows visitors to subscribe instantly without leaving the page.
- **Implementation Blueprint**:
  - Create `bio_subscribers` table (`id`, `profile_id`, `email`, `created_at`, `source_url`).
  - Create Server Action `subscribeToBio(profileId, email)` with rate limiting via Upstash Redis.
  - Build subscriber management dashboard component `SubscribersList.tsx` with CSV export capability.

---

<a id="day-4"></a>
#### Day 4 — Tuesday, Aug 4 | ✨ Feature
##### Bio: Pin Important Links & Sensitive Content Warning
- **Why**: 
  1. *Pinned Links*: Creators want high-priority links (e.g. latest product drop, live stream, or urgent announcement) anchored at the top regardless of search filters or reordering.
  2. *Sensitive Content Warning*: Creators in mature/affiliate niches require an age gate or content warning overlay before visitors reveal sensitive links, ensuring compliance.
- **Implementation Blueprint**:
  - Add `is_pinned: boolean` and `is_sensitive: boolean` columns to `bio_links`.
  - Pin links to top container in public rendering view.
  - Render blur backdrop filter overlay (`backdrop-blur-md`) with an interactive "18+ / Sensitive Content — Click to View" button for sensitive links.

---

<a id="day-5"></a>
#### Day 5 — Wednesday, Aug 5 | ✨ Feature
##### Bio: Custom Domain Mapping Engine
- **Why**: Serious creators and brands want bio pages hosted on their own custom domain (e.g., `links.creator.com`) rather than standard `kytbox.app/[username]`, enhancing brand authority.
- **Implementation Blueprint**:
  - Create `custom_domains` table (`id`, `user_id`, `profile_id`, `domain`, `status: 'pending' | 'verified'`).
  - Next.js Proxy/Middleware domain rewrite in `src/proxy.ts`:
    ```typescript
    if (hostname !== 'kytbox.app' && hostname !== 'localhost') {
      const profile = await getProfileByDomain(hostname)
      if (profile) return NextResponse.rewrite(new URL(`/${profile.username}`, req.url))
    }
    ```
  - Implement DNS TXT verification check `verifyCustomDomain(domain)`.

---

<a id="day-6"></a>
#### Day 6 — Thursday, Aug 6 | 🧪 Testing
##### Bio: Creator Features E2E Test Suite
- **Why**: Ensure zero regressions across custom domain rewrites, SEO head metadata, lead capture submissions, pinned link orders, and sensitive content blur overlays.
- **Implementation Blueprint**:
  - Playwright test suite in `tests/e2e/bio-creator-features.spec.ts`.
  - Automated testing for form validation, domain routing mocks, and modal state toggles.

---

<a id="day-7"></a>
#### Day 7 — Friday, Aug 7 | 🔧 Audit
##### Weekly Sprint Audit & Security Boundary Check
- **Why**: Verify strict DTO boundaries, zero client-side schema leaks, CSP compliance for custom thumbnail assets, and code quality across Week 1.
- **Implementation Blueprint**:
  - Run pre-commit audit checks and `npx tsc --noEmit` validation.

---

### Week 2 — Cashflow Power Features (Aug 8 - Aug 14)

<a id="day-8"></a>
#### Day 8 — Saturday, Aug 8 | ✨ Feature
##### Cashflow: Split Transactions Engine
- **Why**: A single receipt (e.g. $150 Supermarket bill) often contains multiple budget categories ($100 Grocery + $50 Home Cleaning). Split transactions allow one payment to be allocated accurately across multiple categories.
- **Implementation Blueprint**:
  - Create `cashflow_split_entries` child table (`id`, `parent_entry_id`, `item_name`, `category`, `amount`, `created_at`).
  - Build interactive line-item breakdown UI in transaction modal with live auto-sum total calculation.
  - Enforce server-side balance validation `validateSplitTotal(parentAmount, splits)` enforcing `sum(splits.amount) === parentAmount`.

---

<a id="day-9"></a>
#### Day 9 — Sunday, Aug 9 | ✨ Feature
##### Cashflow: CSV / Bank Transaction Import & Category Auto-Parser
- **Why**: Manual data entry is the biggest friction point in budgeting apps. Uploading bank CSV statements auto-parses dates, amounts, descriptions, and auto-assigns categories via rule matching.
- **Implementation Blueprint**:
  - Client-side CSV parser utilizing `PapaParse`.
  - Interactive column mapping dialog allowing users to map `Date`, `Description`, `Amount`, `Type`.
  - Auto-categorization engine `autoCategorize(description)` matching keywords (e.g. "Uber" -> "Transport", "Starbucks" -> "Food").

---

<a id="day-10"></a>
#### Day 10 — Monday, Aug 10 | ✨ Feature
##### Cashflow: Monthly Comparison View
- **Why**: Users need side-by-side financial comparisons ("July vs August") to spot spending spikes, evaluate saving performance, and measure category variances over time.
- **Implementation Blueprint**:
  - Comparison calculation helper `compareMonths(monthA, monthB)` returning delta percentages (`+15% income`, `-8% spending`).
  - Render responsive dual-bar comparison chart and category diff table in `MonthlyComparison.tsx`.

---

<a id="day-11"></a>
#### Day 11 — Tuesday, Aug 11 | ✨ Feature
##### Cashflow: Custom Tags & Labels Engine
- **Why**: Standard categories (Food, Transport) are too rigid. Users need flexible multi-tag filtering across categories (e.g. tagging entries as `#TaxDeductible`, `#ClientProjectA`, or `#Vacation2026`).
- **Implementation Blueprint**:
  - Add `tags: string[]` array column to `cashflow_entries`.
  - Build Tag Picker input with color badge support.
  - Implement multi-tag filter helper `filterEntriesByTags(entries, selectedTags)`.

---

<a id="day-12"></a>
#### Day 12 — Wednesday, Aug 12 | ✨ Feature
##### Cashflow: Receipt & Attachment Upload
- **Why**: Freelancers and business owners require receipt proof for tax compliance and expense audit tracking. Attaching receipt photos directly to cashflow entries (or split parent entries) prevents lost invoices and simplifies accounting.
- **Implementation Blueprint**:
  - Add `receipt_url: string | null` column to `cashflow_entries`.
  - Integrate Supabase Storage bucket `cashflow-receipts`.
  - Build modal image lightbox viewer component `src/features/cashflow/components/ReceiptLightbox.tsx`.

---

<a id="day-13"></a>
#### Day 13 — Thursday, Aug 13 | 🧪 Testing
##### Cashflow: Advanced Features E2E Test Suite
- **Why**: Guarantee financial math precision, receipt file upload handling, CSV import parsing accuracy, and split entry total validations.
- **Implementation Blueprint**:
  - Playwright test suite `tests/e2e/cashflow-advanced.spec.ts`.
  - Assertions for split entry calculations and CSV parsing logic.

---

<a id="day-14"></a>
#### Day 14 — Friday, Aug 14 | 🔧 Audit
##### Weekly Sprint Audit & Financial Calculation Precision Check
- **Why**: Ensure zero floating-point rounding errors (`0.1 + 0.2` issue) across split transactions and month comparisons, enforcing integer cents or precise Decimal calculations.
- **Implementation Blueprint**:
  - Verify unit tests in `src/features/cashflow/__tests__/math.test.ts`.

---

### Week 3 — List App Tasks & Productivity (Aug 15 - Aug 21)

<a id="day-15"></a>
#### Day 15 — Saturday, Aug 15 | ✨ Feature
##### List: Card Due Dates & Reminders
- **Why**: Tasks without deadlines get forgotten. Adding due dates with urgency color badges ("Due Today", "Overdue") and optional push/email reminders ensures timely execution.
- **Implementation Blueprint**:
  - Add `due_date: string | null`, `reminder_sent: boolean` columns to `list_cards`.
  - Date picker UI with relative date badges (`formatDistanceToNow`).
  - Scheduled background cron task triggering notifications for upcoming due dates.

---

<a id="day-16"></a>
#### Day 16 — Sunday, Aug 16 | ✨ Feature
##### List: Card Subtasks & Checklist Engine
- **Why**: Complex todo items need sub-steps (e.g., "Launch Marketing Campaign" → ☐ Write Copy ☐ Design Graphics ☐ Schedule Posts). Interactive subtasks show progress bars directly on cards.
- **Implementation Blueprint**:
  - Create `list_subtasks` table (`id`, `card_id`, `title`, `is_completed`, `position`).
  - Build `CardChecklist.tsx` component with drag-sortable subtask items and visual progress bar (`completed / total * 100`).

---

<a id="day-17"></a>
#### Day 17 — Monday, Aug 17 | ✨ Feature
##### List: Pre-built Board Templates
- **Why**: New users often face "blank canvas syndrome". Pre-built board templates (e.g., *Sprint Board*, *Content Calendar*, *Weekly Planner*, *Bug Tracker*) allow 1-click board creation.
- **Implementation Blueprint**:
  - Define templates JSON structure in `src/features/list/templates.ts`.
  - Build Server Action `createBoardFromTemplate(templateId)` pre-populating columns and starter cards.

---

<a id="day-18"></a>
#### Day 18 — Tuesday, Aug 18 | ✨ Feature
##### List: Card Priority Levels & Filtering
- **Why**: When boards contain dozens of cards, users need visual indicators to focus on high-impact work. Priority flags (`Urgent`, `High`, `Medium`, `Low`) enable instant sorting and filtering.
- **Implementation Blueprint**:
  - Add `priority: 'urgent' | 'high' | 'medium' | 'low'` column to `list_cards`.
  - Render color-coded badges (`Urgent` = Red, `High` = Orange, `Medium` = Blue, `Low` = Gray).
  - Add column-level priority sort and filter dropdown.

---

<a id="day-19"></a>
#### Day 19 — Wednesday, Aug 19 | ✨ Feature
##### List: Card Attachments
- **Why**: Tasks often require reference material (design mockups, PDFs, screenshots). Attaching files directly to list cards keeps project context centralized.
- **Implementation Blueprint**:
  - Create `list_card_attachments` table (`id`, `card_id`, `file_name`, `file_url`, `file_size`, `mime_type`).
  - Integrate Supabase Storage bucket `card-attachments` with preview lightbox for images.

---

<a id="day-20"></a>
#### Day 20 — Thursday, Aug 20 | 🧪 Testing
##### List: Advanced Features E2E Test Suite
- **Why**: Verify drag-and-drop column movements, subtask progress calculations, priority filtering, and attachment uploads without UI regressions.
- **Implementation Blueprint**:
  - Playwright test suite `tests/e2e/list-advanced.spec.ts`.

---

<a id="day-21"></a>
#### Day 21 — Friday, Aug 21 | 🔧 Audit
##### Weekly Sprint Audit & Accessibility (WCAG 2.2)
- **Why**: Ensure all modal dialogs, date pickers, priority flag dropdowns, and subtask checklists support keyboard accessibility (`Tab`, `Space`, `Enter`, `Escape`) and ARIA roles.
- **Implementation Blueprint**:
  - Run automated accessibility tests via `@axe-core/playwright`.

---

### Week 4 — Platform Security & Search Features (Aug 22 - Aug 28)

<a id="day-22"></a>
#### Day 22 — Saturday, Aug 22 | 🛡️ Security
##### Platform: Two-Factor Authentication (TOTP 2FA Setup)
- **Why**: Account security is paramount. Time-based One-Time Password (TOTP) 2FA using Google Authenticator / 1Password builds user trust and protects sensitive financial/bio data.
- **Implementation Blueprint**:
  - Add `two_factor_secret`, `two_factor_enabled: boolean` columns to `profiles`.
  - Generate QR code string using `otplib` and render SVG via `qrcode` npm package.
  - Verify TOTP token on setup completion.

---

<a id="day-23"></a>
#### Day 23 — Sunday, Aug 23 | 🛡️ Security
##### Platform: 2FA Challenge at Auth Boundary & Recovery Codes
- **Why**: Enabling 2FA must enforce a verification code prompt during login and sensitive account changes, alongside 10 single-use emergency recovery codes if users lose their authenticator device.
- **Implementation Blueprint**:
  - Store hashed `recovery_codes: string[]` on `profiles`.
  - Middleware/proxy 2FA session verification flag `is_2fa_verified`.
  - Build recovery code generation modal `RecoveryCodesModal.tsx`.

---

<a id="day-24"></a>
#### Day 24 — Monday, Aug 24 | ✨ Feature
##### Platform: Workspace Global Search (`Cmd+K`)
- **Why**: Searching through separate app tabs is slow. A unified global search palette (`Cmd+K` / `Ctrl+K`) allows users to search across Bio links, Cashflow entries, List cards, and Support tickets in under 50ms.
- **Implementation Blueprint**:
  - Integrate `cmdk` dialog UI component.
  - Build Server Action `globalSearch(query)` executing parallel indexed queries across `bio_links`, `cashflow_entries`, `list_cards`, and `support_tickets`.

---

<a id="day-25"></a>
#### Day 25 — Tuesday, Aug 25 | 🛡️ Security
##### Platform: One-Click GDPR Data Export
- **Why**: Users own their data. Providing a simple "Export All Data" button generates a downloadable encrypted JSON/ZIP file containing all profile links, financial books, todo boards, and settings.
- **Implementation Blueprint**:
  - Build data exporter function `exportUserData(userId)` gathering all user records into JSON files.
  - Zip files using `JSZip` and stream down as `kytbox-export-[date].zip`.

---

<a id="day-26"></a>
#### Day 26 — Wednesday, Aug 26 | 🛡️ Security
##### Platform: Session Management Dashboard
- **Why**: Users need visibility into where their account is logged in (Browser, OS, IP address, Last Active) and the ability to remotely revoke suspicious active sessions.
- **Implementation Blueprint**:
  - Track session metadata in `user_sessions` table.
  - Render active session list UI with "Revoke Session" action in `src/features/auth/components/SessionManager.tsx`.

---

<a id="day-27"></a>
#### Day 27 — Thursday, Aug 27 | 🧪 Testing
##### Platform: Security & Search E2E Test Suite
- **Why**: Validate TOTP challenge enforcement, global search palette keyboard navigation (`Cmd+K`), session revocation, and data export download completeness.
- **Implementation Blueprint**:
  - Playwright test suite `tests/e2e/platform-security.spec.ts`.

---

<a id="day-28"></a>
#### Day 28 — Friday, Aug 28 | 🔧 Audit
##### Weekly Sprint Audit & System Integrity Verification
- **Why**: Perform audit check on security DTO boundaries, environment variable Zod validation, and TypeScript strict compliance.
- **Implementation Blueprint**:
  - Pre-commit check and full typecheck verification.

---

### Week 5 — Internationalization & Retrospective (Aug 29 - Aug 31)

<a id="day-29"></a>
#### Day 29 — Saturday, Aug 29 | 🌐 i18n
##### Platform: Multi-language Framework Setup (`next-intl`)
- **Why**: International expansion unlocks global user acquisition. Setting up `next-intl` localization framework enables seamless translation across English, Indonesian, and Spanish.
- **Implementation Blueprint**:
  - Configure `next-intl` routing middleware.
  - Create translation dictionary files `messages/en.json`, `messages/id.json`, and `messages/es.json`.

---

<a id="day-30"></a>
#### Day 30 — Sunday, Aug 30 | 🌐 i18n
##### Platform: Locale Switcher & Translation Dictionaries
- **Why**: Users need an easy way to toggle language preferences from the header/settings menu, dynamically switching UI strings across all 5 app modules without page reloads.
- **Implementation Blueprint**:
  - Build `<LocaleSwitcher />` dropdown component.
  - Replace hardcoded UI strings with translation hooks (`useTranslations('Bio')`, `useTranslations('Cashflow')`).

---

<a id="day-31"></a>
#### Day 31 — Monday, Aug 31 | 📋 Planning
##### August 30-Day Sprint Retrospective & September Planning
- **Why**: Reflect on 31 days of feature delivery, measure velocity improvements, celebrate wins, and draft the September roadmap!
- **Implementation Blueprint**:
  - Compile August retrospective report.
  - Draft September Roadmap and celebrate 🎉.

---

## 📊 Summary Breakdown

| Category | Days | Primary Deliverables |
| :--- | :---: | :--- |
| 🔗 **Bio App** | 6 | SEO Editor, Custom Thumbnails, Lead Capture, Pinned Links, Custom Domains, Bio E2E |
| 💰 **Cashflow App** | 6 | Receipt Uploads, CSV Bank Import, Monthly Comparison, Custom Tags, Split Transactions, Cashflow E2E |
| 📋 **List App** | 6 | Due Dates & Reminders, Subtasks, Board Templates, Priority Levels, Card Attachments, List E2E |
| 🛡️ **Platform Security** | 6 | TOTP 2FA, 2FA Enforcement, Global Search, GDPR Data Export, Session Manager, Platform E2E |
| 🌐 **Platform / i18n** | 3 | Internationalization Setup, Locale Translations, Retrospective & Planning |

---

## 🔮 Future Ideas Backlog (Next 30 Days+)

> [!NOTE]
> Ideas that didn't make this sprint but are **worth building**. Organized by app. Impact rated 🔥🔥🔥 (high) to 🔥 (nice-to-have). Pull from this list when planning the next sprint.

---

### 🔗 Bio App

| Idea | Description | Impact | Effort |
| --- | --- | --- | --- |
| **Link A/B Testing** | Show 2 versions of a link (different titles/positions), track which gets more clicks | 🔥🔥 | ~5h |
| **Link Expiry Countdown** | Display a visible countdown timer on expiring links ("Expires in 2h 30m") | 🔥🔥 | ~2h |
| **Testimonials Widget** | Display customer reviews/testimonials on bio page | 🔥🔥 | ~3h |
| **Bio Page Password Protection** | Password-protect entire bio page or specific folders | 🔥 | ~3h |
| **Custom CSS Editor** | Power users write their own CSS for full customization beyond themes | 🔥 | ~3h |
| **Bio Music Player** | Persistent audio player widget (not embed). Auto-play a track on land | 🔥 | ~4h |
| **Link Click Heatmap** | Visual heatmap showing which links get clicked most by position on page | 🔥🔥 | ~4h |
| **Contact Form Widget** | Embeddable contact form on bio page. Messages go to support inbox | 🔥🔥 | ~3h |
| **Bio Page Views Counter** | Display "X,XXX profile views" publicly on bio page | 🔥 | ~1h |
| **Animated Link Previews** | Hover/tap shows a mini preview of the destination URL | 🔥 | ~4h |
| **Multi-page Bio** | Multiple bio pages per user (personal, business, portfolio) | 🔥🔥 | ~6h |

---

### 💰 Cashflow App

| Idea | Description | Impact | Effort |
| --- | --- | --- | --- |
| **Bulk Edit/Delete** | Select multiple entries → change category, delete, or shift dates | 🔥🔥 | ~3h |
| **PDF Report Export** | Generate a formatted PDF summary (income, expense, charts, budgets) | 🔥🔥 | ~4h |
| **Expense Splitting** | Splitwise-style shared expenses ("Alice owes Bob $20 for dinner") | 🔥🔥 | ~6h |
| **Net Worth Tracker** | Track total assets + liabilities across all cashflow books | 🔥🔥 | ~4h |
| **Currency Conversion** | Multi-currency cashflows with auto-conversion rates | 🔥 | ~5h |
| **Cashflow Sharing via Public Link** | Send a link, recipient views/edits without needing an account | 🔥🔥 | ~4h |
| **Cashflow Templates** | Pre-built templates ("Freelancer Monthly", "Household Budget") | 🔥🔥 | ~2h |
| **Financial Insights** | AI-generated insights ("Your food spending is 30% higher than last month") | 🔥🔥🔥 | ~4h |
| **Debt Snowball/Avalanche Tracker** | Track multiple debts with payoff strategies | 🔥🔥 | ~5h |

---

### 📋 List App

| Idea | Description | Impact | Effort |
| --- | --- | --- | --- |
| **Calendar View** | View Todo cards with due dates on a calendar grid | 🔥🔥 | ~5h |
| **Assign to Collaborators** | Assign cards to specific people when sharing is active | 🔥🔥 | ~4h |
| **Wishlist Price Alerts** | Auto-scrape price from `purchase_url`, notify when price drops | 🔥🔥🔥 | ~6h |
| **Import from Trello/Notion** | JSON/CSV import for users migrating from competitor tools | 🔥🔥 | ~4h |
| **Card Comments** | Comment thread on each card for discussions | 🔥 | ~3h |
| **Recurring Tasks** | "Every Monday: Review PRs". Auto-creates cards on schedule | 🔥🔥 | ~4h |
| **Archiving** | Archive completed boards instead of deleting | 🔥 | ~2h |
| **Wishlist Price Comparison** | Compare prices across multiple stores for the same item | 🔥 | ~3h |
| **List Sharing with ACL** | Share lists with read/edit permissions | 🔥🔥🔥 | ~5h |
| **Kanban WIP Limits** | Set maximum cards per column ("In Progress: max 3") | 🔥 | ~2h |

---

### 🏗️ Platform-Level

| Idea | Description | Impact | Effort |
| --- | --- | --- | --- |
| **Browser Extension** | Quick-add links to Bio from any webpage | 🔥🔥 | ~6h |
| **Telegram/Discord Bot** | Add cashflow entries or check bio stats from chat | 🔥🔥 | ~5h |
| **API Access + Webhooks** | Public developer API for integrations and webhooks | 🔥🔥 | ~6h |
| **Mobile App (Capacitor)** | Wrap PWA as native iOS/Android app via Capacitor | 🔥🔥🔥 | ~8h |
| **Team Workspaces** | Multiple users, one workspace with role-based access control | 🔥🔥🔥 | ~10h |
| **Keyboard Shortcuts Guide** | `?` key opens full shortcut reference overlay | 🔥 | ~1h |
| **Changelog Page** | `/changelog` — public page showing latest updates | 🔥🔥 | ~2h |
| **Public Roadmap** | `/roadmap` — voteable public roadmap | 🔥🔥 | ~4h |
| **Referral System** | "Invite friends, get perks." Viral growth loop | 🔥🔥🔥 | ~5h |
| **Dark/Light per App** | Dashboard in dark mode, bio page in custom theme | 🔥 | ~2h |
| **Email Notifications** | Opt-in email digests: weekly analytics summary, budget alerts | 🔥🔥 | ~4h |
| **OAuth: Apple + GitHub** | Additional OAuth providers beyond Google | 🔥🔥 | ~3h |

---

### 💵 Monetization (When Ready)

| Idea | Description | Impact | Effort |
| --- | --- | --- | --- |
| **`canAccess()` Feature Gate** | Utility function to check user tier before showing Pro features | 🔥🔥🔥 | ~1h |
| **Lemon Squeezy Integration** | Payment processing via MoR. Subscriptions table, webhooks | 🔥🔥🔥 | ~8h |
| **Upgrade UI + Paywalls** | "Upgrade to Pro" buttons, feature comparison modal | 🔥🔥🔥 | ~4h |
| **Usage Analytics Dashboard** | Admin page showing MRR, churn rate, conversion rate | 🔥🔥 | ~4h |
| **Trial Period** | 14-day free trial of Pro features with auto-downgrade | 🔥🔥 | ~3h |
| **Pricing Page** | `/pricing` — public pricing comparison page | 🔥🔥🔥 | ~3h |

---

### 📊 Infrastructure (When Scale Demands)

| Idea | Description | Impact | Effort |
| --- | --- | --- | --- |
| **Load/Stress Testing** | k6 or Artillery — simulate 1000 concurrent users on public profiles | 🔥🔥 | ~3h |
| **Domain-Driven Feature Folders Refactor** | Move to vertical slice feature folders for better code organization at scale | 🔥🔥 | ~10h+ |
| **Visual Regression CI** | Auto-compare Playwright screenshots on every PR | 🔥🔥 | ~3h |
| **Staging Environment** | Separate Supabase project + Vercel preview branch | 🔥🔥🔥 | ~4h |
| **Database Read Replicas** | Read from replica, write to primary when query load justifies it | 🔥 | ~4h |
| **Edge Functions** | Move heavy/frequent queries to Supabase Edge Functions | 🔥 | ~4h |
| **Rate Limit Dashboard** | Admin view of rate limit hits | 🔥 | ~2h |
| **Automated DB Backups** | Scheduled Supabase backups with point-in-time recovery testing | 🔥🔥🔥 | ~2h |

---

_Last Updated: August 7, 2026_
