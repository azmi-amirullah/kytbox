# Kytbox Bio Documentation

Focus: **Scalable branding and high-performance UX.**

## 1. Core Features

- **Auth**: Login (Email/Password + Google OAuth), Signup (user picks username), Forgot Password, Update Password, Onboarding (username completion for OAuth users)
- **CRUD Links**: Add, Edit, Delete, Reorder (Drag & Drop), Toggle visibility
- **Public Page**: `/{username}` (SEO optimized profile with dynamic metadata)
- **Tracking**: Server-side click counting via Supabase RPC
- **Settings**: Profile management (username, display name, bio, avatar upload/removal)
- **Dashboard**: Tab-based management (Links vs Appearance), live phone preview, real-time stats, and mobile-first responsive architecture.
- **Sticky Search Bar**: Persistent search on the public bio page for instant link discovery across deep folder structures, with dynamic folder context.
- **Link Animations**: Strategic visual highlights (Pulse, Bounce, Glow) for individual links and folders to draw attention to high-priority referral links. Configurable per-item from the admin dashboard.
- **Nested Folders**: Recursive single-table PostgreSQL design. Native iOS-style slide transitions via Framer Motion for drill-down navigation.
- **High-Performance Pagination**: Native "Load More" pattern for both root-level links and nested folder contents on the public profile and dashboard preview.
- **Hybrid Sync Engine**: 1:1 state synchronization between the dashboard editor and phone preview using a 'Server-as-Truth' Refresh API for structural changes (Add/Move) and local patching for micro-interactions (Toggles/Drag).

## 2. Tech Stack

- **Framework**: **Next.js 16** (App Router) + **React 19**
- **Database**: **Supabase** (Postgres + Auth + Storage + RLS)
- **Styling**: **Tailwind CSS v4** + **Shadcn/UI**
- **Drag & Drop**: **@dnd-kit** (core, sortable, utilities)
- **Notifications**: **react-toastify**
- **Deployment**: **Vercel**

