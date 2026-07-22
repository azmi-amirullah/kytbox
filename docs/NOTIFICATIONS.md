# 🔔 Unified Notification Center

**Last Updated**: July 2026  
**Status**: Active

The Notification Center is a platform-wide event notification system that aggregates alerts across all Kytbox apps (Support, Cashflow, Bio, System) into a unified header bell dropdown.

---

## 📊 Notification Triggers & Events Matrix

Below is the complete list of notifications supported by Kytbox:

| Type | Event Trigger | Title | Body Example | Navigation Target (`link_url`) | Icon & Accent Color |
|---|---|---|---|---|---|
| `support_reply` | Active/open support ticket requiring attention | Support Ticket Pending | `Re: {ticket_subject}` | `/support/{ticket_id}` | 💬 `LuMessageSquare` (Blue) |
| `support_reply` | Admin replies to user's support ticket | Support replied | `Re: {ticket_subject}` | `/support/{ticket_id}` | 💬 `LuMessageSquare` (Blue) |
| `support_reply` | Admin updates ticket status | Ticket Status Updated | `Status for ticket "{subject}" is now resolved` | `/support/{ticket_id}` | 💬 `LuMessageSquare` (Blue) |
| `budget_warning` | Monthly category spending reaches 80%–99% of budget limit | Budget Warning ⚠️ | `Food reached 85% of $500 budget` | `/cashflow/{cashflow_id}` | ⚠️ `LuTriangleAlert` (Amber) |
| `budget_exceeded` | Monthly category spending exceeds 100% of budget limit | Budget Exceeded 🔴 | `Food is over budget by $45.00` | `/cashflow/{cashflow_id}` | 🔴 `LuCircleAlert` (Red) |
| `click_milestone` | Bio profile/link reaches click milestone (100, 500, 1k, 10k clicks) | Milestone! 🎉 | `Your bio page hit 1,000 total clicks` | `/bio/analytics` | ✨ `LuSparkles` (Emerald) |
| `system` | Platform announcements, security alerts, system maintenance | System Announcement | `{announcement_body}` | Custom URL or `null` | ℹ️ `LuInfo` (Sky Blue) |

---

## 🏗️ Architecture & Database Schema

### Table: `public.notifications`

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique notification ID |
| `user_id` | `uuid` | `REFERENCES profiles(id) ON DELETE CASCADE` | Recipient user ID |
| `type` | `text` | `CHECK IN ('support_reply', 'budget_warning', 'budget_exceeded', 'click_milestone', 'system')` | Type of notification |
| `title` | `text` | `NOT NULL` | Header title string |
| `body` | `text` | Nullable | Detail message text |
| `link_url` | `text` | Nullable | Client route to navigate on click |
| `read_at` | `timestamptz` | Default `NULL` | Timestamp when user read/clicked notification |
| `created_at` | `timestamptz` | Default `now()` | Timestamp when notification was created |

### Security & RLS
- **Row Level Security (RLS)** is enabled.
- Users can read, update (`read_at`), and delete **only their own** notifications (`auth.uid() = user_id`).
- System/Server actions create notifications on behalf of events.

---

## 🎨 UI & Behavior

1. **Header Bell Trigger**:
   - Displays unread count badge in red (`destructive`) with pulsing aura animation (`animate-ping`).
   - Group hover rotates bell (`group-hover:rotate-12`).

2. **Popover Panel**:
   - Sections: Grouped into **Today** and **Earlier**.
   - "Mark all read" button clears all unread indicators.
   - Clicking any item marks it as read and navigates to `link_url`.
   - Polling interval: Auto-refreshes every 60 seconds.
