# Database Schema & Security Guide

Kytbox uses a multi-tenant database architecture powered by Supabase (PostgreSQL). This document serves as the definitive reference for the shared data model and row-level security (RLS) policies.

## 1. Core Identity & Profiles

### `public.profiles`

The root identity for all Kytbox users.

| Column             | Type    | Default     | Description                                               |
| :----------------- | :------ | :---------- | :-------------------------------------------------------- |
| `id`               | `uuid`  | -           | Primary Key (links to `auth.users`).                      |
| `username`         | `text`  | -           | Unique public handle.                                     |
| `role`             | `text`  | `'user'`    | Either `'user'` or `'admin'`. Controls restricted access. |
| `theme_name`       | `text`  | `'default'` | Bio app visual theme.                                     |
| `custom_theme`     | `jsonb` | `null`      | Custom Hex variables and transparency data.               |
| `button_style`     | `text`  | `'default'` | Shape/Border style for profile buttons.                   |
| `button_shape`     | `text`  | `'rounded'` | Corner radius/leaf style for buttons.                     |
| `default_currency` | `text`  | `'USD'`     | Cashflow app default currency.                            |

---

## 2. App-Specific Tables

### 2.1 Bio App

The Bio app uses a recursive structure to support both simple lists and nested folders.

#### `public.links`

| Column            | Type          | Description                                               |
| :---------------- | :------------ | :-------------------------------------------------------- |
| `id`              | `uuid`        | Primary Key.                                              |
| `user_id`         | `uuid`        | FK -> `profiles.id`.                                      |
| `title`           | `text`        | Display name for the link or folder.                      |
| `url`             | `text`        | Destination URL (null for folders).                       |
| `sort_order`      | `int`         | Manual sorting order within the current level.            |
| `is_active`       | `bool`        | visibility toggle.                                        |
| `is_folder`       | `bool`        | If true, this item acts as a container.                   |
| `parent_id`       | `uuid`        | Self-referencing FK for nested folders.                   |
| `animation_type`  | `text`        | Visual highlight (e.g., `'pulse'`, `'glow'`, `'bounce'`). |
| `short_id`        | `int`         | Secure sequential ID for public redirect URLs.             |
| `clicks`          | `int`         | Total lifetime click count.                               |
| `last_clicked_at` | `timestamptz` | timestamp of the most recent interaction.                 |

- **Security:** RLS allows standard users to `INSERT/UPDATE/DELETE` only where `user_id = auth.uid()`.
- **Public Access:** The public profile can only `SELECT` links where `is_active = true`.

#### `public.link_events`

Analytics for link clicks (UA, Country, Referer). Used to populate the Bio analytics dashboard via server-side RPCs.

### 2.2 Supabase RPC Functions

- **`increment_link_click(link_id uuid)`**: Increments `clicks` and updates `last_clicked_at`.
- **`reorder_links(p_link_ids uuid[])`**: Bulk updates `sort_order` for an array of links.
- **`get_analytics_chart_data(...)`**: Aggregates clicks for Bio analytics charts.

### 2.3 Cashflow App (`cashflows`, `cashflow_entries`, `cashflow_shares`, `cashflow_budgets`)

- **`cashflows`**: Virtual wallets/accounts.
- **`cashflow_entries`**: Immutable transaction log.
- **`cashflow_shares`**: ACL for sharing cashflows with other users by email.
- **`cashflow_budgets`**: Monthly spending limits per category per cashflow. Unique on `(cashflow_id, category)`. Cascade-deletes with the parent cashflow. RLS: owners manage all; editors read via `auth.jwt() ->> 'email'` match on `cashflow_shares`.

### 2.4 Support System (`support_tickets`, `support_messages`)

- **`support_tickets`**: High-level support requests.
- **`support_messages`**: Conversations within a ticket.

### 2.5 List App (`lists`, `list_columns`, `list_items`)

