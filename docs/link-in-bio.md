# Link-Base Documentation

Focus: **Speed to functional product.** Avoid \"graveyard\" features (complex themes, payments, custom domains) in version 1.

## 1. Core Features

- **Auth**: Login, Signup (auto-generated username), Forgot Password
- **CRUD Links**: Add, Edit, Delete, Reorder (Drag & Drop)
- **Public Page**: `/u/[username]` (Fast, simple profile)
- **Tracking**: Server-side redirect counting

## 2. Tech Stack

- **Framework**: **Next.js 16** (App Router)
- **Database**: **Supabase** (Postgres + Auth + RLS)
- **Styling**: **Tailwind CSS** + **Shadcn/UI**
- **Drag & Drop**: **@dnd-kit**
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

| Column            | Type        | Notes                        |
| :---------------- | :---------- | :--------------------------- |
| `id`              | uuid        | PK                           |
| `user_id`         | uuid        | FK -> `profiles.id`          |
| `title`           | text        | Display text                 |
| `url`             | text        | Destination URL              |
| `sort_order`      | int         | For ordering links           |
| `is_active`       | bool        | Toggle visibility            |
| `clicks`          | int         | Default 0                    |
| `last_clicked_at` | timestamptz | Nullable. Tracks last usage. |
| `created_at`      | timestamptz |                              |

### Security (RLS)

- **Profiles**: Public READ. INSERT/UPDATE for Owner only.
- **Links**: Public READ (where `is_active = true`). All CRUD for Owner only.

## 4. Architecture & Routing

### Project Structure

```text
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   └── actions.ts
├── auth/callback/route.ts    # Magic link handler
├── update-password/page.tsx  # New password form
├── dashboard/
│   └── components/
│       ├── AddLinkModal.tsx
│       ├── LinkList.tsx
│       └── SortableLink.tsx
├── u/[username]/
│   ├── page.tsx              # Public profile
│   └── [linkId]/route.ts     # Click tracking redirect
├── page.tsx                  # Dashboard (protected)
└── layout.tsx
```

### Auth Flow

1. **Signup**: Email + Password → Auto-generate username → Create profile
2. **Login**: Email + Password → Redirect to dashboard
3. **Forgot Password**: Email → Reset link → `/auth/callback` → `/update-password`

### Click Tracking (`/u/[username]/[linkId]`)

1. Link buttons point to `/u/azmi/uuid-of-link`
2. Server increments `clicks` count in DB
3. Redirects (307) to actual `url`

## 5. Current Status

✅ Auth (Login, Signup, Forgot Password)
✅ Dashboard with Add/Delete links
✅ Drag-and-drop reordering
✅ Public profile with click tracking

🔄 **Next**: Edit Link functionality
📋 **Later**: Profile settings, Analytics, Custom themes
