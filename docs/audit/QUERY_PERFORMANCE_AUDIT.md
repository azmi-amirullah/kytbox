# 🏗️ Query & API Performance Audit

This document details the findings of a performance audit conducted on the database queries, APIs, and network patterns within the codebase. 

---

## 📋 Executive Summary

The audit identified six primary bottlenecks ranging from network round-trip overhead to inefficient database aggregation and lack of query boundaries. Resolving these issues will significantly reduce API latencies, lower Supabase resource consumption (CPU/IOPS), and make the application scale to handle large datasets.

### Summary of Findings
| Finding | Severity | Impact | Remediation |
| :--- | :--- | :--- | :--- |
| [1. Reordering REST Round-Trip Loop](#1-reordering-rest-round-trip-loop) | **High** | High UI latency, potential rate-limiting, connection pool exhaustion | Replace parallel REST updates with atomic Database RPCs |
| [2. Client-Side Analytics Aggregation](#2-client-side-analytics-aggregation) | **High** | Out-of-memory errors, heavy database egress, slow analytics load | Move click counting to Postgres using a group-by RPC function |
| [3. Dashboard Query Waterfall](#3-dashboard-query-waterfall) | **Medium** | Sequential network calls delaying dashboard rendering | Restructure queries using Postgres joins (`!inner`) to run in parallel |
| [4. View-Based Aggregation for Count](#4-view-based-aggregation-for-count) | **Medium** | Unnecessary group-by/aggregation overhead on database | Query raw tables directly instead of complex views |
| [5. Unbounded Transaction Loading](#5-unbounded-transaction-loading) | **Medium** | Slow page load and high UI lag for aged user accounts | Enforce query limits and implement pagination |
| [6. Missing Cache on Public Bio Links](#6-missing-cache-on-public-bio-links) | **Low** | Sub-optimal public page response times | Implement Next.js 16 `'use cache'` with tag-based revalidation |

---

## 🕵️ Detailed Findings & Remediation

### 1. Reordering REST Round-Trip Loop
* **Location**: [actions.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/features/list/actions.ts#L302-L309) (`reorderItems`) and [actions.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/features/list/actions.ts#L613-L620) (`reorderColumns`)

#### Problem Analysis
When a user reorders items in a list or columns on a board, the application maps the array of IDs and fires parallel HTTP `PATCH` requests to Supabase:
```typescript
const promises = itemIds.map((id, index) => 
  supabase.from('list_items').update({ sort_order: index * 1024 }).eq('id', id)
);
await Promise.all(promises);
```
For a list of 20 items, this fires 20 concurrent HTTP requests over the network. Under normal mobile network latency, this takes several seconds, blocks connection pools, and risks triggering Upstash/Supabase rate limits.

#### Recommended Solution
Create atomic PL/pgSQL database functions and execute a single RPC call.

```sql
-- Migration: 20260712000100_reorder_items_rpc.sql
CREATE OR REPLACE FUNCTION reorder_list_items(p_item_ids uuid[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security check: Verify all items belong to lists owned by the authenticated user
  IF EXISTS (
    SELECT 1 
    FROM unnest(p_item_ids) AS t(id)
    LEFT JOIN list_items li ON li.id = t.id
    LEFT JOIN lists l ON l.id = li.list_id
    WHERE l.user_id IS DISTINCT FROM auth.uid() OR l.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized: One or more item IDs do not belong to you';
  END IF;

  -- Bulk update using ordinality index
  UPDATE list_items AS li
  SET sort_order = t.new_order * 1024
  FROM (
    SELECT id, row_number() OVER () - 1 AS new_order
    FROM unnest(p_item_ids) AS id
  ) AS t
  WHERE li.id = t.id;
END;
$$;
```

Modify the TypeScript actions to call the RPC:
```typescript
export async function reorderItems(listId: string, itemIds: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('reorder_list_items', { p_item_ids: itemIds });
  if (error) return { error: 'Failed to reorder items' };
  
  revalidatePath('/list');
  return { success: true };
}
```

---

### 2. Client-Side Analytics Aggregation
* **Location**: [actions.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/features/bio/actions.ts#L929-L967) (`getTopLinksData`)

#### Problem Analysis
To display the "Top Links" by clicks on the analytics dashboard, the application queries *all* link events in the selected date range:
```typescript
let query = supabase
  .from('link_events')
  .select('link_id')
  .in('link_id', linkIds);
```
It pulls all row objects into Node.js memory, aggregates them using `forEach`, sorts the results, and takes the top 5. If a profile has received 50,000 clicks in a week, this query downloads 50,000 JSON records over the network. This causes massive memory spikes on the Next.js server and severely degrades response times.

#### Recommended Solution
Move the aggregation to Postgres via a dedicated RPC function:

```sql
-- Migration: 20260712000200_top_links_rpc.sql
CREATE OR REPLACE FUNCTION get_top_links(
  p_link_ids uuid[],
  p_start_date timestamptz,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  link_id uuid,
  click_count bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Security check
  IF EXISTS (
    SELECT 1 FROM links 
    WHERE id = ANY(p_link_ids) AND user_id != auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    le.link_id,
    COUNT(*)::bigint as click_count
  FROM link_events le
  WHERE le.link_id = ANY(p_link_ids)
    AND (p_start_date IS NULL OR le.created_at >= p_start_date)
  GROUP BY le.link_id
  ORDER BY click_count DESC
  LIMIT p_limit;
END;
$$;
```

Update `getTopLinksData` to fetch aggregated rows:
```typescript
async function getTopLinksData(
  supabase: SupabaseClient,
  links: { id: string; title: string; url: string }[],
  linkIds: string[],
  startDate: Date | null,
): Promise<TopLink[]> {
  const { data, error } = await supabase.rpc('get_top_links', {
    p_link_ids: linkIds,
    p_start_date: startDate?.toISOString(),
    p_limit: 5,
  });

  if (error || !data) return [];
  
  const clicksMap = new Map(data.map(d => [d.link_id, Number(d.click_count)]));
  
  return links
    .map(l => ({
      id: l.id,
      title: l.title,
      url: l.url,
      clicks: clicksMap.get(l.id) || 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
}
```

---

### 3. Dashboard Query Waterfall
* **Location**: [page.tsx](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/%28platform%29/app/page.tsx#L35-L69)

#### Problem Analysis
The platform dashboard home page has a query waterfall:
1. `Promise.all` fetches all link IDs and list IDs for the user.
2. The page maps the IDs to arrays `userLinkIds` and `userListIds`.
3. A second `Promise.all` uses these arrays to fetch click counts (`link_events`) and active tasks (`list_items`).

If the user has 50 lists, `userListIds` has 50 entries, causing a slow `IN` query. The sequential nature means the second batch of queries cannot start until the first database roundtrip completes.

#### Recommended Solution
Execute the queries in parallel using Postgrest joined relationship filters (`!inner` syntax). This eliminates the need to fetch the IDs beforehand:

```typescript
// Replace the waterfall with a single parallel Promise.all call:
const [profileResult, supportRes, clicksRes, cashflowsRes, tasksRes, activityRes] = await Promise.all([
  supabase.from('profiles').select('username, display_name, role, default_currency').eq('id', user.id).single(),
  getSupportTicketSummary(user.id, isAdmin),
  // Direct inner join to links for click counts
  supabase
    .from('link_events')
    .select('id, links!inner(user_id)', { count: 'exact', head: true })
    .eq('links.user_id', user.id)
    .gte('created_at', sevenDaysAgo.toISOString()),
  // Cashflow balances
  supabase.from('cashflow_summaries').select('balance').eq('user_id', user.id),
  // Direct inner join to lists for task count
  supabase
    .from('list_items')
    .select('id, lists!inner(user_id)', { count: 'exact', head: true })
    .eq('is_completed', false)
    .eq('lists.user_id', user.id),
  // Recent activity RPC
  supabase.rpc('get_recent_activity', { p_user_id: user.id, p_limit: 10 }),
]);
```

---

### 4. View-Based Aggregation for Count
* **Location**: [actions.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/features/list/actions.ts#L366-L372) (`getListCounts`)

#### Problem Analysis
`getListCounts` aggregates how many lists of each type (`todo`, `wishlist`, `idea`) a user has. However, it queries the `list_summaries` view:
```typescript
const { data, error } = await supabase
  .from('list_summaries')
  .select('type')
```
Because the view runs a `LEFT JOIN` on `list_items` and performs grouping and counting calculations (`COUNT(li.id)`), Postgres calculates the counts of every single item in the user's lists, only for the application to throw those numbers away and only look at the `type` column.

#### Recommended Solution
Query the raw `lists` table directly. This completely bypasses the view join logic:
```typescript
export async function getListCounts(): Promise<Record<ListType, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lists') // Query table, not view
    .select('type')
    .neq('title', NEW_IDEA_LIST_TITLE);

  const counts: Record<ListType, number> = { todo: 0, wishlist: 0, idea: 0 };
  if (!error && data) {
    data.forEach(l => {
      const type = listTypeSchema.catch('todo').parse(l.type);
      counts[type]++;
    });
  }
  return counts;
}
```

---

### 5. Unbounded Transaction Loading
* **Location**: [db.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/features/cashflow/db.ts#L83-L95) (`getCashflowDashboardData`) and [db.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/features/cashflow/db.ts#L154-L159) (`getCashflowDetailData`)

#### Problem Analysis
Both functions fetch transactions (`cashflow_entries`) without limits or pagination:
```typescript
const { data } = await supabase
  .from('cashflow_entries')
  .select('*')
  .eq('cashflow_id', cashflowId)
  .order('date', { ascending: false });
```
When a user records hundreds or thousands of transactions over time, the dashboard loads all historical transactions concurrently, leading to high network serialization costs and sluggish UI rendering.

#### Recommended Solution
Apply a default limit (e.g. 50 entries) on initial load, and offer paginated queries for older transactions.
```typescript
const { data } = await supabase
  .from('cashflow_entries')
  .select('*')
  .eq('cashflow_id', cashflowId)
  .order('date', { ascending: false })
  .limit(50); // Keep payload size small
```

---

### 6. Missing Cache on Public Bio Links
* **Location**: [db.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/features/bio/db.ts#L143-L162) (`getPublicProfileData`)

#### Problem Analysis
When visitors open a user's bio link page (`/[username]`), the route performs two queries:
1. Fetch the user profile (uses `'use cache'` via `getProfileByUsername`).
2. Fetch the user's links directly from Supabase (`supabase.from('links')...`).

While the profile details are cached, the link directory itself is queried from Supabase on every single request, meaning public page latency remains bound by the database query response times (typically 100-300ms).

#### Recommended Solution
Move public links fetching into a cached helper using Next.js 16 `'use cache'`. Set up cache tags (e.g. `links-${username}`) and revalidate them in the mutations/actions file whenever links are added, deleted, or reordered.

```typescript
// src/lib/data-cache.ts
import { cacheTag } from 'next/cache';

export async function getCachedPublicLinks(userId: string, username: string) {
  'use cache';
  cacheTag(`links-${username}`);

  const supabase = createStaticClient();
  const { data, count } = await supabase
    .from('links')
    .select(
      'id, title, url, is_active, short_id, is_folder, parent_id, sort_order, animation_type, children:links(count)',
      { count: 'exact' },
    )
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(0, 49);

  return { data: data || [], count: count || 0 };
}
```

---

## 🗄️ Database Indexing Audit

To support the above queries, verify that the following database indexes exist in Postgres.

### Active/Existing Indexes (Verified)
* `idx_cashflows_user_id` on `cashflows(user_id)`
* `idx_cashflow_entries_cashflow_id` on `cashflow_entries(cashflow_id)`
* `idx_cashflow_shares_email` on `cashflow_shares(email)`
* `idx_profile_events_profile_id` on `profile_events(profile_id)`
* `idx_lists_user_id` on `lists(user_id)`
* `idx_list_items_list_id` on `list_items(list_id)`

### Recommended/Missing Indexes
For recent activity feeds and query sorting, create these additional indexes:

```sql
-- Migration: 20260712000300_performance_indexes.sql
-- Optimizes recent activity feed unions
CREATE INDEX IF NOT EXISTS idx_links_created_at ON public.links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_created_at ON public.cashflow_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_list_items_created_at ON public.list_items(created_at DESC);

-- Optimizes sorting by date inside cashflow entry listings
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_cashflow_date ON public.cashflow_entries(cashflow_id, date DESC);
```
