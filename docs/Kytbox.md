# Kytbox — Product Specification

This document defines how Kytbox works as a platform.

Kytbox is not a single app.
Kytbox is a system that hosts multiple apps.

If implementation or future decisions conflict with this document:
THIS DOCUMENT WINS.

---

## 1. Product Overview

Kytbox is a personal utility platform.

Users create one account and access multiple tools (apps) under that account.

Examples of Kytbox apps:

- Bio (public-facing)
- Cashflow (private / shareable)
- List (private / shareable)
- Track (private)
- Lookup (search-based)

Kytbox is closer to Google than to a link-in-bio product.
Bio is the first surface, not the identity.

---

## 2. Identity Model

Kytbox uses layered identity.

### 2.1 Account (Primary Identity)

- Internal immutable ID
- Never changes
- Never exposed publicly
- All apps attach to this ID

This is the real identity in Kytbox.

---

### 2.2 Username (Public Alias)

- Human-readable public handle
- Used in public URLs
- Changeable with rules
- Not the primary identity

A username is an alias, not ownership of the account.

---

### 2.3 Display Name (Cosmetic)

- Free text
- Emoji allowed
- Editable anytime
- Not used in URLs

Example:
Username: john-doe-92  
Display name: John Doe 🚀

---

## 3. App Model

Kytbox hosts multiple apps under one account.

Apps fall into three categories:

1. Public apps (identity-based)
2. Private apps (tool-based)
3. Search apps (query-based)

Apps must respect category boundaries.

---

## 4. URL & Routing Rules

### 4.1 Public Identity Routes

Used for public-facing apps.

Pattern:

- /{username} — default public surface (renders Bio)
- /{username}/list — public list page (future, if sharing enabled)

Note: `/{username}` and `/{username}/bio` are equivalent. The shorter form is canonical.

Rules:

- Public
- Shareable
- SEO-indexable
- No login required
- Identity-based

No /u, /profile, or internal prefixes.

---

### 4.2 Private App Routes

Used for logged-in tools.

Pattern:

- /app - platform home
- /bio - bio dashboard
- /cashflow - cashflow dashboard
- /settings - account settings
- /support - user support

Rules:

- Login required
- Never indexed
- Used for edits, settings, analytics

If it modifies data, it belongs here.

---

### 4.3 Search-Based Routes

Used for queries, not people.

Pattern:

- /lookup
- /lookup/\*

Rules:

- Query-driven
- No ownership implied
- High privacy sensitivity
- Never attached to usernames

---

## 5. Reserved Routes & Usernames

These values must never be claimable as usernames:

login
signup
pricing
about
help
support
support-admin
app
bio
cashflow
list
track
lookup
admin
api
blog
terms
privacy
www

If a route exists now or may exist later, it is permanently reserved.

If a user attempts to claim a reserved username, show the error:

> "This username is reserved"

---

## 6. Username Rules

Usernames are public aliases, not user IDs.

### Allowed

- lowercase letters a–z
- numbers 0–9
- single hyphen (-), not at start or end

### Disallowed

- uppercase letters
- spaces
- underscore
- dot
- emoji
- non-ASCII characters
- consecutive hyphens

### Length

- Minimum 3 characters
- Maximum 20 characters

### Case Handling

- Case-insensitive
- Stored as lowercase

Example:
JohnDoe → johndoe

### Uniqueness

- Global
- First-come
- No auto-numbering
- Users must choose their own username at signup

If the desired username is taken, the user must pick a different one.
No fallback like `username_1` or `username-2`.

---

## 7. Username Change Policy

Kytbox allows username changes with restrictions.

Usernames are public aliases, not cosmetic labels.

Rules:

- Username changes allowed with cooldown (30–180 days)
- Previous usernames become permanently reserved
- Old usernames always redirect to the new username
- Old usernames can never be reused
- Changing back is not allowed

Requirements:

- Explicit user confirmation
- Clear warning before rename
- Cooldown enforced at system level

Purpose:

- Preserve link permanence
- Prevent impersonation
- Protect QR codes and shared links
- Maintain long-term trust

Display names and content remain fully editable.

---

## 8. Kytbox Bio (First App Only)

Kytbox Bio is:

- the first public-facing app
- a distribution surface
- a validation tool

Kytbox Bio is not the identity root.
Other apps must not inherit Bio-specific assumptions.

---

## 9. Product Discipline

Kytbox is not:

- a super app
- a feature playground
- a clone of any single product

Feature admission rule:
A feature is allowed only if it improves:

- Activation
- Retention
- Revenue

Otherwise, reject it.

---

## 10. Kill Criteria (Bio-Specific)

These apply to Kytbox Bio specifically, not the entire platform.

30 days after Kytbox Bio launch, stop or pivot Bio if:

- Activation < 25%
- Retention < 10%
- No payment intent

No exceptions.
No "just one more feature".

Note: If Bio fails, the platform can pivot to other apps (List, Track, etc.).

---

## 11. Core Principles

- Platform > Feature
- Identity > UI
- Mobile-First > Desktop-First
- Trust > Flexibility
- Focus > Ambition
- Shipping > Overthinking

---