### Environment Variables

Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-anon-key
```

## 3. Database Schema (Supabase)

### `profiles`

| Column             | Type        | Notes                               |
| :----------------- | :---------- | :---------------------------------- |
| `id`               | uuid        | PK, references `auth.users.id`      |
| `username`         | text        | Unique, index. Used for public URL. |
| `display_name`     | text        | Nullable                            |
| `bio`              | text        | Nullable                            |
| `avatar_url`       | text        | Nullable                            |
| `theme_name`       | text        | Nullable                            |
| `button_style`     | text        | Nullable                            |
| `button_shape`     | text        | Nullable                            |
| `default_currency` | text        | Nullable                            |
| `created_at`       | timestamptz |                                     |
| `role`             | text        | 'user' or 'admin'                   |
| `social_links`     | json        | Nullable                            |
| `custom_theme`     | jsonb       | Hex & Alpha variables for engine    |
| `tier`             | text        | 'free', 'pro', or 'enterprise'      |

### `links`

| Column            | Type        | Notes                                               |
| :---------------- | :---------- | :-------------------------------------------------- |
| `id`              | uuid        | PK                                                  |
| `user_id`         | uuid        | FK -> `profiles.id`                                 |
| `title`           | text        | Display text                                        |
| `url`             | text        | Destination URL                                     |
| `sort_order`      | int         | For ordering links                                  |
| `is_active`       | bool        | Toggle visibility                                   |
| `clicks`          | int         | Default 0                                           |
| `last_clicked_at` | timestamptz | Nullable. Tracks last usage.                        |
| `is_folder`       | bool        | True if item is a folder                            |
| `parent_id`       | uuid        | Self-referencing FK for nesting (ON DELETE CASCADE) |
| `created_at`      | timestamptz |                                                     |
| `short_id`        | int         | Per-user sequential ID (1, 2, 3). Unique per user.  |

### `link_events` (Analytics)

| Column       | Type        | Notes                     |
| :----------- | :---------- | :------------------------ |
| `id`         | uuid        | PK                        |
| `link_id`    | uuid        | FK -> `links.id`          |
| `created_at` | timestamptz | Event timestamp           |
| `user_agent` | text        | Nullable                  |
| `referer`    | text        | Nullable. Traffic source. |
| `country`    | text        | Nullable. Future use.     |
| `city`       | text        | Nullable. Future use.     |

### `profile_events` (Page Views)

| Column       | Type        | Notes                     |
| :----------- | :---------- | :------------------------ |
| `id`         | uuid        | PK                        |
| `profile_id` | uuid        | FK -> `profiles.id`       |
| `created_at` | timestamptz | Event timestamp           |
| `user_agent` | text        | Nullable                  |
| `referer`    | text        | Nullable. Traffic source. |
| `country`    | text        | Nullable.                 |
| `city`       | text        | Nullable.                 |

### Supabase RPC Functions

- **`increment_link_click(link_id uuid)`**: Increments `clicks` and updates `last_clicked_at`
- **`get_analytics_chart_data(p_link_ids uuid[], p_start_date timestamptz, p_bucket_interval text)`**: Aggregates clicks by time bucket (hour/day/all)
- **`get_top_referers(p_link_ids uuid[], p_start_date timestamptz, p_limit int)`**: Returns top traffic sources

### Security (RLS)

- **Profiles**: Public READ. INSERT/UPDATE for Owner only.
- **Links**: Public READ (where `is_active = true`). All CRUD for Owner only.
- **link_events**: Anonymous INSERT (for click tracking). READ via RPC only (owner's links).

## 4. Architecture & Routing

### Route Structure (Kytbox Spec)

**Logged-in routes** (protected by `proxy.ts`):

| Route            | Purpose                            |
| :--------------- | :--------------------------------- |
| `/app`           | Platform header / app switcher     |
| `/bio`           | Bio dashboard (Links + Appearance) |
| `/cashflow`      | Cashflow dashboard                 |
| `/settings`      | Account settings (profile)         |
| `/onboarding`    | Username completion (OAuth users)  |
| `/support`       | User support portal                |
| `/support-admin` | Admin support dashboard            |

**Public routes**:

| Route            | Purpose                |
| :--------------- | :--------------------- |
| `/{username}`    | Public Bio page        |
| `/cashflow/[id]` | Public/Shared Cashflow |
| `/login`         | Login page             |
| `/signup`        | Signup page            |

### Project Structure

```text
src/
├── app/
│   ├── (marketing)/               # Marketing/Landing pages (no platform shell)
│   │   ├── page.tsx               # Landing page
│   │   └── loading.tsx
│   ├── (platform)/                # Platform routes group (shared layout)
│   │   ├── layout.tsx             # Platform shell with header
│   │   ├── app/                   # Platform shell with app switcher
│   │   │   └── page.tsx
│   │   ├── bio/                   # Bio dashboard
│   │   │   ├── page.tsx
│   │   │   ├── actions.ts
│   │   │   ├── components/
│   │   │   └── analytics/
│   │   │       ├── page.tsx
│   │   │       ├── actions.ts
│   │   │       └── components/
│   │   ├── settings/              # Account settings
│   │   │   ├── page.tsx
│   │   │   ├── SettingsForm.tsx
│   │   │   └── actions.ts
│   │   └── cashflow/              # Cashflow dashboard
│   │       ├── page.tsx
│   │       ├── actions.ts
│   │       └── components/
│   ├── (auth)/                    # Auth pages (shared auth layout)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── layout.tsx
│   │   └── actions.ts             # Auth + username check actions
│   ├── cashflow/[id]/             # Public cashflow detail (outside platform)
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── onboarding/page.tsx        # OAuth username completion
│   ├── auth/callback/route.ts     # Magic link & OAuth handler
│   ├── update-password/page.tsx
│   ├── [username]/
│   │   ├── page.tsx               # Public profile
│   │   └── [linkId]/route.ts      # Click tracking redirect
│   └── layout.tsx                 # Root layout
├── components/
│   ├── skeletons/                 # Reusable skeleton components
│   │   └── platform-header-skeleton.tsx
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── username.ts                # Username validation & reserved list
│   ├── avatar.ts
│   └── utils.ts
├── proxy.ts                       # Next.js 16 middleware
└── types/supabase.ts
```

### Server Actions

#### Auth Actions (`src/app/(auth)/actions.ts`)

| Action                   | Description                       |
| :----------------------- | :-------------------------------- |
| `login`                  | Email/password sign in            |
| `signup`                 | Email/password + username sign up |
| `logout`                 | Sign out user                     |
| `resetPassword`          | Send password reset email         |
| `updatePassword`         | Update user password              |
| `checkUsernameAvailable` | Check username for signup form    |

#### Bio Actions (`src/app/(platform)/bio/actions.ts`)

| Action             | Description                            |
| :----------------- | :------------------------------------- |
| `addLink`          | Create new link with URL validation    |
| `updateLink`       | Edit existing link                     |
| `deleteLink`       | Delete link by ID (with user_id check) |
| `toggleLinkActive` | Toggle link visibility                 |
| `reorderLinks`     | Update sort_order for all links        |
| `createFolder`     | Create a new nested directory folder   |
| `moveToFolder`     | Move a link into or out of a folder    |

#### Settings Actions (`src/app/(platform)/settings/actions.ts`)

| Action          | Description                           |
| :-------------- | :------------------------------------ |
| `updateProfile` | Update username, display name, bio    |
| `uploadAvatar`  | Upload avatar to Supabase Storage     |
| `removeAvatar`  | Delete avatar from storage            |
| `checkUsername` | Real-time username availability check |

### Auth Flow

1. **Email Signup**: User picks username + Email + Password → Create profile (via DB trigger)
2. **Google OAuth Signup**: Google sign-in → Redirect to `/onboarding` (if no username) → Pick username → Complete profile
3. **Login**: Email + Password OR Google OAuth → Redirect to `/app` (or `/onboarding` if profile incomplete)
4. **Forgot Password**: Email → Reset link → `/auth/callback` → `/update-password`
5. **Onboarding**: Users without a username are redirected here to complete their profile before accessing the platform

### Click Tracking (`/{username}/[linkId]`)

1. Link buttons on public page point to `/{username}/[linkId]`
2. Server calls `increment_link_click` RPC to update count
3. Redirects to actual `url`

## 5. Username Rules (Kytbox Spec)

### Allowed Characters

- Lowercase letters `a-z`
- Numbers `0-9`
- Single hyphen `-` (not at start or end)

### Disallowed

- Uppercase (auto-lowercased)
- Underscore, dot, spaces
- Consecutive hyphens (`--`)
- Start/end with hyphen

### Length

- Minimum: 3 characters
- Maximum: 20 characters

### Reserved Usernames

Blocked: `login`, `signup`, `app`, `admin`, `api`, `blog`, `terms`, `privacy`, `www`, `auth`, `callback`, `dashboard`, `settings`, `bio`, `list`, `track`, `id`, etc.

See `src/lib/username.ts` for full list.

## 6. Security Features

- **URL Validation**: HTTP/HTTPS only, valid TLD enforcement
- **User ID Checks**: All CRUD operations verify `user_id` ownership
- **Avatar Validation**: Image type and 2MB size limit
- **Username Validation**: Kytbox-compliant format, reserved name blocking
- **Route Protection**: `proxy.ts` protects `/app/*` routes

## 7. Current Status

✅ Auth (Login, Signup with username picker, Forgot Password, Update Password)  
✅ Bio Dashboard at `/bio` with Add/Edit/Delete links  
✅ Drag-and-drop reordering  
✅ Toggle link visibility  
✅ Public profile at `/{username}` with click tracking  
✅ Account settings at `/settings`  
✅ Avatar upload/removal with compression  
✅ Live phone preview (1:1 parity with public page)  
✅ Real-time username availability check  
✅ Platform shell with app switcher  
✅ Dark/Light theme support  
✅ Analytics dashboard at `/bio/analytics` (link clicks, date filtering, chart)  
✅ Bio Page View Tracking (Server-side via Supabase)  
✅ Social Link Icons (Auto-detection with 20+ platforms)  
✅ Unified skeleton architecture for Bio & Analytics (zero-jank loading)  
✅ Unified Profile Component Architecture (100% parity via mobile-first CSS scaling)  
✅ High-Performance Custom Theme Engine (Debounced + CSS Variables)  
✅ Nested Folders (Drill-Down UI & Native iOS-style slide transitions)  
✅ Sticky Search Bar (Public page, dynamic folder context)  
✅ Link & Folder Animations (Pulse, Bounce, Glow — configurable per-item)  
✅ Link List Pagination (High-performance "Load More" for 100+ items)
✅ Phone Preview State Synchronization (Hybrid Refresh API with parallel segment updates)
✅ Resilient Data Mapping (Safe handling of database nulls and type mismatches)
✅ Atomic Folder-to-Root Navigation (Synchronized list and badge updates)

## 8. Social Link Icons (Implemented)

**Goal**: Automatically detect and display social icons based on link URLs to improve visual appeal.

**Implementation**:

- **Auto-detection**: `social-icons.tsx` utility detects platform from URL hostname
- **Supported Platforms**: Instagram, Twitter/X, Facebook, LinkedIn, GitHub, YouTube, TikTok, Spotify, Twitch, Discord, Telegram, WhatsApp, Snapchat, Pinterest, Medium, Reddit, Behance, Dribbble
- **Special Protocols**: Email (`mailto:`), Phone (`tel:`), SMS (`sms:`)
- **Fallback**: Generic globe icon for unrecognized links
- **Icon Library**: Uses `react-icons` (Lucide + Font Awesome 6)
- **Integration**: Icons appear in both public profile and live phone preview

## 9. Analytics Features (Implemented)

### Dashboard (`/app/bio/analytics`)

- **Charts**:
  - **Lifetime View**: Shows monthly buckets starting from the first recorded click (dynamic start date).
  - **Time Ranges**: 24h (hourly), 7 days (daily), 30 days (daily), Lifetime (monthly).
  - **Click Activity**: Visualize trends over time with solid grid lines and instant-hover tooltips.

- **Filters**:
  - **By Link**: Dropdown sorted by user's custom order.
  - **By Date**: Dropdown for time ranges (24h, 7d, 30d, Lifetime).

- **UX & Performance (Zero-Jank)**:
  - **Unified Skeletons**: Uses actual client components with `isLoading` props to ensure 100% layout match during loading.
  - **Instant Render**: Recharts animations disabled to prevent empty space flashes during data hydration.
  - **Hydration Guards**: Charts and theme toggles use strict `mounted` states to avoid DOM measurement errors on load.
  - **Consistency**: Analytics stats cards use standard `rounded-2xl` and `text-sm` typography to match the main Bio dashboard.
- **Lifetime Labels**: Dynamically shows "Month Year - Month Year" or single month if range is small.

- **Stats**:
  - **Total Clicks**: Aggregated count for selected period.
  - **Top Source**: Most frequent referer (e.g., "instagram.com" or "Direct").
  - **Average**: Average clicks per bucket (hour/day/month).
  - **Top Links**: Table showing best performing links.

- **Technical Implementation**:
  - **Server-Side Aggregation**: All chart data is aggregated in PostgreSQL via RPC `get_analytics_chart_data`.
  - **Dynamic Start Date**: Lifetime charts automatically detect the first click date to avoid showing empty historical months.
  - **Optimized**: No client-side processing of raw events.

## 10. Theme System (Implemented)

**Goal**: Allow users to customize the look of their Bio page with pre-defined themes.

### Available Themes

| Theme ID   | Name          | Type     |
| :--------- | :------------ | :------- |
| `default`  | Clean Light   | Solid    |
| `dark`     | Deep Dark     | Solid    |
| `gradient` | Cosmic Purple | Gradient |
| `peach`    | Peach Sunset  | Gradient |
| `deepsea`  | Deep Sea      | Gradient |
| `emerald`  | Emerald Lake  | Gradient |
| `lavender` | Soft Lavender | Gradient |
| `latte`    | Creamy Latte  | Gradient |
| `midnight` | Midnight Blue | Gradient |
| `sunset`   | Sunset Gold   | Gradient |
| `rosegold` | Rose Gold     | Gradient |
| `ocean`    | Ocean Breeze  | Gradient |
| `charcoal` | Charcoal      | Gradient |

### Button Options

- **Shapes**: Rounded, Square, Pill, Leaf
- **Styles**: Solid Fill, Outline

### Technical Implementation

- **Centralized Config**: All themes defined in `src/lib/theme/theme.config.ts`
- **Type-Safe**: TypeScript interfaces in `src/lib/theme/theme.types.ts`
- **Utility Functions**: `getTheme()`, `getContainerClasses()`, `getButtonClasses()` in `src/lib/theme/theme.utils.ts`
- **Theme Isolation**: Uses explicit Tailwind classes (for presets) and CSS Variable injection (for custom themes) to ensure profiles render consistently regardless of visitor's system dark/light mode.
- **Dynamic Normalization**: Incomplete hex codes are predictive-padded at the edge to ensure CSS variable validity during real-time typing.

### Adding New Themes

1. Add theme config to `THEMES` object in `theme.config.ts`
2. Add theme ID to `ThemeId` union type in `theme.types.ts`

## 11. Planned Features

- **Analytics Ambiguity Resolution**: Current implementation filters folders from click charts; future phase will add specific "Folder Open" event tracking.
- **Username change cooldown** (§7 Kytbox.md) — deferred to post-launch scale.
- **Custom Domain support** — deferred.
- **Advanced SEO metadata editor** — Pro feature, deferred.

_Last Updated: March 11, 2026_
