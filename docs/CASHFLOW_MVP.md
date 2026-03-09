# 🎯 Cashflow MVP: Minimum Viable Product Checklist

This document benchmarks Kytbox Cashflow against personal finance standards (YNAB, Simplifi, Splitwise) and tracks our journey to a premium "Financial Home" V1.

## 📊 Market Benchmarking

| Feature Pillar    | Standard (YNAB/Mint) | Simple (Splitwise) | **Kytbox (MVP)**                       |
| :---------------- | :------------------- | :----------------- | :------------------------------------- |
| **Logic**         | Zero-Based Budgeting | Debt Tracking Only | **Multi-Book Tracking**                |
| **Collaboration** | Household Sharing    | Group Expenses     | **Granular ACL** (Owner/Editor/Reader) |
| **Recurrence**    | Manual / Auto        | Basic Recurring    | **Prorated vs Exact** (Advanced)       |
| **Portability**   | Full Export          | Basic CSV          | Manual Only (Currently)                |
| **Visuals**       | Complexity First     | List First         | **Dashboard First**                    |

---

## ✅ MVP Checklist: Feature Coverage

### 1. Account & Multi-Tenant Structure

- [x] **Multi-Book Management**: Create separate books for "Personal", "Business", "House".
- [x] **Consolidated Dashboard**: High-level totals (Income vs Expense) across all pinned books.
- [x] **Personalized Currency**: Global currency formatting based on user profile settings.

### 2. Transaction Management

- [x] **Manual Entry Flow**: Optimized modal for quick Date/Description/Amount entry.
- [x] **Category Support**: Tagging entries (Food, Salary, Utilities) for visual breakdown.
- [x] **Real-time Recalculation**: Instant balance updates via `cashflow_summaries` views.

### 3. Collaboration & Trust

- [x] **Permission Levels**: Role-based access (Owner vs invited Editor).
- [x] **Case-Insensitive Shares**: Safety against email entry typos (`LOWER()` matching).
- [x] **Public Bookmarking**: Follow a public budget without full invite (Guest Bookmark).
- [x] **Escalation Protection**: DB triggers prevent non-owners from changing permissions.

### 4. Advanced Visualization

- [x] **Bar Charts**: Grouped monthly comparisons of Income vs Expenses.
- [x] **Trend Charts**: Area charts showing running balance over time.
- [x] **Category Donut**: Immediate visual insight into spending leaks.

### 5. Recurring & Projections (The Current Edge)

- [x] **Smart Frequency**: Support for Monthly and Yearly billing.
- [x] **Balance Projections**: Calculating "True Available" balance for the upcoming month.
- [x] **Calculated Smoothing**: Prorated vs Exact logic for yearly fees.

---

## 🔲 Missing for "Launch Ready" (V1)

To compete with premium 2026 trackers (Simplifi, Monarch), we need to bridge these gaps:

1. **Receipt/Attachment Support** 🔲
   - _Requirement_: Upload images/PDFs to entries (integrated with Supabase Storage).
   - _Impact_: High for Business/Freelance users needing tax records.

2. **Data Portability (Export)** 🔲
   - _Requirement_: CSV export of individual books or consolidated stats.
   - _Impact_: Critical. Users won't commit heavy financial data to a "black box".

3. **Hard Budget Alerts (Thresholds)** 🔲
   - _Requirement_: Set a $ limit on a category and receive a visual "Overspent" indicator.
   - _Impact_: High. Transition from "Tracking" to "Controlled Budgeting".

4. **Bulk Transaction Editing** 🔲
   - _Requirement_: Select multiple rows to delete or categorize at once.
   - _Impact_: Medium. Essential for power users during monthly "cleanup".

---

## 🚀 V1 Status: **85% Launch Ready**

Kytbox Cashflow is a powerhouse for **Collaborative Tracking**, but it is still a "read-only view" for historical data.

### 🧠 Strategic Recommendation

**Shift from "Mirror" to "Shield"**: Currently, Cashflow _mirrors_ what happened. To reach V1 status, it must _shield_ the user from overspending.

**Priority 1**: Implement **CSV Export**. It removes the "vendor lock-in" fear.
**Priority 2**: Implement **Hard Budget Progress Bars**. This completes the loop from "What did I do?" to "What should I stop doing?".
