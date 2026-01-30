# UKIT Bio Documentation

Focus: **Speed to functional product.** Avoid "graveyard" features (custom themes, payments, custom domains) in version 1.

## 1. Core Features

- **Auth**: Login, Signup (user picks username), Forgot Password, Update Password
- **CRUD Links**: Add, Edit, Delete, Reorder (Drag & Drop), Toggle visibility
- **Public Page**: `/{username}` (SEO optimized profile with dynamic metadata)
- **Tracking**: Server-side click counting via Supabase RPC
- **Settings**: Profile management (username, display name, bio, avatar upload/removal)
- **Dashboard**: Stats bar (lifetime clicks, active/total links), live phone preview, minimalist grid background

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

| Column         | Type        | Notes                               |
| :------------- | :---------- | :---------------------------------- |
| `id`           | uuid        | PK, references `auth.users.id`      |
| `username`     | text        | Unique, index. Used for public URL. |
| `display_name` | text        |                                     |
| `bio`          | text        |                                     |
| `avatar_url`   | text        | Nullable                            |
| `created_at`   | timestamptz |                                     |

### `links`

| Column            | Type        | Notes                                              |
| :---------------- | :---------- | :------------------------------------------------- |
| `id`              | uuid        | PK                                                 |
| `user_id`         | uuid        | FK -> `profiles.id`                                |
| `title`           | text        | Display text                                       |
| `url`             | text        | Destination URL                                    |
| `sort_order`      | int         | For ordering links                                 |
| `is_active`       | bool        | Toggle visibility                                  |
| `clicks`          | int         | Default 0                                          |
| `last_clicked_at` | timestamptz | Nullable. Tracks last usage.                       |
| `created_at`      | timestamptz |                                                    |
| `short_id`        | int         | Per-user sequential ID (1, 2, 3). Unique per user. |

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

### Route Structure (UKIT Spec)

**Logged-in routes** (protected by `proxy.ts`):

| Route           | Purpose                         |
| :-------------- | :------------------------------ |
| `/app`          | Platform shell (app switcher)   |
| `/app/bio`      | Bio dashboard (link management) |
| `/app/settings` | Account settings (profile)      |

**Public routes**:

| Route         | Purpose         |
| :------------ | :-------------- |
| `/{username}` | Public Bio page |
| `/login`      | Login page      |
| `/signup`     | Signup page     |

**Legacy redirects** (for backward compatibility):

| Old Route    | Redirects To    |
| :----------- | :-------------- |
| `/dashboard` | `/app/bio`      |
| `/settings`  | `/app/settings` |

### Project Structure

```text
src/
├── app/
│   ├── app/                       # UKIT platform routes (protected)
│   │   ├── page.tsx               # Platform shell with app switcher
│   │   ├── bio/
│   │   │   ├── page.tsx           # Bio dashboard
│   │   │   ├── actions.ts         # Link CRUD actions
│   │   │   ├── components/        # Dashboard components
│   │   │   └── analytics/
│   │   │       ├── page.tsx       # Analytics dashboard
│   │   │       ├── actions.ts     # Analytics data fetching (RPC)
│   │   │       └── components/    # Chart, filters
│   │   └── settings/
│   │       ├── page.tsx           # Account settings
│   │       ├── SettingsForm.tsx   # Profile form
│   │       └── actions.ts         # Profile actions
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── layout.tsx
│   │   └── actions.ts             # Auth + username check actions
│   ├── auth/callback/route.ts     # Magic link handler
│   ├── update-password/page.tsx
│   ├── dashboard/page.tsx         # Legacy redirect → /app/bio
│   ├── settings/page.tsx          # Legacy redirect → /app/settings
│   ├── [username]/
│   │   ├── page.tsx               # Public profile
│   │   └── [linkId]/route.ts      # Click tracking redirect
│   └── page.tsx                   # Landing page
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

#### Bio Actions (`src/app/app/bio/actions.ts`)

| Action             | Description                            |
| :----------------- | :------------------------------------- |
| `addLink`          | Create new link with URL validation    |
| `updateLink`       | Edit existing link                     |
| `deleteLink`       | Delete link by ID (with user_id check) |
| `toggleLinkActive` | Toggle link visibility                 |
| `reorderLinks`     | Update sort_order for all links        |

#### Settings Actions (`src/app/app/settings/actions.ts`)

| Action          | Description                           |
| :-------------- | :------------------------------------ |
| `updateProfile` | Update username, display name, bio    |
| `uploadAvatar`  | Upload avatar to Supabase Storage     |
| `removeAvatar`  | Delete avatar from storage            |
| `checkUsername` | Real-time username availability check |

### Auth Flow

1. **Signup**: User picks username + Email + Password → Create profile (via DB trigger)
2. **Login**: Email + Password → Redirect to `/app`
3. **Forgot Password**: Email → Reset link → `/auth/callback` → `/update-password`

### Click Tracking (`/{username}/[linkId]`)

1. Link buttons on public page point to `/{username}/[linkId]`
2. Server calls `increment_link_click` RPC to update count
3. Redirects to actual `url`

## 5. Username Rules (UKIT Spec)

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
- **Username Validation**: UKIT-compliant format, reserved name blocking
- **Route Protection**: `proxy.ts` protects `/app/*` routes

## 7. Current Status

✅ Auth (Login, Signup with username picker, Forgot Password, Update Password)  
✅ Bio Dashboard at `/app/bio` with Add/Edit/Delete links  
✅ Drag-and-drop reordering  
✅ Toggle link visibility  
✅ Public profile at `/{username}` with click tracking  
✅ Account settings at `/app/settings`  
✅ Avatar upload/removal with compression  
✅ Live phone preview  
✅ Real-time username availability check  
✅ Platform shell with app switcher  
✅ Dark/Light theme support  
✅ Analytics dashboard at `/app/bio/analytics` (link clicks, date filtering, chart)
✅ Bio Page View Tracking (Server-side via Supabase)
✅ Social Link Icons (Auto-detection with 20+ platforms)

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
  - **UX**: Filters are disabled (grayed out) while data is loading.
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

## 10. Planned Features

### Custom Themes

**Goal**: Allow users to customize the look of their Bio page.

**Implementation**:

- Pre-defined themes (Dark, Light, Gradient).
- Button styles (Rounded, Square, Outline).

### Other Future Features

- Username change cooldown (§7 ukit.md)
- Export analytics data
