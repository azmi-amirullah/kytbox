# Future Feature Roadmap Recommendations

This document compiles all the high-impact feature recommendations discussed for expanding the capabilities of the Bio and Cashflow products.

## 🚀 Bio Launchpad Features

### Affiliate-Focused Priorities

1. **Link Click Analytics (✅ Already Implemented)**
   - Tracking daily click trends, Top Links, and Click-Through Rate (CTR) to understand which products convert best.
2. **Search Bar (✅ Already Implemented)**
   - **Problem:** Users drop off if they have to scroll through dozens of Shopee/Tokopedia links or deep nested folders.
   - **Solution:** Added a sticky search bar directly on the bio page to get followers to the exact product link instantly with dynamic folder context. (Categories idea dropped as search effectively handles discovery).
3. **Animated / Highlighted Links (✅ Already Implemented)**
   - **Problem:** High-paying or newly launched referral links get lost in the list.
   - **Solution:** Added visual highlights via CSS micro-animations (pulse, bounce, glow) to individual links and folders to draw attention and drive targeted traffic. Users can select the animation via the admin dashboard.

4. **Link List Pagination** 🔲
   - **Problem:** Both the dashboard and the public bio page fetch all links with no limit. A user with 50+ root-level items (ignoring folders) will experience slow loads and an overwhelming UI.
   - **Solution:** Implement `limit`/`range`-based pagination or a "Load More" approach on the dashboard. The public page can use the same pattern or rely on a hard cap since the folder architecture discourages flat list sprawl.

## 💸 Cashflow Engine Features

### Affiliate-Focused Priorities

~~1. **Income Source vs. Expense True ROI**~~
~~- **Problem:** Affiliate income fluctuates wildly based on the platform.~~
~~- **Solution:** Tag earnings by specific source (TikTok, Shopee, IG) and compare it directly against the specific costs incurred for that platform (samples, ads, software tools) to calculate true return on investment per channel.~~
_(Scratched for now)_

### Personal Finance / Business Management Priorities

1. **Recurring Transactions & Projections (✅ Already Implemented)**
   - **Problem:** Subscriptions and recurring bills drain cashflow silently. Tracking past expenses doesn't help manage future obligations.
   - **Solution:** Integrated a dedicated **Projections Engine** that calculates the _real_ available balance through the end of the next month. Supports per-item calculation modes (Prorated vs Exact) for yearly transactions, allowing users to choose between budget smoothing or strict anniversary tracking.
2. **Hard Budgets & Alerts**
   - **Problem:** Reviewing a chart showing $800 spent on food last month doesn't prevent spending $800 _this_ month.
   - **Solution:** Set hard currency limits per category. Provide a visual progress bar (Green -> Yellow -> Red) that warns the user when they cross 80% and 90% of their allocated budget.

## 🚀 Global Infrastructure (Future)

1. **Data Portability (CSV Export)**
   - Allow users to export full transaction histories for tax reporting or external analysis.
2. **Receipt Storage**
   - Direct integration with Supabase Storage to attach photos of receipts to specific entries.
