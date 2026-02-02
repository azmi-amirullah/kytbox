# UKIT Cashflow Documentation

Focus: **Simple, effective personal finance tracking.**

## 1. Core Features

- **Dashboard**: High-level overview of total income, expense, and balance.
- **Cashflow Management**: Create, renaming, and deleting multiple cashflow "books" (e.g., Personal, Business).
- **Entries**: Add income/expense entries with date, description, and amount.
- **Currency Support**: Per-account default currency with per-entry overrides (future).
- **Stats**: Real-time calculation of totals.

## 2. Tech Stack

- **Framework**: **Next.js 16** (App Router) + **React 19**
- **Database**: **Supabase** (Postgres + RLS)
- **Styling**: **Tailwind CSS v4** + **Shadcn/UI**
- **State**: Server Actions + `useTransition` for optimistic updates

## 3. Database Schema (Supabase)

### `cashflow_summaries` (View)

Aggregates stats for easy dashboard display.

| Column        | Type    | Notes                        |
| :------------ | :------ | :--------------------------- |
| `id`          | uuid    | Cashflow ID                  |
| `user_id`     | uuid    | Owner                        |
| `title`       | text    | Name of the cashflow         |
| `income`      | numeric | Sum of all 'income' entries  |
| `expense`     | numeric | Sum of all 'expense' entries |
| `balance`     | numeric | income - expense             |
| `entry_count` | bigint  | Total number of transactions |

### `cashflows`

Parent table for grouping transactions.

| Column       | Type        | Notes                 |
| :----------- | :---------- | :-------------------- |
| `id`         | uuid        | PK                    |
| `user_id`    | uuid        | FK -> `profiles.id`   |
| `title`      | text        | e.g. "Wallet", "Bank" |
| `created_at` | timestamptz |                       |

### `cashflow_entries`

Individual transaction records.

| Column        | Type        | Notes                 |
| :------------ | :---------- | :-------------------- |
| `id`          | uuid        | PK                    |
| `cashflow_id` | uuid        | FK -> `cashflows.id`  |
| `amount`      | numeric     | Positive number       |
| `type`        | text        | 'income' or 'expense' |
| `description` | text        | Optional              |
| `date`        | date        | Transaction date      |
| `created_at`  | timestamptz |                       |

### Security (RLS)

- **Cashflows**: INSERT/UPDATE/DELETE for Owner only.
- **Entries**: INSERT/UPDATE/DELETE for Owner only.
- **View**: Owner only.

## 4. Architecture & Routing

### Route Structure

| Route            | Purpose                        |
| :--------------- | :----------------------------- |
| `/cashflow`      | Dashboard (List of Cashflows)  |
| `/cashflow/[id]` | Detail View (Transaction List) |

### Server Actions (`src/app/(platform)/cashflow/actions.ts`)

| Action           | Description                     |
| :--------------- | :------------------------------ |
| `createCashflow` | Create new cashflow book        |
| `updateCashflow` | Rename cashflow                 |
| `deleteCashflow` | Delete cashflow and all entries |
| `addEntry`       | Add new income/expense          |
| `updateEntry`    | Edit transaction details        |
| `deleteEntry`    | Remove transaction              |

## 5. Currency Handling

- **Default**: USD (set in `profiles` table)
- **Formatting**: Uses `Intl.NumberFormat` for locale-aware formatting.
- **Storage**: Stored as raw numeric in DB.

## 6. Current Status

✅ Dashboard with Total Stats  
✅ Create/Rename/Delete Cashflows  
✅ Transaction List with Income/Expense indicators  
✅ Date grouping (implied via sort)  
✅ Loading States (Streaming SSR)  
✅ Mobile-responsive Table Layout
