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

### 2.1 Bio App (`links`, `link_events`)

- **`links`**: Individual links and folders on a user's bio page. Uses `is_folder` (boolean) and `parent_id` (uuid, self-referencing) to support nested directory structures.
- **`link_events`**: Analytics for link clicks (UA, Country, Referer).

### 2.2 Cashflow App (`cashflows`, `cashflow_entries`, `cashflow_shares`)

- **`cashflows`**: Virtual wallets/accounts.
- **`cashflow_entries`**: Immutable transaction log.
- **`cashflow_shares`**: ACL for sharing cashflows with other users by email.

### 2.3 Support System (`support_tickets`, `support_messages`)

- **`support_tickets`**: High-level support requests.
- **`support_messages`**: Conversations within a ticket.

---

## 3. Row Level Security (RLS) Strategy

Kytbox strictly enforces RLS at the database layer to ensure data isolation.

### 3.1 Platform Patterns

1.  **Strict Isolation:** Nearly all `SELECT` and `INSERT` policies check `auth.uid() = user_id`.
2.  **Shared Access:** Apps like Cashflow use `EXISTS` subqueries in RLS policies to allow invited users to view data without owning the `user_id`.
3.  **Administrative Override:** The `profiles.role = 'admin'` flag allows access to all tickets and messages for system maintenance.
4.  **Controlled Mutations:** In Support, users do not have direct `UPDATE` policy on `support_tickets`; controlled writes happen through RPC functions (`create_support_ticket`, `bump_support_ticket_urgency`).

### 3.2 Reference Migration History

| Order | Migration                                       | Purpose                                                           |
| :---- | :---------------------------------------------- | :---------------------------------------------------------------- |
| 1     | `001_initial_schema.sql`                        | Basic profiles and auth triggers.                                 |
| 2     | `20260202_create_cashflow_tables.sql`           | Multi-tenant cashflow logic.                                      |
| 3     | `20260210190000_create_support_system.sql`      | `profiles.role`, support tables, and support RPC functions.       |
| 4     | `20260220_add_custom_theme_column.sql`          | `custom_theme` JSONB, `button_style`, and `button_shape`.         |
| 5     | `20260220104943_add_nested_folders.sql`         | `is_folder` and `parent_id` to `links` table.                     |
| 6     | `20260221061001_enforce_folder_depth_limit.sql` | Postgres Trigger on `links` to prevent infinite folder recursion. |
| 7     | `20260221133300_fix_privilege_escalation.sql`   | Trigger on `cashflow_shares` to prevent self-role escalation.     |

---

## 4. Best Practices for Developers

- **Never Hardcode Secrets:** Always use Supabase `service_role` only in restricted background worker scripts.
- **RLS First:** Always enable RLS before inserting data into a new table.
- **Server Actions:** All database mutations must happen via Server Actions with manual `auth.getUser()` validation to supplement RLS.
- **Trigger Guards:** Use `BEFORE UPDATE` triggers to restrict which columns non-owners can modify, preventing privilege escalation even with permissive RLS UPDATE policies.

---

_Last Updated: February 21, 2026_