## 12. Market Positioning

### 12.1 Kytbox Bio vs. Competitors

| Feature Pillar    | Standard (Linktree) | Creator (Beacons) | **Kytbox**                             |
| :---------------- | :------------------ | :---------------- | :------------------------------------- |
| **Organization**  | Flat List           | Flat List         | **Nested Folders** (Differentiator)    |
| **Discovery**     | Scrolling           | Scrolling         | **Sticky Search Bar** (Differentiator) |
| **Customization** | Presets Only        | Full Control      | **Hybrid** (Presets + CSS Variables)   |
| **Analytics**     | Clicks/Views        | Clicks/Sales      | Clicks/Referrers                       |
| **Monetization**  | Redirection         | Tip Jar / Store   | Redirection (Planned: Feature Gate)    |

**V1 Status: ~90% Launch Ready.** Technically superior to Linktree via Folders + Search. Gaps vs. Beacons:

| Gap | Impact |
| :-- | :----- |
| **Lead Capture / Email Newsletter** | High — creators prioritize owned lists over social followers |
| **Content Embedding** (YouTube/Spotify) | Medium — keeps users on page longer |
| **Advanced SEO Metadata Editor** | High (Pro Feature) — critical for affiliate SEO |
| **QR Code Generator** | Low/Medium — useful for offline marketing |

---

### 12.2 Kytbox Cashflow vs. Competitors

| Feature Pillar    | Standard (YNAB/Mint) | Simple (Splitwise) | **Kytbox**                             |
| :---------------- | :------------------- | :----------------- | :------------------------------------- |
| **Logic**         | Zero-Based Budgeting | Debt Tracking Only | **Multi-Book Tracking**                |
| **Collaboration** | Household Sharing    | Group Expenses     | **Granular ACL** (Owner/Editor/Reader) |
| **Recurrence**    | Manual / Auto        | Basic Recurring    | **Prorated vs Exact** (Advanced)       |
| **Portability**   | Full Export          | Basic CSV          | **CSV Export**                         |
| **Visuals**       | Complexity First     | List First         | **Dashboard First**                    |

**V1 Status: ~95% Launch Ready.** Strongest differentiator is collaborative tracking with granular ACL. Remaining gaps:

| Gap | Impact |
| :-- | :----- |
| **Receipt/Attachment Support** | High for business/freelance tax records |
| **Bulk Transaction Editing** | Medium — power-user quality of life |

---

## App Dashboards (Platform Shell + App Scope)

Kytbox uses a **single platform shell** with **app-scoped dashboards**.

Principle:

- The platform shell handles **account-level** concerns (identity, billing, security, navigation).
- Each app handles **its own work**, settings, analytics, and permissions.

This prevents a “mega-dashboard” and keeps apps clean as Kytbox grows.

---

### 1) Platform Shell (Global, Logged-in)

Root:

- `/app`

Purpose:

- App switcher / navigation
- Account settings
- Billing & plan
- Security (password/OAuth, sessions)
- Global notifications (future)

Rule:

> The platform shell is for **identity + navigation**, not app work.

---

### 2) App Dashboards (Where Work Happens)

Each app gets its own dashboard under `/app/{app}`.

Examples:

- `/app/bio`
- `/app/cashflow`
- `/app/list`
- `/app/track`
- `/app/lookup` (only if this app exists)

App dashboards own:

- Data for that app
- App settings
- App analytics
- App permissions (public/share toggles)

Rule:

> If the user is “doing work”, they must be inside an **app dashboard**.

---

### 3) Public Surfaces (View / Share Only)

Public routes are identity-based and **not dashboards**.

Examples:

- `/{username}` (default public surface, typically Bio)
- `/{username}/bio`
- `/{username}/list` (if sharing enabled)

Rules:

- No editing on public routes
- No private analytics visible on public routes
- Public pages are shareable and may be indexed (as allowed)

---

### 4) Suggested Routing Map (Concrete)

Logged-in:

- `/app` → platform home
- `/settings` → account settings
- `/support` → User support portal
- `/support-admin` → Admin support dashboard
- `/bio` → Bio dashboard (Links + Appearance)
- `/bio/analytics` → Bio analytics
- `/cashflow` → Cashflow dashboard
- `/settings` → Account settings
- `/app/lookup` → Lookup (Search)

Public:

- `/{username}` → public Bio surface
- `/{username}/bio` → public Bio page
- `/{username}/list` → public List page (optional)

---

### 5) Non-Negotiable Separation Rules

- Do not mix app data across dashboards
- Do not put app settings under `/app/settings`
- Do not allow editing on public routes
- Do not index `/app/*` (must be private)

## Status

Product: Kytbox  
Phase: Platform + Bio v1  
Rule: This document defines how Kytbox works

---

_Last Updated: March 11, 2026_

## Implementation Status

### ✅ Implemented

