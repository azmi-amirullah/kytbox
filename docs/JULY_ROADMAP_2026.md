# 🗺️ Kytbox 30-Day Roadmap (July–August 2026)

**Start**: Saturday, July 11, 2026
**End**: Thursday, August 13, 2026
**Cadence**: 1 task/day, Sundays off
**Priority**: Feature > Performance > Stability > Security > Code Quality
**Philosophy**: Ship features first. Money later. Build a product people can't stop using before asking them to pay.

---

## 📊 Current State Audit (Saturday, July 11, 2026)

### ✅ What's Strong

| Area | Score | Details |
|---|---|---|
| **Bio App** | 9/10 | Nested folders, 13 themes + custom engine, link animations (pulse/bounce/glow), sticky search, pagination, drag-and-drop, social icon auto-detect, hybrid sync engine |
| **Cashflow App** | 9/10 | Charts (bar/area/donut), budgets, projections, recurring transactions, date filtering, CSV export, granular ACL sharing, categories |
| **List App** | 7/10 | Hub + Todo Kanban + Wishlist + Ideas. DnD within/across columns. 19 components. No empty states, no animations, no column reorder |
| **Support** | 8/10 | Tickets, admin queue with urgency scoring, read tracking, notification bell |
| **Security** | 10/10 | CSP with nonce, HSTS, edge auth, rate limiting (auth + actions), IDOR fixed, DTO boundary, origin validation |
| **Testing** | 6/10 | 6 unit tests (cashflow-math, currency, mappers, support-urgency, username, validation), 4 E2E (auth, bio, folders, security) |

### ❌ What's Missing

