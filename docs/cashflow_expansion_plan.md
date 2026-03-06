# Cashflow Expansion: Recurring Transactions & Hard Budgets

This document outlines the database schema updates and UI component additions required to implement the Recurring Transactions and Hard Budgets features.

## Proposed Changes

### Database Schema (Supabase)

We need to create a new migration file to apply these changes cleanly.

#### [NEW] [cashflow_features.sql](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/supabase/migrations/xxxx_cashflow_features.sql)

- **Alter Table `cashflow_entries`**:
  - Add `is_recurring` (BOOLEAN, default `false`)
  - Add `recurring_frequency` (TEXT, nullable, check in `('daily', 'weekly', 'monthly', 'yearly')`)
- **Create Table `cashflow_budgets`**:
  - `id` (UUID, primary key)
  - `cashflow_id` (UUID, references `cashflow_summaries` or `cashflows`, cascade on delete)
  - `category` (TEXT, e.g., 'food', 'transport')
  - `amount` (NUMERIC, the budget limit)
  - `period` (TEXT, default `monthly`)
  - `created_at` (TIMESTAMPTZ)
- **RLS Policies**: Enable Row Level Security on `cashflow_budgets` matching the exact same ownership and shared-access rules as `cashflow_entries`.

---

### Core Domain / Types Layer

#### [MODIFY] [database.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/types/database.ts)

- Add `CashflowBudget` row type.
- Update `CashflowEntry` domain mapped type if needed (though Supabase CLI generation handles the strict types).

#### [MODIFY] [dto.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/types/dto.ts)

- Update `CashflowEntryDTO` to include `is_recurring` and `recurring_frequency`.
- Add `CashflowBudgetDTO`.

#### [MODIFY] [validation.schemas.client.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/lib/validation.schemas.client.ts)

- Update `cashflowEntrySchema` with the new optional recurring fields.
- Create `cashflowBudgetSchema`.

---

### UI Components & Logic - Recurring Transactions

#### [MODIFY] [EntryModal.tsx](<file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/cashflow/components/EntryModal.tsx>)

- Add a "Recurring Transaction" toggle switch below the Date field.
- If toggled on, show a Select dropdown for Frequency (Daily, Weekly, Monthly, Yearly).

#### [NEW] [RecurringProjections.tsx](<file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/cashflow/components/RecurringProjections.tsx>)

- A new chart or table component that lists all recurring entries.
- Calculates the "Next Month Projection" (Total recurring income - Total recurring expenses) to give the user their baseline cashflow.

---

### UI Components & Logic - Hard Budgets

#### [NEW] [BudgetManager.tsx](<file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/cashflow/components/BudgetManager.tsx>)

- The main container for viewing and managing budgets. Will be added as a new Tab (alongside "Entries" and "Analytics") in the Cashflow view.

#### [NEW] [BudgetModal.tsx](<file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/cashflow/components/BudgetModal.tsx>)

- Modal to create or edit a budget limit for a specific category.

#### [NEW] [BudgetProgress.tsx](<file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/cashflow/components/BudgetProgress.tsx>)

- Visual component for a single category budget.
- Calculates current month's spend for the category vs. the budget amount.
- Uses Shadcn `Progress` UI.
- Color coding logic:
  - `< 80%` spend: Green/Default
  - `80% - 95%` spend: Yellow/Warning
  - `> 95%` spend: Red/Destructive

#### [MODIFY] [cashflow/page.tsx](<file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/cashflow/page.tsx>) & [actions.ts]

- Fetch budget data for the user's cashflows.
- Add Server Actions to create/update/delete budgets.

## Verification Plan

### Automated Tests

1. **Type Safety Validation**: Run `npm run typecheck` and `npm run build` to ensure all Zod schemas, DTOs, and Supabase types are fully aligned and that no unused variables or Any types violate the strict TS config.
2. **Linter**: Run `npm run lint`

### Manual Verification

1. **Database**: Ask the user to run the generated SQL migration in their Supabase dashboard.
2. **Recurring Transactions**:
   - Open EntryModal, check "Recurring", set to "Monthly". Save.
   - Verify it appears in the Projections tab and affects the future baseline.
3. **Hard Budgets**:
   - Create a budget for "Food & Dining" at $500.
   - Add a non-recurring expense for Food for $450. Verify the progress bar is at 90% and colored Yellow/Red.
   - Add another expense for $100. Verify the dashboard clearly alerts the user of the budget breach.
