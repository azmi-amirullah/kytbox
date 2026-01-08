# Link-in-Bio "Brutal MVP" Plan

Focus: **Speed to functional product.** Avoid "graveyard" features (complex themes, payments, custom domains) in version 1.

## 1. Core MVP Features

- **Auth**: Simple Login/Signup (Supabase Auth).
- **CRUD Links**: Add, Edit, Delete, Reorder (Drag & Drop).
- **Public Page**: `/u/[username]` (Fast, simple profile).
- **Tracking**: Server-side redirect counting (Robust).

## 2. Tech Stack

- **Framework**: **Next.js 16** (App Router).
- **Database**: **Supabase** (Postgres + Auth + RLS).
- **Styling**: **Tailwind CSS** (Mobile-first, Atomic).
- **Deployment**: **Vercel**.

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
├── (auth)/             # Login/Signup pages
├── dashboard/          # User Dashboard (Protected)
│   └── page.tsx        # Link Editor (CRUD + DndKit)
├── u/
│   └── [username]/     # Public Profile Page
│       ├── page.tsx    # Fetches Profile/Links & Renders
│       └── [linkId]/   # Redirect Route
│           └── route.ts # GET: Increment click -> Redirect
├── layout.tsx
└── global.css
```

### Click Tracking Strategy (`/u/[username]/[linkId]`)

Instead of client-side generic events, use a "Branded Redirect" pattern.

1.  **User copies link**: `mysite.com/u/azmi` -> Link buttons point to `/u/azmi/uuid-of-link`.
2.  **Server (`route.ts`)**:
    _ Receives request.
    _ Increment `clicks` count in DB (RPC or direct update).
    - Redirects (307) to actual `url`.
      \*Benefit\*: Works with JS disabled, more accurate, prevents client-side spamming easily.

## 5. Implementation Steps

1.  **Setup**: Next.js repo, Supabase project.
2.  **DB**: Run SQL migration for tables + RLS policies.
3.  **Auth**: Build Login page.
4.  **Dashboard**: Build CRUD interface with `@dnd-kit`.
5.  **Public Page**: Build `/u/[username]` view.
6.  **Redirect**: Implement `/u/[username]/[linkId]` route.