| Gap | Impact | Notes |
|---|---|---|
| No Command Palette | HIGH | Platform has 3 apps, 15+ routes. `cmdk` package installed but unused |
| Dead `/app` homepage | HIGH | Static app switcher. No daily engagement driver |
| No link scheduling | HIGH | Creators need time-limited links. Every competitor has this |
| No section headers | MEDIUM | Bio pages are flat without visual grouping |
| No recurring auto-gen | HIGH | Cashflow projections show upcoming but don't create entries |
| Country analytics unused | MEDIUM | `country` + `city` columns exist in `link_events`/`profile_events` but no UI |
| No onboarding tour | HIGH | New users get no guidance. Drop-off risk |
| No unified notifications | MEDIUM | Only support bell exists. No budget alerts, no milestone alerts |
| No error tracking | CRITICAL | Zero prod observability. Sentry needed |
| No PWA | MEDIUM | No install prompt, no offline shell |
| Stale docs | HIGH | All docs last updated March 2026 — 4 months behind |
| 7 pending audit items | MEDIUM | From AUDIT_JUNE_2026.md (#13-20) |

---

## 🗓️ Week 1: Platform-Level Power Features

---

### Day 1 — Saturday, Jul 11 | ✨ Feature

#### Command Palette (`Cmd+K` / `Ctrl+K`)

**Why**: Single feature that makes the entire platform feel 10x more professional. Quick-navigate, quick-create, quick-search — all without touching the mouse. The `cmdk` package is already in `package.json` (installed, zero usage). Ship it.

**Database Changes**: None

**Files to Create:**
- `src/components/command-palette.tsx` — Main palette component

**Files to Modify:**
- `src/app/(platform)/layout.tsx` — Mount `<CommandPalette />` inside platform layout
- `src/components/header.tsx` — Add trigger button (search icon + `⌘K` badge)

**Component Architecture:**
```
CommandPalette (client component)
├── Dialog (cmdk + Radix Dialog)
├── CommandInput (search field, auto-focused)
├── CommandList
│   ├── CommandGroup "Navigation"
│   │   ├── Bio Dashboard → /bio
│   │   ├── Cashflow → /cashflow
│   │   ├── List Hub → /list
│   │   ├── Settings → /settings
│   │   ├── Support → /support
│   │   └── Analytics → /bio/analytics
│   ├── CommandGroup "Quick Actions"
│   │   ├── Add Link → opens AddLinkModal (or navigates to /bio?action=add)
│   │   ├── Add Cashflow Entry → /cashflow?action=add
│   │   ├── New Todo Board → /list/todo?action=create
│   │   ├── New Wishlist → /list/wishlist?action=create
│   │   └── New Support Ticket → /support/new
│   └── CommandGroup "Theme"
│       ├── Toggle Dark Mode
│       └── Toggle Light Mode
└── CommandEmpty "No results found"
```

**Keyboard Handling:**
- `Cmd+K` / `Ctrl+K` → open palette
- `Escape` → close
- `↑` / `↓` → navigate items
- `Enter` → execute selected item
- Type to fuzzy filter

**Styling:**
- Backdrop blur (`backdrop-blur-sm bg-black/50`)
- Glass-morphism dialog (`bg-background/95 backdrop-blur-xl border border-border/50`)
- Framer Motion: slide down + fade in on open
- Input: no border, large text, placeholder "Type a command or search..."
- Items: hover highlight with `bg-accent`, icon + label + shortcut badge

**Dependencies**: `cmdk` (already installed), `framer-motion` (already installed)

**Acceptance Criteria:**
- [x] `Cmd+K` opens palette from any platform page
- [x] Fuzzy search filters all items
- [x] Selecting "Bio Dashboard" navigates to `/bio`
- [x] Selecting "Add Link" navigates to `/bio` with add modal context
- [x] Theme toggle works from palette
- [x] Palette closes on `Escape` or backdrop click
- [x] ARIA roles: `role="combobox"`, `aria-expanded`, `aria-activedescendant`
- [x] Keyboard-only navigation works (no mouse required)

---

### 🔴 Day 2 — Sunday, Jul 12 | 🔴 REST

---

### Day 3 — Monday, Jul 13 | ✨ Feature

#### Activity Feed Dashboard (`/app` Upgrade)

**Why**: Right now `/app` is a dead page — 4 static cards pointing to apps. Zero reason to visit daily. Transform it into a daily dashboard showing what's happening across all apps. This is the "Google Dashboard" philosophy from [Kytbox.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/Kytbox.md).

**Database Changes**: None (reads from existing tables)

**Files to Modify:**
- `src/app/(platform)/app/page.tsx` — Replace static cards with activity feed
- `src/config/apps.ts` — Ensure all apps are registered

**Files to Create:**
- `src/app/(platform)/app/components/ActivityFeed.tsx` — Client component
- `src/app/(platform)/app/components/QuickStats.tsx` — Stats row
- `src/app/(platform)/app/components/QuickActions.tsx` — Action buttons

**Page Architecture:**
```
AppHomePage (server component)
├── Quick Stats Row (3 cards)
│   ├── Bio: "X clicks this week" (from link_events, last 7d)
│   ├── Cashflow: "Balance: $X" (sum from owned cashflows)
│   └── List: "X active tasks" (from list_items where is_completed = false)
├── Quick Actions Row
│   ├── Button: "Add Link" → /bio
│   ├── Button: "Add Entry" → /cashflow
│   └── Button: "New Board" → /list/todo
├── Activity Feed (last 10 items across all apps)
│   ├── "You added 'Instagram' link to Bio" (from links.created_at)
│   ├── "Expense: $50 for Food" (from cashflow_entries.created_at)
│   ├── "Moved 'Deploy v2' to Completed" (from list_items, recent is_completed changes)
│   └── ...
└── App Switcher Cards (existing, pushed below)
```

**Server-Side Data Fetching** (all in parallel via `Promise.all`):
```typescript
const [bioStats, cashflowBalance, activeTaskCount, recentActivity] = await Promise.all([
  // Bio: clicks in last 7 days
  supabase.from('link_events')
    .select('id', { count: 'exact', head: true })
    .in('link_id', userLinkIds)
    .gte('created_at', sevenDaysAgo),

  // Cashflow: total balance across owned books
  supabase.from('cashflow_summaries')
    .select('balance')
    .eq('user_id', user.id),

  // List: active task count
  supabase.from('list_items')
    .select('id', { count: 'exact', head: true })
    .in('list_id', userListIds)
    .eq('is_completed', false),

  // Recent activity: last 10 across all apps
  // Union of recent links, entries, list_items by created_at
  supabase.rpc('get_recent_activity', { p_user_id: user.id, p_limit: 10 }),
]);
```

**New RPC Function** (migration):
```sql
CREATE OR REPLACE FUNCTION get_recent_activity(p_user_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE(
  type text,
  title text,
  context text,
  created_at timestamptz
) AS $$
  (SELECT 'link' AS type, title, 'Bio' AS context, created_at
   FROM links WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT p_limit)
  UNION ALL
  (SELECT 'entry' AS type, description AS title,
   CASE WHEN type = 'income' THEN 'Income' ELSE 'Expense' END AS context,
   created_at
   FROM cashflow_entries ce
   JOIN cashflows c ON ce.cashflow_id = c.id
   WHERE c.user_id = p_user_id ORDER BY ce.created_at DESC LIMIT p_limit)
  UNION ALL
  (SELECT 'task' AS type, li.title, l.title AS context, li.created_at
   FROM list_items li
   JOIN lists l ON li.list_id = l.id
   WHERE l.user_id = p_user_id ORDER BY li.created_at DESC LIMIT p_limit)
  ORDER BY created_at DESC LIMIT p_limit;
$$ LANGUAGE sql SECURITY DEFINER;
```

**Styling:**
- Quick Stats: 3 cards in a row (`grid grid-cols-1 md:grid-cols-3 gap-4`), each with icon + value + label
- Activity Feed: timeline-style list with relative timestamps ("2 hours ago"), type-colored icons
- Quick Actions: ghost buttons with icons, hover glow

**Acceptance Criteria:**
- [x] `/app` shows real stats from user's data
- [x] Activity feed shows last 10 actions across all 3 apps
- [x] Stats are fetched in parallel (no waterfall)
- [x] Empty states for each section when user has no data
- [x] Responsive: stacked on mobile, grid on desktop
- [x] Quick action buttons navigate correctly

---

### Day 4 — Tuesday, Jul 14 | ✨ Feature

#### Bio: Link Scheduling (Start/End Dates)

**Why**: Creators need time-limited links. Affiliate deal expires Friday? Link auto-hides Saturday. Event registration closes at midnight? Link disappears. Linktree, Beacons, and Stan Store all have this. Kytbox doesn't. Fix it.

**Database Changes:**
```sql
-- Migration: 20260714_add_link_scheduling.sql
ALTER TABLE links ADD COLUMN scheduled_at timestamptz DEFAULT NULL;
ALTER TABLE links ADD COLUMN expires_at timestamptz DEFAULT NULL;

-- Index for efficient filtering on public page
CREATE INDEX idx_links_schedule ON links(scheduled_at, expires_at)
  WHERE scheduled_at IS NOT NULL OR expires_at IS NOT NULL;
```

**Files to Modify:**
- `src/types/supabase.ts` — Regenerate types
- `src/types/dto.ts` — Add `scheduled_at` and `expires_at` to link DTO
- `src/lib/mappers.ts` — Map new fields in `mapLinkToDTO`
- `src/app/(platform)/bio/actions.ts` — Accept schedule fields in `addLink` and `updateLink`
- `src/lib/validation.schemas.ts` — Add schedule validation
- `src/app/[username]/page.tsx` — Filter out not-yet-live and expired links
- `src/lib/data-cache.ts` — Ensure cache respects time-based visibility

**Files to Create/Modify (UI):**
- `src/app/(platform)/bio/components/AddLinkModal.tsx` — Add date pickers
- `src/app/(platform)/bio/components/LinkItem.tsx` — Show schedule badge

**Public Page Filter Logic** (in `[username]/page.tsx` or data-cache):
```typescript
const now = new Date().toISOString();
const { data: links } = await supabase
  .from('links')
  .select('*')
  .eq('user_id', profile.id)
  .eq('is_active', true)
  .is('parent_id', null)
  .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
  .or(`expires_at.is.null,expires_at.gte.${now}`)
  .order('sort_order');
```

**Dashboard Badge States:**
| State | Badge | Color |
|---|---|---|
| Scheduled (future) | 🕐 "Goes live Jul 20" | `text-blue-500` |
| Active (within window) | 🟢 "Live until Jul 25" | `text-emerald-500` |
| Expired | 🔴 "Expired Jul 20" | `text-red-500` |
| No schedule | (none) | — |

**Validation Schema:**
```typescript
export const linkScheduleSchema = z.object({
  scheduled_at: z.coerce.date().nullable().catch(null),
  expires_at: z.coerce.date().nullable().catch(null),
}).refine(
  (data) => !data.scheduled_at || !data.expires_at || data.expires_at > data.scheduled_at,
  { message: 'Expiry must be after start date' }
);
```

**Acceptance Criteria:**
- [ ] User can set start date on a link → link hidden on public page until that date
- [ ] User can set end date → link auto-hides after expiry
- [ ] User can set both → link visible only within the window
- [ ] Dashboard shows schedule badges with human-readable dates
- [ ] Expired links stay in dashboard (dimmed) but hidden on public page
- [ ] Cache invalidation respects time-based visibility
- [ ] No schedule = always visible (backward compatible)
- [ ] Date pickers use native `<input type="datetime-local">`
- [ ] Validation: end must be after start

---

### Day 5 — Wednesday, Jul 15 | ✨ Feature

#### Bio: Section Headers / Visual Dividers

**Why**: Users can make folders but can't add **non-clickable visual labels** on their bio page. "🎵 Music", "📱 Social Media", "🔗 My Projects". Simple feature, massive visual impact. Makes any bio page look professionally organized.

**Database Changes:**
```sql
-- Migration: 20260715_add_link_headers.sql
ALTER TABLE links ADD COLUMN is_header boolean NOT NULL DEFAULT false;

-- Headers are links with no URL requirement
-- Existing constraint: url is already nullable (folders have no URL too)
```

**Files to Modify:**
- `src/types/supabase.ts` — Regenerate
- `src/types/dto.ts` — Add `is_header` to link DTO
- `src/lib/mappers.ts` — Map `is_header`
- `src/app/(platform)/bio/actions.ts` — New `addHeader` action
- `src/app/(platform)/bio/components/DashboardClient.tsx` — "Add Header" button next to "Add Link"
- `src/app/[username]/components/ProfileLinks.tsx` — Render headers as styled dividers

**Header Display on Public Profile:**
```tsx
// Inside ProfileLinks.tsx link rendering loop
if (link.is_header) {
  return (
    <div key={link.id} className="w-full py-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-current opacity-20" />
        <span className="text-sm font-semibold tracking-wide uppercase opacity-70">
          {link.title}
        </span>
        <div className="h-px flex-1 bg-current opacity-20" />
      </div>
    </div>
  );
}
```

**Dashboard Behavior:**
- Headers appear in the link list alongside regular links
- Draggable (same as links — they participate in `sort_order`)
- No URL field, no toggle, no click tracking
- Edit: title only
- Visual distinction in dashboard: different icon (horizontal rule icon), muted styling
- "Add Header" opens a simple modal with just a title field

**Server Action:**
```typescript
export async function addHeader(title: string, parentId: string | null) {
  const { user, supabase } = await getAuthenticatedUser();
  // Validate title
  const parsed = z.string().trim().min(1).max(100).safeParse(title);
  if (!parsed.success) return { error: 'Invalid header title' };

  // Get next sort_order
  const { data: maxOrder } = await supabase
    .from('links')
    .select('sort_order')
    .eq('user_id', user.id)
    .eq('parent_id', parentId ?? null) // null = root level
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.sort_order ?? -1) + 1;

  await supabase.from('links').insert({
    user_id: user.id,
    title: parsed.data,
    url: null,
    is_header: true,
    is_folder: false,
    is_active: true,
    parent_id: parentId,
    sort_order: nextOrder,
  });

  updateTag(`profile-${username}`);
  revalidatePath('/bio');
}
```

**Acceptance Criteria:**
- [ ] "Add Header" button in dashboard creates a section divider
- [ ] Headers render as styled dividers on public profile (title + horizontal lines)
- [ ] Headers are draggable in the dashboard (reorder among links)
- [ ] Headers work inside folders
- [ ] Headers inherit theme colors on public page
- [ ] Headers have no URL, no click tracking, no toggle
- [ ] Edit modal: title field only
- [ ] Delete works normally (with confirmation)

---

### Day 6 — Thursday, Jul 16 | ✨ Feature

#### Cashflow: Recurring Entry Auto-Generation

**Why**: Right now projections SHOW upcoming recurring costs (Netflix, rent, salary) but don't auto-create actual entries when the month arrives. Users manually re-enter "Netflix $15.99" every single month. That's broken UX.

**Database Changes**: None (uses existing `cashflow_entries` columns: `recurrence_interval`, `recurrence_calc`)

**Files to Modify:**
- `src/app/(platform)/cashflow/actions.ts` — New `generateRecurringEntries` action
- `src/app/(platform)/cashflow/[id]/components/CashflowDetail.tsx` — Add "Generate Recurring" button/banner

**How It Works:**

1. Find all entries in this cashflow with `recurrence_interval != 'none'`
2. For each recurring entry, check if an entry with the same description + type + amount exists for the current month
3. If missing, create it with today's date (or the recurring day-of-month if specified)
4. Return count of generated entries

**Server Action:**
```typescript
export async function generateRecurringEntries(cashflowId: string) {
  const { user, supabase } = await getAuthenticatedUser();

  // Verify ownership
  const { data: cashflow } = await supabase
    .from('cashflows')
    .select('id, user_id')
    .eq('id', cashflowId)
    .eq('user_id', user.id)
    .single();
  if (!cashflow) return { error: 'Not found' };

  // Get all recurring entries
  const { data: recurring } = await supabase
    .from('cashflow_entries')
    .select('*')
    .eq('cashflow_id', cashflowId)
    .neq('recurrence_interval', 'none');

  if (!recurring?.length) return { generated: 0 };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get all entries this month to check for duplicates
  const monthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const monthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const { data: existingThisMonth } = await supabase
    .from('cashflow_entries')
    .select('description, type, amount')
    .eq('cashflow_id', cashflowId)
    .gte('date', monthStart)
    .lte('date', monthEnd);

  const existingSet = new Set(
    (existingThisMonth || []).map(e => `${e.description}|${e.type}|${e.amount}`)
  );

  // Generate missing entries
  const toInsert = recurring
    .filter(entry => !existingSet.has(`${entry.description}|${entry.type}|${entry.amount}`))
    .map(entry => ({
      cashflow_id: cashflowId,
      description: entry.description,
      type: entry.type,
      amount: entry.amount,
      category: entry.category,
      date: new Date(currentYear, currentMonth, Math.min(
        new Date(entry.date).getDate(),
        new Date(currentYear, currentMonth + 1, 0).getDate() // handle Feb 30 etc
      )).toISOString().split('T')[0],
      recurrence_interval: entry.recurrence_interval,
      recurrence_calc: entry.recurrence_calc,
    }));

  if (toInsert.length > 0) {
    await supabase.from('cashflow_entries').insert(toInsert);
  }

  revalidatePath(`/cashflow/${cashflowId}`);
  return { generated: toInsert.length };
}
```

**UI:**
- Banner at top of cashflow detail: "🔄 5 recurring entries ready for July 2026" with "Generate" button
- Banner only shows when there ARE recurring entries missing for current month
- After generation: success toast "Generated 5 recurring entries"
- Generated entries appear in the table immediately (page revalidates)
- Each generated entry has a small recurrence icon (🔄) badge in the table

**Acceptance Criteria:**
- [ ] "Generate Recurring" button appears when recurring entries are missing for current month
- [ ] Clicking generates all missing entries for the current month
- [ ] Duplicate detection: won't re-create if matching entry already exists this month
- [ ] Day-of-month preserved from original (e.g., "15th" stays on 15th)
- [ ] Handles month-end edge cases (Jan 31 → Feb 28)
- [ ] Entries inherit category, recurrence settings from original
- [ ] Success toast shows count
- [ ] Banner disappears after generation (all caught up)
- [ ] Only owner can generate (ownership check)

---

## 🗓️ Week 2: Analytics + Onboarding

---

### Day 7 — Friday, Jul 17 | ✨ Feature

#### Bio: Country Analytics Map

**Why**: The `link_events` and `profile_events` tables already have `country` and `city` columns — the data EXISTS in the database but **zero UI surfaces it**. This is free value sitting unused.

**Database Changes:**
```sql
-- New RPC for country aggregation
CREATE OR REPLACE FUNCTION get_analytics_by_country(
  p_link_ids uuid[],
  p_start_date timestamptz DEFAULT NULL
)
RETURNS TABLE(country text, click_count bigint) AS $$
  SELECT
    COALESCE(country, 'Unknown') AS country,
    COUNT(*) AS click_count
  FROM link_events
  WHERE link_id = ANY(p_link_ids)
    AND (p_start_date IS NULL OR created_at >= p_start_date)
  GROUP BY COALESCE(country, 'Unknown')
  ORDER BY click_count DESC;
$$ LANGUAGE sql SECURITY DEFINER;
```

**Files to Create:**
- `src/app/(platform)/bio/analytics/components/CountryBreakdown.tsx` — Client component

**Files to Modify:**
- `src/app/(platform)/bio/analytics/page.tsx` — Add country data fetch + render
- `src/app/(platform)/bio/analytics/actions.ts` — New `getCountryAnalytics` action

**Component Design:**
```
CountryBreakdown
├── Section Header: "🌍 Visitor Geography"
├── Top Country Highlight: "Most visitors from 🇺🇸 United States (45%)"
├── Country Table
│   ├── Row: 🇺🇸 United States | 450 clicks | 45% | ████████████░░ progress bar
│   ├── Row: 🇮🇩 Indonesia | 230 clicks | 23% | ██████░░░░░░░░
│   ├── Row: 🇬🇧 United Kingdom | 120 clicks | 12% | ███░░░░░░░░░░░
│   └── ...
└── "Show All" toggle if > 10 countries
```

**Country → Flag Emoji Mapping:**
```typescript
const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', ID: '🇮🇩', GB: '🇬🇧', MY: '🇲🇾', SG: '🇸🇬',
  AU: '🇦🇺', JP: '🇯🇵', DE: '🇩🇪', FR: '🇫🇷', IN: '🇮🇳',
  // ... extend as needed. Fallback: 🌐
};
```

**Acceptance Criteria:**
- [ ] Country breakdown table shows on analytics page
- [ ] Sorted by click count descending
- [ ] Flag emoji + country name + count + percentage + visual bar
- [ ] Respects date range filter (24h, 7d, 30d, lifetime)
- [ ] Respects link filter (specific link or all links)
- [ ] "Unknown" for entries with null country
- [ ] Top country highlighted at the top
- [ ] Show top 10, toggle "Show All" for more
- [ ] `isLoading` skeleton state matches layout

---

### Day 8 — Saturday, Jul 18 | ✨ Feature

#### Onboarding Tour for New Users

**Why**: New users land on `/app` and see 4 cards. No guidance, no direction, no "what should I do first?". An onboarding tour reduces drop-off and teaches the platform in 30 seconds.

**Database Changes:**
```sql
-- Migration: 20260718_add_onboarding_flag.sql
ALTER TABLE profiles ADD COLUMN has_completed_onboarding boolean NOT NULL DEFAULT false;
```

**Files to Create:**
- `src/components/onboarding-tour.tsx` — Tour overlay component

**Files to Modify:**
- `src/app/(platform)/layout.tsx` — Mount `<OnboardingTour />` conditionally
- `src/types/supabase.ts` — Regenerate
- `src/app/(platform)/app/page.tsx` — Pass `hasCompletedOnboarding` prop

**Tour Steps (5 steps):**

| Step | Target Element | Content |
|---|---|---|
| 1 | App cards | **"Welcome to Kytbox!"** — This is your home. Each card is a different app. |
| 2 | Bio card | **"Start with Bio"** — Add your links and share your page with the world. |
| 3 | Cashflow card | **"Track your money"** — Simple personal finance tracking with charts and budgets. |
| 4 | List card | **"Organize everything"** — Todo boards, wishlists, and idea dumps. |
| 5 | Header (Cmd+K badge) | **"Pro tip: Cmd+K"** — Press Cmd+K anytime to navigate, search, or create things instantly. |

**Implementation Approach:**
- Pure CSS + Framer Motion (NO heavy tour library like `react-joyride`)
- Spotlight effect: dark overlay with a cutout around the target element
- Tooltip positioned relative to target with arrow
- Step indicator dots at bottom (○ ○ ● ○ ○)
- "Skip" (top-right) + "Next" (bottom-right) buttons
- Last step: "Get Started" instead of "Next"

**Dismissal Logic:**
```typescript
async function completeOnboarding() {
  const supabase = createClient();
  await supabase
    .from('profiles')
    .update({ has_completed_onboarding: true })
    .eq('id', userId);
}
```

**Acceptance Criteria:**
- [ ] Tour shows ONLY on first login (when `has_completed_onboarding = false`)
- [ ] 5 steps with spotlight overlay targeting correct elements
- [ ] "Skip" dismisses immediately and marks complete
- [ ] "Next" advances through steps
- [ ] Last step shows "Get Started" button
- [ ] After completion: never shows again
- [ ] Responsive: works on mobile (full-width tooltips)
- [ ] Keyboard accessible: Tab navigates buttons, Escape skips
- [ ] Smooth transitions between steps (Framer Motion)

---

### 🔴 Day 9 — Sunday, Jul 19 | 🔴 REST

---

### Day 10 — Monday, Jul 20 | ✨ Feature

#### Sentry Error Tracking

**Why**: When users hit bugs in production, you currently have **zero visibility**. The `console.error` in `error.tsx` writes to the server log that nobody reads. Sentry captures exact errors, stack traces, browser info, user context, and sends real-time alerts. Non-negotiable for any product heading toward real users.

**Files to Create:**
- `sentry.client.config.ts` — Client-side Sentry init
- `sentry.server.config.ts` — Server-side Sentry init
- `sentry.edge.config.ts` — Edge runtime Sentry init
- `next.config.ts` — Wrap with `withSentryConfig`

**Files to Modify:**
- `src/env.ts` — Add `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` env vars
- `src/instrumentation.ts` — Import Sentry server config
- `src/app/error.tsx` — Add `Sentry.captureException(error)`
- `src/app/(platform)/error.tsx` — Same
- `src/app/(admin)/error.tsx` — Same
- `package.json` — Add `@sentry/nextjs` dependency

**Sentry Config:**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions for performance
  replaysSessionSampleRate: 0, // no replays (cost)
  replaysOnErrorSampleRate: 1.0, // always replay errors
  environment: process.env.NODE_ENV,
});
```

**Env Validation Addition:**
```typescript
// In env.ts
SENTRY_DSN: z.string().url().optional(),
NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
SENTRY_ORG: z.string().optional(),
SENTRY_PROJECT: z.string().optional(),
```

**Error Boundary Integration:**
```typescript
// In every error.tsx
useEffect(() => {
  Sentry.captureException(error, {
    tags: { path: pathname },
    extra: { digest: error.digest },
  });
}, [error, pathname]);
```

**Acceptance Criteria:**
- [ ] Sentry DSN configured via env vars
- [ ] Client errors captured with stack trace + browser info
- [ ] Server errors captured with stack trace + route info
- [ ] Error boundaries send to Sentry automatically
- [ ] Source maps uploaded during build (dev sees original code in Sentry)
- [ ] Build succeeds with Sentry (no breaking changes)
- [ ] Optional: works fine when SENTRY_DSN is empty (dev mode)

---

### Day 11 — Tuesday, Jul 21 | ✨ Feature

#### Landing Page Premium Redesign

**Why**: The marketing page at `/` is the first thing potential users see. It needs to scream premium. Current page has basic app cards. Competitors like Linktree have beautiful, animated landing pages.

**Design Direction**: **Glassmorphism + Gradient + Scroll-triggered Micro-animations**

**Files to Modify:**
- `src/app/(marketing)/page.tsx` — Complete redesign
- `src/app/(marketing)/loading.tsx` — Update skeleton

**Page Sections:**

1. **Hero (above fold)**
   - Full-viewport gradient background: `bg-gradient-to-br from-violet-600 via-blue-500 to-teal-400`
   - Large heading: "Your links. Your money. Your lists. **One platform.**"
   - Animated text cycling: "Share your links" → "Track your money" → "Organize your ideas" (fade transition every 3s)
   - CTA button: "Get Started Free" with glow effect (`shadow-lg shadow-primary/50`)
   - Floating glass cards in background (decorative, parallax on scroll)

2. **Feature Showcase (3 sections, scroll-triggered)**
   - Each section: screenshot/mockup on one side, feature bullets on other
   - **Bio section**: Phone mockup showing profile page, bullets: "Nested folders", "Custom themes", "Click analytics"
   - **Cashflow section**: Dashboard screenshot, bullets: "Smart projections", "Budget alerts", "Shared tracking"
   - **List section**: Kanban board preview, bullets: "Drag & drop", "Wishlists with prices", "Quick brain dumps"
   - Scroll-triggered: sections fade-in + slide-up using Framer Motion `whileInView`

3. **Stats/Social Proof**
   - "Built for creators, freelancers, and teams"
   - 3 stats cards (glassmorphism): "13+ Themes", "3 Apps", "100% Free"

4. **CTA Section (bottom)**
   - "Ready to get started?"
   - Large "Create Your Page" button
   - "No credit card required" subtext

5. **Footer**
   - Existing footer component

**Animations:**
- Hero text: `framer-motion` fade cycle every 3s
- Feature sections: `whileInView={{ opacity: 1, y: 0 }}` with `initial={{ opacity: 0, y: 40 }}`
- Decorative blobs: CSS `@keyframes float` with different delays
- CTA button: `hover:scale-105 transition-transform` + glow pulse

**Acceptance Criteria:**
- [ ] Hero section is visually stunning on first load
- [ ] Scroll animations trigger smoothly (no jank)
- [ ] Responsive: mobile-first, looks great at 320px
- [ ] Dark mode works (gradient adjusts)
- [ ] CTA buttons link to `/signup`
- [ ] Page loads fast (< 2s LCP) — no heavy images, CSS-only effects
- [ ] Accessible: proper heading hierarchy, sufficient contrast

---

### Day 12 — Wednesday, Jul 22 | ✨ Feature

#### QR Code Generator for Bio Profiles

**Why**: Easy win for offline marketing. Business cards, flyers, event stickers, restaurant menus — all need QR codes pointing to the creator's bio page.

**Dependencies**: `qrcode` package (install needed — lightweight, generates SVG/PNG, zero deps)

**Files to Create:**
- `src/app/(platform)/bio/components/QRCodeModal.tsx` — Modal component

**Files to Modify:**
- `src/app/(platform)/bio/components/DashboardClient.tsx` — Add "QR Code" button to header

**Component Design:**
```
QRCodeModal
├── Header: "Your QR Code"
├── QR Code Preview (centered, large)
│   └── SVG rendered by `qrcode` library
├── URL displayed: "kytbox.com/username"
├── Color Customization
│   ├── Foreground color picker (default: user's theme primary)
│   └── Background color picker (default: white)
├── Download Buttons
│   ├── "Download SVG" (vector, scalable)
│   └── "Download PNG" (raster, 1024x1024)
└── Footer: "Scan to visit your Kytbox page"
```

**QR Generation:**
```typescript
import QRCode from 'qrcode';

// Generate SVG string
const svgString = await QRCode.toString(
  `https://kytbox.com/${username}`,
  {
    type: 'svg',
    color: { dark: fgColor, light: bgColor },
    width: 512,
    margin: 2,
  }
);

// Generate PNG data URL for download
const pngDataUrl = await QRCode.toDataURL(
  `https://kytbox.com/${username}`,
  {
    width: 1024,
    color: { dark: fgColor, light: bgColor },
    margin: 2,
  }
);
```

**Acceptance Criteria:**
- [ ] "QR Code" button on Bio dashboard opens modal
- [ ] QR code scans correctly to `kytbox.com/{username}`
- [ ] Custom foreground/background colors
- [ ] SVG download works (right filename: `kytbox-{username}-qr.svg`)
- [ ] PNG download works at 1024x1024
- [ ] Default colors match user's active theme
- [ ] Modal is accessible (focus trap, Escape closes)

---

### Day 13 — Thursday, Jul 23 | ✨ Feature

#### Notification Center (Unified Bell)

**Why**: The current support notification bell is isolated to support tickets only. A unified notification system covers budget alerts, click milestones, and support replies — all in one place. Makes the platform feel alive and responsive.

**Database Changes:**
```sql
-- Migration: 20260723_create_notifications.sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'support_reply', 'budget_warning', 'budget_exceeded',
    'click_milestone', 'system'
  )),
  title text NOT NULL,
  body text,
  link_url text, -- Where to navigate when clicked
  read_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);
