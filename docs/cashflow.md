# UKIT Cashflow Documentation

Focus: **Simple, effective personal finance tracking.**

## 1. Core Features

- **Dashboard**: High-level overview of total income, expense, and balance across owned and bookmarked books.
- **Cashflow Management**: Create, rename, delete, and duplicate cashflow "books".
- **Real-time Stats**: Instant calculation of totals with user-specific inclusion toggles.
- **Advanced Sharing**:
  - **Zero-Config Public Links**: Instantly share a read-only view of any cashflow.
  - **Secure Email Invitations**: Precise access control for external collaborators.
  - **Collaborative Editing**: Full write-access for invited editors on transaction entries.
- **Dashboard Integration**: "Add to Dashboard" workflow for persistent tracking of shared and public cashflows.

## 2. Technical Architecture

### 2.1 System Overview

The Cashflow app follows a clean separation of concerns between **Ownership**, **Permissions**, and **Persistence**.

- **Ownership**: The user who created the cashflow has absolute control.
- **Permissions**: Defined in `cashflow_shares`, determining what collaborators can do.
- **Persistence**: Preferences like "Include in Totals" are stored per-user, ensuring a customized dashboard experience that survives sessions.

### 2.2 Routing & Access Control

The application uses a hybrid routing model where `/cashflow/[id]` serves as both a private management view and a public shared surface.

- **Private Dashboard (`/cashflow`)**: Queries the user's personal books and any books they have actively "bookmarked" or been invited to.
- **Detail View (`/cashflow/[id]`)**: Resolution logic determines the user's role (Owner, Editor, Viewer, or Unauthorized) based on Supabase Auth and the `cashflow_shares` registry.

## 3. Database Schema (Supabase)

### 3.1 Core Tables

#### `cashflows`

The root entity for a financial book.

- `id` (uuid): Primary key.
- `user_id` (uuid): References the owner profile.
- `title` (text): User-defined name.
- `is_public` (boolean): Global visibility toggle.

#### `cashflow_entries`

Individual transaction records.

- `cashflow_id` (uuid): FK to parent book.
- `amount` (numeric): Transaction magnitude.
- `type` (text): `income` or `expense`.
- `description` (text): Context for the transaction.
- `date` (date): The logical date of the event.

#### `cashflow_shares`

The bridge table for collaboration and bookmarking.

- `email` (text): Target user identification.
- `role` (text): `read` (viewer) or `edit` (can manage entries).
- `is_included_in_totals` (boolean): Per-user dashboard calculation preference.
- `created_via_public_access` (boolean): DISTINCTION flag. Set to `true` when a user bookmarks a public link vs being explicitly invited.

### 3.2 Performance Layer: `cashflow_summaries`

A SQL View used to offload O(N) aggregation from the application server. It calculates `income`, `expense`, `balance`, and `entry_count` at the database level.

## 4. Security Model (RLS)

Permissions are enforced strictly at the database level via PostgreSQL Row Level Security (RLS).

| Action                   | Target             | Condition                                                                    |
| :----------------------- | :----------------- | :--------------------------------------------------------------------------- |
| **Manage Book**          | `cashflows`        | `auth.uid() == user_id`                                                      |
| **View Book**            | `cashflows`        | Owner OR `is_public` OR Case-insensitive Email match in `cashflow_shares`    |
| **Manage Entries**       | `cashflow_entries` | Owner OR (`cashflow_shares.role == 'edit'` AND Case-insensitive Email match) |
| **View Entries**         | `cashflow_entries` | Any user with View access to the parent Book                                 |
| **Manage Shares**        | `cashflow_shares`  | Owner of the Book only                                                       |
| **Bookmark/Unsubscribe** | `cashflow_shares`  | Authenticated users (Self-management of own records)                         |

> [!NOTE]
> All email-based security checks use `LOWER()` to ensure case-insensitive matching between auth sessions and share records.

## 5. Design Decisions & Rationale

### 5.1 Explicit Bookmarking vs Auto-Include

**Rationale**: Users often visit public cashflows out of curiosity. Auto-adding every visited link to the dashboard causes clutter.
**Decision**: We implemented an explicit "Add to Dashboard" flow. This creates a `cashflow_shares` record with the `created_via_public_access` flag, signaling intent to track.

### 5.2 Server-Side Filtering in `page.tsx`

**Rationale**: RLS allows users to _read_ any public cashflow, which means a simple `select *` would leak every public book on the platform into every user's personal dashboard.
**Decision**: The dashboard query explicitly filters for `user_id == CURRENT_USER` OR `id IN (USER_SHARES)`. This keeps individual dashboards private and relevant.

### 5.3 Promotion & Proactive Access

**Rationale**: Users who previously bookmarked a public link ("Guest") may later be invited as collaborators.
**Decision**:

- **Promotion**: When an owner invites a user by email, any existing guest bookmark is "promoted" to an invited record (`created_via_public_access = false`).
- **Auto-Pin**: Invitations automatically set `is_pinned = true` and `is_included_in_totals = true`, making the cashflow immediately visible on the recipient's dashboard.
- **Smart Filtering**: The "People with access" list hides guest bookmarkers who are only "Viewers" to prevent clutter, but **always** shows invited users and anyone with "Editor" access.

### 5.4 Security Invoker Views

**Rationale**: The `cashflow_summaries` view must respect the visitor's permissions.
**Decision**: The view is defined with `security_invoker = true`, ensuring that calculations ONLY include data the current user is authorized to see.

## 6. API Surface (Server Actions)

### Share Management (`share-actions.ts`)

- `togglePublic(id, status)`: Updates global visibility.
- `inviteUser(id, email, role)`: Formal collaboration invitation.
- `subscribeToPublicCashflow(id)`: Implementation of the "Add to Dashboard" logic.
- `toggleCashflowInclusion(id, toggle)`: Saves user preference for dashboard stats.

## 7. Current Implementation Status

✅ **Architecture**: Scalable sharing model with RLS audit.  
✅ **Features**: Dashboard, CRUD, Sharing, Bookmarking, Persistence.  
✅ **Mobile**: Fluid table layouts and action accessibility.  
✅ **Security**: Robust permission hierarchy (Owner > Editor > Viewer).

---

_For loading state details, see [LOADING_STATES.md](./LOADING_STATES.md)_