| Section | Feature                            | Status  |
| ------- | ---------------------------------- | ------- |
| §4.1    | Public route `/{username}`         | ✅ Done |
| §4.2    | Private routes `/app/*`            | ✅ Done |
| §4.2    | Support routes `/support*`         | ✅ Done |
| §5      | Reserved usernames                 | ✅ Done |
| §6      | Username format (a-z, 0-9, hyphen) | ✅ Done |
| §6      | No auto-numbering on duplicate     | ✅ Done |
| §6      | Case-insensitive, stored lowercase | ✅ Done |
| §11     | Platform shell at `/app`           | ✅ Done |
| §11     | Bio dashboard at `/app/bio`        | ✅ Done |
| §11     | Settings at `/settings`            | ✅ Done |
| §11     | robots.txt blocking `/app/*`       | ✅ Done |
| §8      | Custom High-Performance Themes     | ✅ Done |
| §12.4   | High-Performance Page Caching      | ✅ Done |
| §12.4   | `'use cache'` Implementation       | ✅ Done |
| §9      | Bio Dashboard Hybrid Sync Engine   | ✅ Done |
|         | List App App & Database API        | ✅ Done |


### 🔜 Deferred to Post-Launch

| Section | Feature                                          | Notes                  |
| ------- | ------------------------------------------------ | ---------------------- |
| §7      | Username change cooldown (30-180 days)           | Not needed until scale |
| §7      | Permanent reservation of old usernames           | Not needed until scale |
| §7      | Old username redirect to new                     | Not needed until scale |
| §4.1    | `/{username}/bio`, `/{username}/list` sub-routes | Bio only for now       |
| §4.3    | `/id/*` search routes                            | Future app             |

---

## 12. Technical Architecture

### 12.1 Performance & Loading States

Kytbox prioritizes perceived performance using Next.js Streaming SSR.
For implementation details and coverage status, see: [Loading States Documentation](./LOADING_STATES.md)

### 12.2 App Documentation

- [Bio Documentation](./link-in-bio.md)
- [Cashflow Documentation](./cashflow.md)
- [List Documentation](./list.md)
- [Monetization Strategy](./MONETIZATION.md)
- [Pre-Monetization Improvements](./PRE_MONETIZATION_IMPROVEMENTS.md)

### 12.3 Complete Route Reference

All page routes in Kytbox with their rendering type and auth requirements:

| Route                  | Render     | Auth      | Description                      |
| ---------------------- | ---------- | --------- | -------------------------------- |
| `/`                    | Dynamic    | No        | Landing page                     |
| `/login`               | Static     | No        | Login form                       |
| `/signup`              | Static     | No        | Signup form                      |
| `/forgot-password`     | Static     | No        | Password reset request           |
| `/update-password`     | Static     | No        | Password reset form              |
| `/onboarding`          | Static     | No        | Profile setup                    |
| `/app`                 | Dynamic    | Yes       | Platform home / app switcher     |
| `/bio`                 | Dynamic    | Yes       | Bio dashboard                    |
| `/bio/analytics`       | Dynamic    | Yes       | Bio analytics                    |
| `/cashflow`            | Dynamic    | Yes       | Cashflow list                    |
| `/cashflow/[id]`       | Dynamic    | Mixed     | Cashflow detail (public or auth) |
| `/list`                | Dynamic    | Yes       | List app hub                     |
| `/list/todo`           | Dynamic    | Yes       | Todo boards grid                 |
| `/list/wishlist`       | Dynamic    | Yes       | Wishlists grid                   |
| `/list/ideas`          | Dynamic    | Yes       | Idea lists grid                  |
| `/list/.../[id]`       | Dynamic    | Yes       | List detail boards               |
| `/settings`            | Dynamic    | Yes       | Account settings                 |
| `/support`             | Dynamic    | Yes       | User support portal              |
| `/support/[id]`        | Dynamic    | Yes       | Ticket thread view               |
| `/support/new`         | Static     | Yes       | Create new ticket                |
| `/support-admin`       | Dynamic    | Yes       | Admin support dashboard          |
| `/support-admin/[id]`  | Dynamic    | Yes       | Admin ticket reply view          |
| `/[username]`          | Dynamic    | No        | Public bio page                  |
| **Specialized Errors** | **Client** | **Mixed** | **Smart recovery boundaries**    |

### 12.4 Future Optimization Options

When scaling requires further performance improvements, consider these options:

Implemented and active in [next.config.ts](file:///next.config.ts).

Implemented and active in [data-cache.ts](file:///src/lib/data-cache.ts) for profile and link data.

#### Database Optimization

1. **Supabase Views** - Pre-join common queries (already using `cashflow_summaries`)
2. **Database Indexes** - Add indexes for frequently filtered columns
3. **Connection Pooling** - Use Supabase's built-in pgBouncer
4. **Edge Functions** - Move complex queries closer to users

#### CDN & Edge

1. **Vercel Edge Config** - Store static config at edge
2. **Image Optimization** - Already using `next/image`
3. **Static Generation** - Convert marketing pages to static where possible

#### Code-Level

1. **React `cache()`** - Dedupe requests within same render
2. **Suspense boundaries** - Stream non-critical content
3. **Dynamic imports** - Code-split heavy components
4. **Prefetching** - `<Link>` already prefetches on hover

#### Monitoring

- Vercel Speed Insights (already integrated)
- Core Web Vitals tracking
- Supabase Query Performance dashboard