- **`lists`**: Parent container for all types of lists (todo, wishlist, idea). Includes `is_public` sharing toggle.
- **`list_columns`**: Used only for Kanban boards (type: `todo`). Includes `is_done_column` for automatic completion syncing.
- **`list_items`**: Child items. Uses `metadata` JSONB for type-specific data (e.g., price and url for wishlists). Maps to a `column_id` if it belongs to a Kanban board.

---

## 3. Row Level Security (RLS) Strategy

Kytbox strictly enforces RLS at the database layer to ensure data isolation.

### 3.1 Platform Patterns

1.  **Strict Isolation:** Nearly all `SELECT` and `INSERT` policies check `auth.uid() = user_id`.
2.  **Shared Access:** Apps like Cashflow use `EXISTS` subqueries in RLS policies to allow invited users to view data without owning the `user_id`.
3.  **Administrative Override:** The `profiles.role = 'admin'` flag allows access to all tickets and messages for system maintenance.
4.  **Controlled Mutations:** In Support, users do not have direct `UPDATE` policy on `support_tickets`; controlled writes happen through RPC functions (`create_support_ticket`, `bump_support_ticket_urgency`).

### 3.2 Reference Migration History

| Order | Migration                                            | Purpose                                                             |
| :---- | :--------------------------------------------------- | :------------------------------------------------------------------ |
| 1     | `001_initial_schema.sql`                             | Basic profiles and auth triggers.                                   |
| 2     | `20260202_create_cashflow_tables.sql`                | Multi-tenant cashflow logic.                                        |
| 3     | `20260210190000_create_support_system.sql`           | `profiles.role`, support tables, and support RPC functions.         |
| 4     | `20260220_add_custom_theme_column.sql`               | `custom_theme` JSONB, `button_style`, and `button_shape`.           |
| 5     | `20260220104943_add_nested_folders.sql`              | `is_folder` and `parent_id` to `links` table.                       |
| 6     | `20260221061001_enforce_folder_depth_limit.sql`      | Postgres Trigger on `links` to prevent infinite folder recursion.   |
| 7     | `20260221133300_fix_privilege_escalation.sql`        | Trigger on `cashflow_shares` to prevent self-role escalation.       |
| 8     | `20260228_fix_analytics_rpc_nullable_start_date.sql` | `DEFAULT NULL` on analytics RPC params for correct optional typing. |
| 9     | `20260305173319_add_cashflow_categories.sql`         | `category` column on `cashflow_entries`.                            |
| 10    | `20260307061641_add_link_animations.sql`             | `animation_type` column on `links`.                                 |
| 11    | `20260307153700_update_yearly_calc.sql`              | `yearly_calculation` column on `cashflow_entries`.                  |
| 12    | `20260311_create_cashflow_budgets.sql`               | `cashflow_budgets` table with RLS (owner: all, editor: read).       |
| 13    | `20260703063150_create_list_tables.sql`             | `lists`, `list_columns`, `list_items`, `list_summaries` view, and RLS. |

---

## 4. Best Practices for Developers

- **Never Hardcode Secrets:** Always use Supabase `service_role` only in restricted background worker scripts.
- **RLS First:** Always enable RLS before inserting data into a new table.
- **Server Actions:** All database mutations must happen via Server Actions with manual `auth.getUser()` validation to supplement RLS.
- **Type Narrowing:** Use Zod schemas (`src/lib/validation.schemas.ts` for server, `src/lib/validation.schemas.client.ts` for client) to parse all DB/API values. Never use manual ternary chains or inline type guards.
- **Email in RLS:** Never query `auth.users` in RLS policies — it is inaccessible from the public schema context. Use `auth.jwt() ->> 'email'` (or `lower(auth.jwt() ->> 'email')` for case-insensitive matching) to read the user's email from their JWT token directly.
- **Trigger Guards:** Use `BEFORE UPDATE` triggers to restrict which columns non-owners can modify, preventing privilege escalation even with permissive RLS UPDATE policies.

---

_Last Updated: March 11, 2026_
