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

## 4. Recurring Transactions & Projections [✅ Implemented] (Pro-Level)

- **Smart Recurrence**: Support for Monthly and Yearly transactions.
- **Calculation Logic**:
  - **Prorated**: Distributes yearly costs across 12 months for "smoothing" budgets.
  - **Exact**: Shows the full cost in the specific month the transaction occurs.
- **Future Balance Projections**: Calculates the real "available" balance for the upcoming month by deducting pending recurring obligations before they hit.

## 5. Performance & Security [✅ Implemented]

- **SQL View Summaries**: O(N) aggregation is offloaded to the database (`cashflow_summaries`) for instant loading regardless of entry count.
- **DTO Safety Layer**: Zero raw database rows are leaked to the client; all data is mapped through strictly typed Data Transfer Objects.
- **Currency Normalization**: Centralized currency formatting and symbol handling based on user settings.