```

**Files to Create:**
- `src/components/notification-center.tsx` — Bell + dropdown component
- `src/app/(platform)/notifications/actions.ts` — Server actions

**Files to Modify:**
- `src/components/header.tsx` — Replace old support bell with unified notification center
- `src/components/support-notification-bell.tsx` — Deprecate (merge into notification center)
- `src/app/(platform)/support/actions.ts` — Create notification on admin reply
- `src/app/(platform)/cashflow/actions.ts` — Create notification on budget threshold

**Notification Triggers:**

| Trigger | Type | Title | Body | Link |
|---|---|---|---|---|
| Admin replies to ticket | `support_reply` | "Support replied" | "Re: {ticket subject}" | `/support/{ticketId}` |
| Budget hits 80% | `budget_warning` | "Budget Warning ⚠️" | "{category} at 80% of ${limit}" | `/cashflow/{id}` |
| Budget exceeds 100% | `budget_exceeded` | "Budget Exceeded 🔴" | "{category} over by ${amount}" | `/cashflow/{id}` |
| Bio hits click milestone | `click_milestone` | "Milestone! 🎉" | "Your bio page hit {N} total clicks" | `/bio/analytics` |

**Dropdown UI:**
```
NotificationCenter
├── Bell Icon + Unread Count Badge (red dot with number)
├── Dropdown Panel (on click)
│   ├── Header: "Notifications" + "Mark all read" link
│   ├── Group: "Today"
│   │   ├── NotificationItem (unread = bold, blue dot)
│   │   └── NotificationItem
│   ├── Group: "Earlier"
│   │   └── NotificationItem (read = muted text)
│   └── Empty State: "All caught up! 🎉"
└── Click item → navigate to link_url + mark read
```

**Acceptance Criteria:**
- [ ] Bell in header shows unread count
- [ ] Dropdown shows last 20 notifications grouped by today/earlier
- [ ] Clicking a notification navigates to `link_url` and marks as read
- [ ] "Mark all read" button works
- [ ] Support admin reply creates a notification for the user
- [ ] Budget threshold (80%, 100%) creates notification for cashflow owner
- [ ] Notifications respect RLS (users see only their own)
- [ ] Empty state when no notifications
- [ ] Polling: re-fetch every 60 seconds (or use Supabase realtime)

---

## 🗓️ Week 3: Performance + Polish

---

### Day 14 — Friday, Jul 24 | 🚀 Performance

#### Public Profile Optimization + PWA Install

**Tasks (Profile CWV):**
- Run Lighthouse audit on `[username]` page (mobile + desktop)
- Add `<link rel="preconnect" href="https://{supabase-id}.supabase.co">` to root layout
- Verify avatar uses `next/image` with proper `sizes` and `priority` attributes
- Dynamic import `social-icons.tsx` (large icon map) — split from main bundle
- Verify `use cache` granularity per username
- Check: no unused CSS (Tailwind purge working?)
- Target: **LCP < 1.5s, CLS = 0, FID < 100ms**

**Tasks (PWA):**
- Create `public/manifest.json`:
  ```json
  {
    "name": "Kytbox",
    "short_name": "Kytbox",
    "start_url": "/app",
    "display": "standalone",
    "background_color": "#000000",
    "theme_color": "#7c3aed",
    "icons": [
      { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```
- Generate icon files (192px, 512px) — Kytbox logo on solid background
- Add `<link rel="manifest" href="/manifest.json">` to root layout `<head>`
- Add `<meta name="theme-color">` (dynamic: dark=#000, light=#fff)
- Basic service worker: precache root HTML shell, CSS, JS bundles

**Acceptance Criteria:**
- [ ] Lighthouse mobile score ≥ 90 for public profile
- [ ] LCP < 1.5s on 4G throttle
- [ ] PWA install prompt appears on mobile Chrome/Safari
- [ ] App opens in standalone mode after install
- [ ] Correct icon and theme color

---

### Day 15 — Saturday, Jul 25 | 🚀 Performance

#### SEO Metadata + Bundle Analysis

**SEO Tasks:**
- Add `generateMetadata` to all routes missing it:
  - `/cashflow/[id]`: title = cashflow name, description = "Cashflow tracker"
  - `/bio/analytics`: title = "Analytics | Kytbox"
  - `/list/todo/[id]`: title = board name
  - `/list/wishlist/[id]`: title = wishlist name
  - `/list/ideas/[id]`: title = idea list name
- Add `noindex` robots meta to all private routes: `/app`, `/bio`, `/cashflow`, `/list/*`, `/settings`, `/support*`
- Verify `[username]` has Open Graph tags: `og:title`, `og:description`, `og:image` (avatar), `og:url`
- Verify [robots.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/robots.ts) blocks `/app/*`, `/settings/*`, `/support/*`
- Verify [sitemap.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/sitemap.ts) includes all public profiles

**Bundle Analysis Tasks:**
- Install `@next/bundle-analyzer` (dev dependency)
- Run: `ANALYZE=true npm run build`
- Identify top 5 largest client chunks
- Dynamic import candidates: `recharts`, `framer-motion`, `@dnd-kit/*`, `qrcode`
- Verify Edge Runtime on `proxy.ts`
- Document findings + actions taken

**Acceptance Criteria:**
- [ ] All routes have proper `<title>` and `<meta description>`
- [ ] Private routes have `noindex`
- [ ] `[username]` has full Open Graph tags
- [ ] No client route exceeds 100KB first-load JS
- [ ] Heavy libraries are code-split

---

### 🔴 Day 16 — Sunday, Jul 26 | 🔴 REST

---

### Day 17 — Monday, Jul 27 | ✨ Feature

#### Cashflow: Savings Goals

**Why**: Users track spending but have no way to track **saving toward a goal**. "Save $5000 for vacation by December" with a progress bar = daily retention driver. People open the app to watch their progress grow.

**Database Changes:**
```sql
-- Migration: 20260726_create_cashflow_goals.sql
CREATE TABLE cashflow_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashflow_id uuid NOT NULL REFERENCES cashflows(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  deadline date DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS: same pattern as cashflow_budgets
ALTER TABLE cashflow_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages goals"
  ON cashflow_goals FOR ALL
  USING (cashflow_id IN (SELECT id FROM cashflows WHERE user_id = auth.uid()));

CREATE POLICY "Editor reads goals"
  ON cashflow_goals FOR SELECT
  USING (cashflow_id IN (
    SELECT cashflow_id FROM cashflow_shares
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
  ));

CREATE INDEX idx_cashflow_goals_cashflow ON cashflow_goals(cashflow_id);
```

**Progress Calculation** (client-side from existing data):
```typescript
// Current saved = total income - total expense (from cashflow_summaries)
const currentSaved = cashflow.income - cashflow.expense;
const progress = Math.min((currentSaved / goal.target_amount) * 100, 100);
```

**UI: Goal Card (at top of cashflow detail page):**
```
┌─────────────────────────────────────────┐
│ 🎯 Save for Vacation                    │
│ $2,450 / $5,000           49%           │
│ ████████████░░░░░░░░░░░░░               │
│ Deadline: Dec 31, 2026 · 173 days left  │
└─────────────────────────────────────────┘
```

**Color States:**
- Green progress bar: on track (will hit target before deadline at current pace)
- Amber: behind pace
- Red: significantly behind or past deadline
- Confetti animation at 100%! 🎉

**Acceptance Criteria:**
- [ ] "Add Goal" button on cashflow detail page
- [ ] Goal card shows at top with progress bar
- [ ] Progress calculated from cashflow balance
- [ ] Deadline with days remaining
- [ ] Color-coded pace indicator
- [ ] Edit/delete goal
- [ ] Only owner can manage goals (editors can view)
- [ ] Multiple goals per cashflow supported

---

### Day 18 — Tuesday, Jul 28 | 🐛 Bugfix

#### Audit Debt Batch (#13–19 from June Audit)

**All items in one day:**

1. **Fix `GlobalError` (#19)**: Rename `src/app/error.tsx` → `src/app/global-error.tsx`. Create new `src/app/error.tsx` without `<html>/<body>`.

2. **Add missing `loading.tsx` (#16)**: Create `loading.tsx` in:
   - `src/app/(auth)/login/`
   - `src/app/(auth)/signup/`
   - `src/app/(auth)/forgot-password/`
   - `src/app/update-password/`
   - `src/app/[username]/[linkId]/`

3. **Add `connection()` (#15)**: Add `await connection()` to top of:
   - `src/app/(platform)/cashflow/page.tsx`
   - `src/app/(platform)/bio/page.tsx`
   - `src/app/(platform)/settings/page.tsx`
   - `src/app/(platform)/app/page.tsx`

4. **Kill `getAvatarUrl` (#14)**: Delete `src/lib/avatar.ts`. Find all imports, replace with inline `avatarUrl || null`.

5. **Zod for `isCustomThemeData` (#13)**: Replace manual type guard with:
   ```typescript
   const customThemeSchema = z.record(z.string(), z.string()).nullish().transform(v => v ?? null);
   ```

6. **Centralize `recurrenceIntervalSchema` (#18)**: Move to `validation.schemas.ts`, update imports in `mappers.ts` and `cashflow/page.tsx`.

7. **Fix `support/page.tsx` auth pattern**: Replace `createClient()` + manual `getUser()` with `getAuthenticatedUser()`.

**Acceptance Criteria:**
- [ ] All 7 items resolved
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### Day 19 — Wednesday, Jul 29 | 🔧 Improvement

#### Dark Mode Shadows + Container Queries + List Polish

**Dark Mode Shadows (#17):**
- Update `.dark` in `globals.css` — shadows should use lighter blur on dark backgrounds:
  ```css
  .dark {
    --shadow-sm: 0px 1px 3px 0px hsl(0 0% 0% / 0.4), 0px 1px 2px -1px hsl(0 0% 0% / 0.4);
    --shadow-md: 0px 2px 6px 0px hsl(0 0% 0% / 0.5), 0px 2px 4px -1px hsl(0 0% 0% / 0.4);
    /* ... etc with higher opacity for dark mode */
  }
  ```

**Container Queries:**
- Audit: `ListCard.tsx`, `StatsCard.tsx`, cashflow summary cards
- Replace `md:` media-query-based layouts with `@container` where component is used in varying-width containers

**List App Polish:**
- Add empty states (Todo: empty board illustration + "Create your first board", Wishlist: shopping bag icon + "Start tracking wishes", Ideas: lightbulb + "Capture your first idea")
- Framer Motion staggered entrance on grid cards
- Kanban column horizontal DnD (using `@dnd-kit/sortable` on columns)
- Wishlist: currency-aware formatting, progress bar for purchased ratio

**Acceptance Criteria:**
- [ ] Dark mode shadows look natural (not identical to light)
- [ ] Card components use `@container` where appropriate
- [ ] All 3 List sub-apps have proper empty states
- [ ] Kanban columns are horizontally reorderable
- [ ] Wishlist shows progress bar and formatted prices

---

### Day 20 — Thursday, Jul 30 | ✨ Feature

#### Bio: Analytics Share Card

**Why**: Generate a beautiful shareable image showing bio stats — like Spotify Wrapped but for links. Users post on Instagram/Twitter = **free viral marketing** for Kytbox. Every share is an ad.

**Implementation**: Client-side Canvas API (no server rendering needed)

**Files to Create:**
- `src/app/(platform)/bio/analytics/components/ShareCardGenerator.tsx`

**Canvas Layout (1080x1080 for Instagram):**
```
┌──────────────────────────────┐
│        (gradient bg)          │
│                               │
│     @username's Bio Stats     │
│     ─────────────────         │
│                               │
│  📊 1,245 total clicks        │
│  🔗 Top: "Instagram" (340)    │
│  🌍 Most visitors: 🇺🇸 USA   │
│  📅 June 2026                 │
│                               │
│     ─────────────────         │
│     Powered by Kytbox         │
│     kytbox.com/username       │
└──────────────────────────────┘
```

**Generation Flow:**
1. User clicks "Share Stats" button on analytics page
2. Modal opens with preview of the card
3. Card auto-populates with current analytics data
4. User can choose color scheme (matches their bio theme)
5. "Download PNG" → triggers Canvas → PNG download
6. "Copy to Clipboard" → uses `navigator.clipboard.write()` with Blob

**Acceptance Criteria:**
- [ ] "Share Stats" button on analytics page
- [ ] Generated image is 1080x1080 (Instagram-optimized)
- [ ] Shows: username, total clicks, top link, top country, date range
- [ ] "Powered by Kytbox" watermark at bottom
- [ ] Download as PNG
- [ ] Copy to clipboard
- [ ] Theme-aware colors
- [ ] Preview in modal before download

---

## 🗓️ Week 4: Testing + Hardening

---

### Day 21 — Friday, Jul 31 | 🧪 Testing

#### Security Lib + List App Unit Tests

**Security Unit Tests:**

| File | Tests |
|---|---|
| `origin.ts` | ✓ Allows valid URLs (https://example.com), ✗ Rejects `javascript:alert()`, ✗ Rejects `data:text/html`, ✓ Allows whitelisted origins, ✗ Rejects non-whitelisted |
| `ip.ts` | ✓ Prioritizes `x-vercel-forwarded-for`, ✗ Falls back to `x-forwarded-for`, ✓ Handles missing headers, ✓ Returns first IP from comma-separated list |
| `csp.ts` | ✓ Includes nonce in script-src, ✗ No `unsafe-inline` in script-src, ✓ `frame-ancestors: 'none'`, ✓ `form-action: 'self'` |

**List Unit Tests:**

| Test | Validates |
|---|---|
| `mapListToDTO` | Correct field mapping, `type` parsed via Zod, `item_count` coerced to number |
| `mapListColumnToDTO` | `is_done_column` boolean coercion, `sort_order` default |
| `mapListItemToDTO` | `metadata` parsed via Zod record, `column_id` nullable |
| Wishlist metadata | Price parsing, currency validation, URL validation, null handling |

**List Server Action Audit Checklist:**
- [ ] Every mutation validates input via Zod
- [ ] Every mutation checks user ownership
- [ ] Rate limiting active (via `getAuthenticatedUserWithRateLimit`)
- [ ] `deleteColumn` verifies at least 1 column remains
- [ ] `moveItem` syncs `is_completed` with destination column's `is_done_column`

---

### Day 22 — Saturday, Aug 1 | 🧪 Testing

#### List App E2E Tests

**Test Cases:**

1. **Todo Board Lifecycle:**
   - Login → Navigate to `/list/todo` → Click "New Board" → Enter title → Submit
   - Board appears in grid → Click to open → 4 default columns visible
   - Add card to "Todo" column → Card appears → Drag card to "Completed" → `is_completed` = true
   - Delete card → Confirm → Card removed → Delete board → Confirm → Board removed

2. **Wishlist Lifecycle:**
   - Create wishlist → Add item with title + price + currency → Item appears with price badge
   - Mark as purchased → Strikethrough + total updates → Unmark → Total recalculates
   - Delete item → Total updates

3. **Ideas Lifecycle:**
   - Create idea list → Add idea (inline form) → Enter title → Idea appears
   - Mark as "noted" → Visual change → Reorder via drag → Order persists on reload

---

### 🔴 Day 23 — Sunday, Aug 2 | 🔴 REST

---

### Day 24 — Monday, Aug 3 | 🧪 Testing

#### Support + Cashflow E2E Tests

**Support E2E:**
- Login as user → Create ticket (subject + message + category) → Verify appears in list
- Login as admin → Navigate to `/support-admin` → Ticket in queue → Reply
- Login as user → Unread badge on notification bell → Open ticket → Message visible → Badge clears

**Cashflow E2E:**
- Create cashflow → Add income entry ($1000) → Summary shows $1000 income
- Add expense entry ($300, category: Food) → Summary shows $700 balance
- Edit expense to $500 → Summary updates to $500 balance
- Delete expense → Balance returns to $1000
- Apply "This Month" filter → Only current month entries visible

---

### Day 25 — Tuesday, Aug 4 | 🧪 Testing

#### Bio DnD + Analytics + Scheduling E2E

**Drag & Drop E2E:**
- Bio: Reorder 3 links via drag-and-drop → Navigate to public profile → Same order visible
- Kanban: Move card from "Todo" → "Completed" → Card shows completed state

**Analytics E2E:**
- Navigate to public profile → Click a link → Verify redirect works
- Navigate to `/bio/analytics` → Click count incremented for that link

**Scheduling E2E:**
- Create link with `scheduled_at` = tomorrow → Public profile: link NOT visible
- Create link with `expires_at` = yesterday → Public profile: link NOT visible
- Create link with no schedule → Public profile: link visible

---

### Day 26 — Wednesday, Aug 5 | 🧪 Code Review

#### Accessibility Audit (WCAG 2.2)

**Audit Areas:**

| Area | What to Check |
|---|---|
| **Keyboard Navigation** | Tab through: Bio dashboard, Kanban board, Cashflow forms, Command Palette, Settings. All interactive elements reachable? Focus visible? |
| **ARIA Roles** | Buttons have `role="button"`, modals have `role="dialog"`, tabs have `role="tablist"/"tab"`, command palette has `role="combobox"` |
| **Color Contrast** | All text meets 4.5:1 ratio (AA) in light, dark, and custom themes. Use browser devtools contrast checker |
| **Focus Indicators** | All focusable elements have visible `:focus-visible` ring. No `outline: none` without replacement |
| **Screen Reader** | Navigate with VoiceOver/NVDA. All content announced correctly? Images have alt text? |
| **Motion** | `prefers-reduced-motion` respected? Disable animations when OS setting is on |

---

### Day 27 — Thursday, Aug 6 | 🧪 Code Review

#### Full Build Verification + Type Safety

- `cmd /c npm run build` — **zero** warnings, **zero** errors
- `cmd /c npm run lint` — clean
- `cmd /c npm run test` — all unit tests pass
- `cmd /c npm run test:e2e` — all E2E tests pass
- Grep for `as any` — eliminate or add inline justification comment
- Grep for `@ts-ignore` / `@ts-expect-error` — eliminate or justify
- Verify every new feature has an error boundary
- Verify no console.log left in production code

---

## 🗓️ Week 5: Final Polish

---

### Day 28 — Friday, Aug 7 | 🧪 Testing

#### Visual Regression Baseline (Playwright Screenshots)

Capture the "golden state" so future CSS changes don't silently break layouts.

**Screenshot Targets:**
- Public profile — light theme
- Public profile — dark theme
- Bio dashboard — links tab
- Bio dashboard — appearance tab
- Bio analytics page
- Cashflow dashboard
- Cashflow detail page
- List hub
- Kanban board
- Landing page — above fold

**Configuration:**
```typescript
// In each test
await expect(page).toHaveScreenshot('bio-dashboard-links.png', {
  maxDiffPixels: 100, // Allow minor anti-aliasing differences
  fullPage: false,     // Viewport only
});
```

---

### Day 29 — Saturday, Aug 8 | 🔧 Improvement

#### Documentation Overhaul

**Files to Update:**
- [Kytbox.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/Kytbox.md) — Add List app, Command Palette, Notifications to implementation status
- [link-in-bio.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/link-in-bio.md) — Add: link scheduling, section headers, QR code, country analytics, share card, content embeds
- [cashflow.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/cashflow.md) — Add: recurring auto-generation, savings goals, duplicate book
- [TESTING_ROADMAP.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/TESTING_ROADMAP.md) — Update coverage matrix, mark completed items
- [LOADING_STATES.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/LOADING_STATES.md) — Add new routes to coverage matrix

**Files to Create:**
- `docs/AUDIT_AUG_2026.md` — Full codebase re-audit with post-sprint scores
- Update all "Last Updated" timestamps to August 2026

---

### 🔴 Day 30 — Sunday, Aug 9 | 🔴 REST

---

### Day 31 — Monday, Aug 10 | ✨ Feature

#### Bio: Link Quick-Stats + Click Sparklines

**Why**: Users shouldn't need to navigate to `/bio/analytics` just to see which links perform. Show mini click stats directly on each link row in the Bio dashboard.

**Implementation:**
- Fetch last 14 days of click data per link (grouped by day) during page load
- Display on each link row: click count badge + trend indicator

**Visual:**
```
┌──────────────────────────────────────────────┐
│ 🔗 Instagram  [↗ 23 clicks]  [toggle] [⋮]  │
│ 🔗 YouTube    [↘ 8 clicks]   [toggle] [⋮]  │
│ 🔗 Portfolio  [→ 45 clicks]  [toggle] [⋮]  │
└──────────────────────────────────────────────┘
```

**Trend Indicators:**
- ↗ Green: more clicks this week than last week
- ↘ Red: fewer clicks this week than last week
- → Gray: roughly the same (within 10% difference)

**Data Fetching** (add to bio page server query):
```typescript
const { data: clickStats } = await supabase.rpc('get_link_click_trends', {
  p_user_id: user.id,
});
// Returns: [{ link_id, this_week: 23, last_week: 15 }, ...]
```

---

### Day 32 — Tuesday, Aug 11 | ✨ Feature

#### Cashflow: Duplicate Book

**Why**: Users want to reuse a cashflow structure for a new month or project without rebuilding from scratch. Common pattern: "July Budget" → duplicate → "August Budget".

**Server Action:**
```typescript
export async function duplicateCashflow(cashflowId: string) {
  const { user, supabase } = await getAuthenticatedUser();

  // Fetch original
  const { data: original } = await supabase
    .from('cashflows').select('*').eq('id', cashflowId).eq('user_id', user.id).single();
  if (!original) return { error: 'Not found' };

  // Create copy
  const { data: newCashflow } = await supabase
    .from('cashflows')
    .insert({ user_id: user.id, title: `${original.title} (Copy)`, is_public: false })
    .select().single();

  // Copy entries (shift dates to current month)
  const { data: entries } = await supabase
    .from('cashflow_entries').select('*').eq('cashflow_id', cashflowId);

  if (entries?.length) {
    const now = new Date();
    const shifted = entries.map(e => ({
      cashflow_id: newCashflow.id,
      description: e.description,
      amount: e.amount,
      type: e.type,
      category: e.category,
      recurrence_interval: e.recurrence_interval,
      recurrence_calc: e.recurrence_calc,
      date: shiftToCurrentMonth(e.date, now),
    }));
    await supabase.from('cashflow_entries').insert(shifted);
  }

  // Copy budgets
  const { data: budgets } = await supabase
    .from('cashflow_budgets').select('*').eq('cashflow_id', cashflowId);
  if (budgets?.length) {
    await supabase.from('cashflow_budgets').insert(
      budgets.map(b => ({ cashflow_id: newCashflow.id, category: b.category, amount: b.amount }))
    );
  }

  // Copy goals
  const { data: goals } = await supabase
    .from('cashflow_goals').select('*').eq('cashflow_id', cashflowId);
  if (goals?.length) {
    await supabase.from('cashflow_goals').insert(
      goals.map(g => ({ cashflow_id: newCashflow.id, title: g.title, target_amount: g.target_amount, deadline: g.deadline }))
    );
  }

  revalidatePath('/cashflow');
  return { id: newCashflow.id };
}
```

---

### Day 33 — Wednesday, Aug 12 | ✨ Feature

#### Bio: Content Embedding (YouTube + Spotify)

**Why**: Instead of just a clickable link, users who add a YouTube/Spotify URL get an **inline player** on their public bio page. Visitors watch/listen without leaving the page. Increases time-on-page dramatically.

**Detection Logic:**
```typescript
function getEmbedInfo(url: string): { type: 'youtube' | 'spotify'; embedUrl: string } | null {
  // YouTube: youtube.com/watch?v=X or youtu.be/X
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };

  // Spotify: open.spotify.com/track/X or /album/X or /playlist/X
  const spMatch = url.match(/open\.spotify\.com\/(track|album|playlist)\/([\w]+)/);
  if (spMatch) return { type: 'spotify', embedUrl: `https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}` };

  return null;
}
```

**CSP Update** (in `csp.ts`):
```diff
-  frame-src 'none';
+  frame-src https://www.youtube.com https://open.spotify.com;
```

**Public Profile Rendering:**
```tsx
{embed && link.display_mode === 'embed' ? (
  <div className="w-full rounded-xl overflow-hidden">
    <iframe
      src={embed.embedUrl}
      width="100%"
      height={embed.type === 'youtube' ? '215' : '80'}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
      allowFullScreen={embed.type === 'youtube'}
      className="border-0"
      loading="lazy"
    />
  </div>
) : (
  <LinkButton ... /> // normal link rendering
)}
```

---

### Day 34 — Thursday, Aug 13 | 📋 Planning

#### 30-Day Retrospective + Next Sprint

- Review all 26 days: features shipped, bugs fixed, tests added
- What was estimated at 3h but took 5h? Why?
- What was the highest-impact feature shipped?
- Which future backlog items should be promoted to next sprint?
- Draft next 30-day roadmap (pull from Future Ideas Backlog below)
- Celebrate 🎉

---

## 📊 Summary

| Category | Days | Highlights |
|---|---|---|
| ✨ **Feature** | 16 | Cmd+K, Activity Feed, Link Scheduling, Section Headers, Recurring Auto-Gen, Country Analytics, Onboarding Tour, Sentry, Landing Redesign, QR Code, Notifications, Savings Goals, Share Card, Link Stats, Cashflow Duplicate, Embeds |
| 🚀 **Performance** | 2 | Public profile CWV + PWA, SEO + bundle analysis |
| 🐛 **Bugfix** | 1 | Audit debt batch (7 items in 1 day) |
| 🔧 **Improvement** | 2 | Dark shadows + List polish, Docs overhaul |
| 🧪 **Testing** | 7 | Security libs, List E2E, Support+Cashflow E2E, Bio DnD E2E, A11y audit, Build verification, Visual regression |
| 📋 **Planning** | 1 | Retrospective |

---

## 🔮 Future Ideas Backlog (Next 30 Days+)

> [!NOTE]
> Ideas that didn't make this sprint but are **worth building**. Organized by app. Impact rated 🔥🔥🔥 (high) to 🔥 (nice-to-have). Pull from this list when planning the next sprint.

---

### 🔗 Bio App

| Idea | Description | Impact | Effort |
|---|---|---|---|
| **Custom Link Thumbnails** | Auto-fetch favicons from URLs + manual upload override. Makes bio look professional | 🔥🔥 | ~3h |
| **SEO Metadata Editor** | Custom `<title>` + `<meta description>` per profile. Critical for affiliate SEO creators | 🔥🔥🔥 | ~3h |
| **Lead Capture Form** | Simple email collection widget on bio page. Creators value owned email lists over social followers | 🔥🔥🔥 | ~4h |
| **Link A/B Testing** | Show 2 versions of a link (different titles/positions), track which gets more clicks. Data-driven optimization | 🔥🔥 | ~5h |
| **Sensitive Content Warning** | Blur a link until clicked + age gate toggle. Required for certain affiliate/adult content niches | 🔥 | ~2h |
| **Link Expiry Countdown** | Display a visible countdown timer on expiring links ("Expires in 2h 30m"). Creates urgency on public page | 🔥🔥 | ~2h |
| **Custom Domain** | Map `links.yourdomain.com` to their Kytbox bio. Major Pro feature for serious creators | 🔥🔥🔥 | ~6h |
| **Testimonials Widget** | Display customer reviews/testimonials on bio page. Social proof for freelancers selling services | 🔥🔥 | ~3h |
| **Pin Important Links** | Sticky "pinned" links at top that don't move during folder navigation or search | 🔥 | ~2h |
| **Bio Page Password Protection** | Password-protect entire bio page or specific folders. For exclusive content | 🔥 | ~3h |
| **Custom CSS Editor** | Power users write their own CSS for full customization beyond themes. Pro-only | 🔥 | ~3h |
| **Bio Music Player** | Persistent audio player widget (not embed). Auto-play a track when visitors land on the page | 🔥 | ~4h |
| **Link Click Heatmap** | Visual heatmap showing which links get clicked most by position on the page | 🔥🔥 | ~4h |
| **Contact Form Widget** | Embeddable contact form on bio page. Messages go to support inbox or email | 🔥🔥 | ~3h |
| **Bio Page Views Counter** | Display "X,XXX profile views" publicly on the bio page. Social proof | 🔥 | ~1h |
| **Animated Link Previews** | Hover/tap shows a mini preview of the destination URL (like Twitter card preview) | 🔥 | ~4h |
| **Multi-page Bio** | Multiple bio pages per user (personal, business, portfolio). Switch via subdomain or path | 🔥🔥 | ~6h |

---

### 💰 Cashflow App

| Idea | Description | Impact | Effort |
|---|---|---|---|
| **Receipt/Attachment Upload** | Upload receipt photos per entry. Critical for freelancers doing tax records | 🔥🔥🔥 | ~3h |
| **Split Transactions** | One payment → multiple categories (grocery bill = food + cleaning). Accurate budgeting | 🔥🔥 | ~3h |
| **Bulk Edit/Delete** | Select multiple entries → change category, delete, or shift dates. Power user quality of life | 🔥🔥 | ~3h |
| **Custom Tags/Labels** | Beyond categories. "Client A", "Project X", "Tax Deductible". Flexible cross-category filtering | 🔥🔥 | ~3h |
| **Monthly Comparison View** | Side-by-side comparison of two months. "This month vs last month" with diff highlighting | 🔥🔥🔥 | ~4h |
| **CSV/Bank Import** | Import transactions from bank CSV exports. Removes the biggest barrier: manual data entry | 🔥🔥🔥 | ~4h |
| **PDF Report Export** | Generate a formatted PDF summary (income, expense, charts, budgets). For accountants/tax filing | 🔥🔥 | ~4h |
| **Expense Splitting** | Splitwise-style shared expenses. "Alice owes Bob $20 for dinner". Track debts between people | 🔥🔥 | ~6h |
| **Net Worth Tracker** | Track total assets + liabilities across all cashflow books. Running net worth graph over time | 🔥🔥 | ~4h |
| **Currency Conversion** | Multi-currency cashflows with auto-conversion rates. For travelers and expats | 🔥 | ~5h |
| **Cashflow Sharing via Public Link** | Like sharing a Google Sheet — send a link, recipient views/edits without needing an account | 🔥🔥 | ~4h |
| **Cashflow Templates** | Pre-built templates: "Freelancer Monthly", "Household Budget", "Project Budget". Quick start | 🔥🔥 | ~2h |
| **Financial Insights** | AI-generated insights: "Your food spending is 30% higher than last month", "You saved $200 more" | 🔥🔥🔥 | ~4h |
| **Debt Snowball/Avalanche Tracker** | Track multiple debts with payoff strategies. Popular personal finance feature | 🔥🔥 | ~5h |

---

### 📋 List App

| Idea | Description | Impact | Effort |
|---|---|---|---|
| **Due Dates + Reminders** | Deadlines on Todo cards. "Due Friday" badge, overdue = red. Push/email reminders | 🔥🔥🔥 | ~4h |
| **Priority Levels** | Low/Medium/High/Urgent flags on cards. Color-coded borders, sortable by priority | 🔥🔥 | ~2h |
| **Card Attachments** | Upload images/files to cards. Screenshots, mockups, reference documents | 🔥🔥 | ~3h |
| **Board Templates** | Pre-built templates: Sprint Board, Weekly Planner, Content Calendar, Bug Tracker, Wedding Planning | 🔥🔥🔥 | ~3h |
| **Calendar View** | View Todo cards with due dates on a calendar grid. Monthly/weekly toggle | 🔥🔥 | ~5h |
| **Assign to Collaborators** | When sharing is added — assign cards to specific people. "@alice handle this" | 🔥🔥 | ~4h |
| **Wishlist Price Alerts** | Auto-scrape price from `purchase_url`. Notify when price drops below threshold | 🔥🔥🔥 | ~6h |
| **Import from Trello/Notion** | JSON/CSV import for users migrating from competitor tools. Reduces switching cost | 🔥🔥 | ~4h |
| **Subtasks/Checklist** | Cards have sub-items. "Deploy feature" → ☐ Write code ☐ Write tests ☐ Deploy | 🔥🔥🔥 | ~3h |
| **Card Comments** | Comment thread on each card. Discussion when boards are shared with team | 🔥 | ~3h |
| **Recurring Tasks** | "Every Monday: Review PRs". Auto-creates cards on schedule | 🔥🔥 | ~4h |
| **Archiving** | Archive completed boards instead of deleting. Searchable history of past projects | 🔥 | ~2h |
| **Wishlist Price Comparison** | Compare prices across multiple stores for the same item. Link multiple URLs per wish item | 🔥 | ~3h |
| **List Sharing with ACL** | Share lists with read/edit permissions (like Cashflow sharing model). Collaborative todo boards | 🔥🔥🔥 | ~5h |
| **Kanban WIP Limits** | Set maximum cards per column. "In Progress: max 3". Enforces focus | 🔥 | ~2h |

---

### 🏗️ Platform-Level

| Idea | Description | Impact | Effort |
|---|---|---|---|
| **Two-Factor Auth (2FA)** | TOTP-based 2FA via authenticator app. Security feature that builds trust before enterprise | 🔥🔥🔥 | ~4h |
| **Export All Data (GDPR)** | One-click download all user data as JSON/ZIP. Legal requirement for EU users | 🔥🔥🔥 | ~3h |
| **Browser Extension** | Quick-add links to Bio from any webpage. Right-click → "Add to Kytbox Bio" | 🔥🔥 | ~6h |
| **Telegram/Discord Bot** | Add cashflow entries or check bio stats from chat. `/add expense 50 food` | 🔥🔥 | ~5h |
| **API Access + Webhooks** | Public developer API for integrations. Webhooks for "link clicked", "entry added" events | 🔥🔥 | ~6h |
| **Multi-language UI (i18n)** | Indonesian, Malay, Japanese, etc. Unlocks non-English markets. Use `next-intl` or similar | 🔥🔥🔥 | ~8h |
| **Mobile App (Capacitor)** | Wrap PWA as native iOS/Android app via Capacitor. App Store / Play Store presence | 🔥🔥🔥 | ~8h |
| **Team Workspaces** | Multiple users, one workspace. Shared cashflows, shared boards, role-based access control | 🔥🔥🔥 | ~10h |
| **Keyboard Shortcuts Guide** | `?` key opens full shortcut reference overlay. Power user feature, low effort | 🔥 | ~1h |
| **Global Search** | Search across ALL apps — links, entries, cards, tickets. Results grouped by app type | 🔥🔥🔥 | ~4h |
| **Changelog Page** | `/changelog` — public page showing latest updates. Builds user trust and transparency | 🔥🔥 | ~2h |
| **Public Roadmap** | `/roadmap` — voteable public roadmap. Users suggest + vote on features. Builds community | 🔥🔥 | ~4h |
| **Referral System** | "Invite friends, get perks." Viral growth loop. Track referral codes + reward system | 🔥🔥🔥 | ~5h |
| **Dark/Light per App** | Dashboard in dark mode, bio page in custom theme. Independent preferences per context | 🔥 | ~2h |
| **Session Management** | View active sessions, revoke sessions remotely. Security + trust feature | 🔥🔥 | ~3h |
| **Account Deletion** | Self-service account deletion with grace period. Required for app store compliance | 🔥🔥🔥 | ~2h |
| **Email Notifications** | Opt-in email digests: weekly analytics summary, budget alerts, new support replies | 🔥🔥 | ~4h |
| **OAuth: Apple + GitHub** | Additional OAuth providers beyond Google. Apple required for iOS app store | 🔥🔥 | ~3h |

---

### 💵 Monetization (When Ready)

| Idea | Description | Impact | Effort |
|---|---|---|---|
| **`canAccess()` Feature Gate** | Utility function to check user tier before showing Pro features | 🔥🔥🔥 | ~1h |
| **Lemon Squeezy Integration** | Payment processing via MoR. Subscriptions table, webhook handler, pg_cron cleanup | 🔥🔥🔥 | ~8h |
| **Upgrade UI + Paywalls** | "Upgrade to Pro" buttons, feature comparison modal, smooth checkout redirect | 🔥🔥🔥 | ~4h |
| **Usage Analytics Dashboard** | Admin page showing MRR, churn rate, conversion rate, active users, revenue by plan | 🔥🔥 | ~4h |
| **Trial Period** | 14-day free trial of Pro features. Auto-downgrade after expiry. Email reminder at day 12 | 🔥🔥 | ~3h |
| **Pricing Page** | `/pricing` — public pricing comparison page. Free vs Pro feature matrix | 🔥🔥🔥 | ~3h |

---

### 📊 Infrastructure (When Scale Demands)

| Idea | Description | Impact | Effort |
|---|---|---|---|
| **Load/Stress Testing** | k6 or Artillery — simulate 1000 concurrent users on public profiles | 🔥🔥 | ~3h |
| **FSD Architecture Refactor** | Full Feature-Sliced Design migration for better code organization at scale | 🔥🔥 | ~10h+ |
| **Visual Regression CI** | Auto-compare Playwright screenshots on every PR. Catch CSS regressions automatically | 🔥🔥 | ~3h |
| **Staging Environment** | Separate Supabase project + Vercel preview branch for pre-prod testing | 🔥🔥🔥 | ~4h |
| **Database Read Replicas** | When query load justifies it. Read from replica, write to primary. Supabase supports this | 🔥 | ~4h |
| **Edge Functions** | Move heavy/frequent queries to Supabase Edge Functions for lower global latency | 🔥 | ~4h |
| **Rate Limit Dashboard** | Admin view of rate limit hits. See who's being throttled and why | 🔥 | ~2h |
| **Automated DB Backups** | Scheduled Supabase backups with point-in-time recovery testing | 🔥🔥🔥 | ~2h |

---

_Last Updated: July 11, 2026_
