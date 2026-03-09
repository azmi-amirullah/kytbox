# 💸 Cashflow Feature: Intelligent Personal Finance

The Cashflow feature is a collaborative, visual-first financial tracker built to manage multiple "Books" of income and expenses with professional-grade precision.

## 1. Multi-Book Management [✅ Implemented]

- **Isolate Finances**: Separate personal, business, and affiliate earnings into dedicated "Books".
- **Real-Time Aggregation**: The dashboard provides a unified view of total income, expense, and balance across all pinned books.

## 2. Advanced Collaboration & Sharing [✅ Implemented]

- **Permission Matrix**: granular access control (Owner, Editor, Viewer).
- **Bookmarkable Public Links**: One-click "Add to Dashboard" allows users to follow public cashflows without being explicitly invited.
- **Secure Email Invites**: Case-insensitive email matching and RLS protection ensure that only authorized users can see or edit data.

## 3. Visual Financial Insights [✅ Implemented]

- **Income vs. Expense Bar Charts**: Monthly grouped bars for year-to-date performance.
- **Balance Trend Area Charts**: Predictive and historical balance visualization.
- **Category Donut Charts**: Spending breakdown by category (Food, Utilities, Salary, etc.) to identify budget leaks.
- **Responsive Layouts**: Charts use `@container` queries to shift gracefully from dashboard sidebars to full-screen detail views.

## 4. Recurring Transactions & Projections [✅ Implemented]

- **Smart Recurrence**: Support for Monthly and Yearly transactions.
- **Granular Calculation Logic (Per-Item)**:
  - **Prorated**: Automatically set aside `1/12th` per month to smooth out large annual fees.
  - **Exact**: Only impacts the projection if the specific anniversary date falls within the window.
- **Dynamic Future Projections**: Calculates a "Real Available Balance" through the **end of the next month** (approx. 2-month window).
  - **Technical Projection Model (Mentor-Stabilized)**:
    - **Baseline (Settled Cash)**: Ground-truth cash based strictly on transactions dated _today or earlier_.
    - **Projection Flow**: Follows a verifiable horizontal equation: `Settled Cash` + `Upcoming Inflows` - `Upcoming Outflows` = `Estimated Result`.
    - **Math Verification**: Visual operator badges (`-`, `+`, `=`) are used to ensure the logic is transparent and manual-verifiable.
  - **Standardized Time-Cutoff**:
    - All dates are parsed as **Local Midnight** (ignoring UTC/Timezone offsets) to prevent "vanishing transactions" on the current date.
    - An entry dated "Today" is considered **Settled** (already inside the baseline) and is automatically excluded from the future "Upcoming" projections to prevent double-counting.
  - **Visual Health Indicators**:
    - 🔴 **Deficit Risk**: Triggered if the result drops below zero.

## 5. Performance & Security [✅ Implemented]

- **SQL View Summaries**: O(N) aggregation is offloaded to the database (`cashflow_summaries`) for instant loading regardless of entry count.
- **DTO Safety Layer**: Zero raw database rows are leaked to the client; all data is mapped through strictly typed Data Transfer Objects.
- **Currency Normalization**: Centralized currency formatting and symbol handling based on user settings.
