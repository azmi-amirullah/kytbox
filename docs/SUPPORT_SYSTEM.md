# Internal Support System (Tickets)

The Kytbox Internal Support System is a custom-built ticketing platform that allows users to submit support requests and administrators to manage them directly within the platform.

## 1. Executive Summary

- **Primary Goal:** Provide a seamless, untracked, and integrated support experience for Kytbox users while avoiding third-party costs (Zendesk/Intercom).
- **Architecture:** Built with Next.js Server Actions, Supabase (Postgres), and Tailwind CSS.
- **Key Features:** Ticket creation, urgency "bumping," real-time thread viewing, and admin management.

## 2. Architecture Overview

```mermaid
graph TD
    User((User)) -->|Create Ticket| Actions[Server Actions]
    Admin((Admin)) -->|Reply/Status| Actions
    Actions -->|DDL/DML| DB[(Supabase Postgres)]
    DB -->|RLS| Auth[Auth Engine]
    Platform[Platform App] -->|Route: /support| UserPortal[User Portal]
    AdminPortal[Admin Dashboard] -->|Route: /support-admin| Platform
```

### 2.1 Component Logic

| Component           | Responsibility                                    | Path                                 |
| :------------------ | :------------------------------------------------ | :----------------------------------- |
| **Ticket Portal**   | Dashboard for users to see their ticket history.  | `(platform)/support/page.tsx`        |
| **Admin Dashboard** | High-level queue for administrators.              | `(admin)/support-admin/page.tsx`     |
| **User Thread**     | User conversation view for an individual ticket.  | `(platform)/support/[id]/page.tsx`   |
| **Admin Thread**    | Admin conversation view for an individual ticket. | `(admin)/support-admin/[id]/page.tsx` |

## 3. Data Model

The system relies on two primary tables in the `public` schema.

### 3.1 `support_tickets`

| Column           | Type          | Description                                                          |
| :--------------- | :------------ | :------------------------------------------------------------------- |
| `id`             | `uuid`        | Primary Key.                                                         |
| `user_id`        | `uuid`        | Foreign key to `profiles.id` (`ON DELETE CASCADE`).                  |
| `subject`        | `text`        | Brief summary of the issue.                                          |
| `category`       | `text`        | Check: `general`, `bug`, `billing`, `feature_request`, `account`.    |
| `status`         | `text`        | Default: `open`. Check: `open`, `in_progress`, `resolved`, `closed`. |
| `urgency_score`  | `int`         | Bump points (`+10` per successful user bump).                        |
| `last_bumped_at` | `timestamptz` | Last time the user manually requested a priority increase.           |

### 3.2 `support_messages`

| Column      | Type          | Description                                    |
| :---------- | :------------ | :--------------------------------------------- |
| `id`        | `uuid`        | Primary Key.                                   |
| `ticket_id` | `uuid`        | Foreign key to `support_tickets.id` (`ON DELETE CASCADE`). |
| `sender_id` | `uuid`        | Foreign key to `profiles.id` (`ON DELETE CASCADE`).        |
| `message`   | `text`        | The content of the reply.                      |
| `read_at`   | `timestamptz` | Track when the other party viewed the message. |

## 4. Security & RLS Policies

Security is enforced at the database layer using Row Level Security (RLS).

### 4.1 User Access

- **SELECT**: Users can only see tickets where `user_id = auth.uid()`.
- **INSERT**: Users can only create tickets with their own `user_id`.
- **No Direct UPDATE**: Users do not have direct `UPDATE` access on `support_tickets`.
- **Controlled Bump**: Users bump urgency via RPC `bump_support_ticket_urgency`, which enforces ownership, ticket status, and 24-hour cooldown at DB level.

### 4.2 Admin Access

- **SELECT/UPDATE**: Admins can see and modify all tickets. Access is granted based on the `role = 'admin'` check in the `profiles` table.

## 5. Key Workflows

### 5.1 Urgency Bumping Logic

Users can "bump" their ticket importance once every 24 hours.

- **Action:** `bumpUrgency(ticketId)` (Server Action) calls RPC `bump_support_ticket_urgency`.
- **Restriction:** Enforced in PostgreSQL function (`auth.uid()` ownership, ticket must not be `resolved`/`closed`, and 24-hour cooldown).
- **Impact:** Increases `urgency_score` by `+10` bump points.
- **Queue Formula:** `total_urgency = age_days + urgency_score`, where `age_days = floor((now - created_at) / 1 day)`.
- **Admin UI bands:** `high > 20` (red), `medium > 3` (orange), otherwise low (slate).

### 5.2 Thread Communication

1.  **Submission:** `createTicket` calls RPC `create_support_ticket` to create the ticket and initial message atomically.
2.  **Reply:** `replyToTicket` adds a message. Admins replying automatically revalidates both the user and admin views.
3.  **Read Tracking:** Opening `/support/[id]` or `/support-admin/[id]` calls RPC `mark_support_messages_read` to set counterpart message `read_at`.
4.  **Unread/Reply Signals:** User list shows `New Reply`; admin queue shows `Unread User Reply` and `Seen, no reply yet` when user read but has not replied.
5.  **Resolution:** Admins can mark a ticket as `resolved`, which hides it from the default active queue.

## 6. Implementation Reference

- **Server Actions:** `src/app/(platform)/support/actions.ts`
- **Migration:** `supabase/migrations/20260210190000_create_support_system.sql`
- **DB Functions:** `create_support_ticket`, `bump_support_ticket_urgency`, `get_support_ticket_queue`, `mark_support_messages_read`
- **User Route:** `/support`
- **Admin Route:** `/support-admin`

---

_Last Updated: February 11, 2026_
