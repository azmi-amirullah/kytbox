# Kytbox List App — Implementation Plan

Implement the **List** app — the third Kytbox app after Bio and Cashflow. List is a private/shareable tool for managing todo lists, wishlists, and ideas, following the established platform patterns.

## Docs Found

[Kytbox.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/Kytbox.md) explicitly defines List as a planned app:

- **§1**: `List (private / shareable)` — one of the core Kytbox apps
- **§4.1**: `/{username}/list` — public list page (future, if sharing enabled)
- **§4.2**: `/list` — private app dashboard (follows `/bio`, `/cashflow` pattern)
- **§5**: `list` is a reserved username
- **§11**: `/app/list` — app dashboard route
- **§12**: App Switcher already has List as `coming_soon` in [page.tsx](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/app/page.tsx#L33-L39)

No dedicated List doc exists yet (unlike [link-in-bio.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/link-in-bio.md) and [cashflow.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/cashflow.md)).

---

## User Review Required

> [!IMPORTANT]
> **Data Model Decision — List Types**
> The plan proposes a single `lists` table with a `type` column (`todo`, `wishlist`, `idea`). Each type enables slightly different item fields (e.g. `is_completed` for todos, `price` + `url` for wishlists, `priority` for ideas). This is simpler than separate tables per type. Acceptable?

> [!IMPORTANT]
> **Sharing Scope for V1**
> Cashflow has a full sharing system (`cashflow_shares` table, granular ACL with owner/editor/reader roles, `is_public` toggle, pinning). Should List V1 ship with:
> - **(A) Full sharing** — mirror Cashflow's `list_shares` model (owner/editor/reader + public toggle)
> - **(B) Simple sharing** — `is_public` toggle only (read-only via `/{username}/list`)
> - **(C) No sharing** — private-only for V1, add sharing later

> [!WARNING]
> **Migration Execution** — The plan includes a Supabase migration SQL file. You'll need to run this against your Supabase project manually or via CLI (`supabase db push` / `supabase migration up`).

## Open Questions

1. **Item subtypes** — Should wishlists items have a `price` and `purchase_url` field? Should ideas have a `priority` (high/medium/low) field? Or should all item types share identical fields (just `title`, `description`, `is_completed`)?

2. **Drag-and-drop reordering** — Bio links use `@dnd-kit` for reordering. Should list items support drag reorder too, or is manual sort (newest first / alphabetical / custom) sufficient for V1?

3. **Max lists per user** — Cashflow has no hard limit. Should we cap the number of lists (e.g., 10 for free tier, unlimited for Pro)?

---

## Proposed Changes

### 1. Database Layer (Supabase Migration)

#### [NEW] [20260629_create_list_tables.sql](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/supabase/migrations/20260629_create_list_tables.sql)

Two new tables following the Cashflow pattern:

**`lists`** (parent container)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `user_id` | `uuid` FK→profiles | Owner |
| `title` | `text` NOT NULL | List name |
| `type` | `text` NOT NULL | `todo` / `wishlist` / `idea` (CHECK constraint) |
| `is_public` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | Default `now()` |

**`list_items`** (child entries)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `list_id` | `uuid` FK→lists | CASCADE delete |
| `title` | `text` NOT NULL | Item text |
| `description` | `text` | Optional notes |
| `is_completed` | `boolean` | Default `false` (for todos) |
| `sort_order` | `integer` | Default `0` |
| `created_at` | `timestamptz` | Default `now()` |

**RLS Policies**: Mirror Cashflow — owner CRUD via `auth.uid() = user_id`. Public read when `is_public = true`.

**Indexes**: `idx_lists_user_id`, `idx_list_items_list_id`, `idx_list_items_sort_order`.

---

### 2. TypeScript Types

#### [MODIFY] [supabase.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/types/supabase.ts)

Add `lists` and `list_items` table definitions to the `Database` type (or regenerate via `supabase gen types`).

#### [MODIFY] [database.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/types/database.ts)

Add row type aliases:
```typescript
export type List = Database['public']['Tables']['lists']['Row'];
export type ListItem = Database['public']['Tables']['list_items']['Row'];
```

#### [MODIFY] [dto.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/types/dto.ts)

Add DTO interfaces:
```typescript
export interface ListDTO {
  id: string;
  title: string;
  type: 'todo' | 'wishlist' | 'idea';
  is_public: boolean;
  user_id: string;
  created_at: string | null;
  item_count: number;
  completed_count: number;
}

export interface ListItemDTO {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  sort_order: number;
  created_at: string | null;
}
```

---

### 3. Validation Schemas

#### [MODIFY] [validation.schemas.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/lib/validation.schemas.ts)

Add List schemas section:
```typescript
// LIST SCHEMAS
export const listTypeSchema = z.enum(['todo', 'wishlist', 'idea']);

export const createListSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  type: listTypeSchema,
});

export const listItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
});

export const updateListItemSchema = listItemSchema.extend({
  listId: z.uuid({ message: 'Invalid list ID' }),
});
```

---

### 4. DTO Mappers

#### [MODIFY] [mappers.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/lib/mappers.ts)

Add `mapListToDTO` and `mapListItemToDTO` functions following the Cashflow mapper pattern.

---

### 5. Edge Proxy (Auth)

#### [MODIFY] [proxy.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/proxy.ts)

Add `/list` to the protected route check (same pattern as `/cashflow`):
```diff
  const isProtectedRoute =
-   protectedPaths.some(matchesRoute) || pathname === '/cashflow';
+   protectedPaths.some(matchesRoute) || pathname === '/cashflow' || pathname === '/list';
```

---

### 6. App Dashboard Route

All new files under `src/app/(platform)/list/`:

#### [NEW] [page.tsx](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/list/page.tsx)

Server Component — fetches user's lists with item counts. Renders `<ListDashboard />`. Mirrors [cashflow/page.tsx](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/cashflow/page.tsx) pattern.

#### [NEW] [loading.tsx](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/list/loading.tsx)

Skeleton loader following [LOADING_STATES.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/LOADING_STATES.md) guidelines.

#### [NEW] [actions.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/list/actions.ts)

Server Actions:
- `createList(formData)` — validates via `createListSchema`, inserts into `lists`
- `updateList(listId, formData)` — update title, type
- `deleteList(listId)` — owner-only delete
- `addItem(formData)` — validates via `updateListItemSchema`, inserts into `list_items`
- `updateItem(itemId, formData)` — update title, description
- `toggleItem(itemId)` — toggle `is_completed`
- `deleteItem(itemId)` — delete with ownership check via parent list
- `reorderItems(listId, itemIds)` — batch update `sort_order`
- `toggleListPublic(listId)` — toggle `is_public`

All follow `getAuthenticatedUser()` → Zod validation → owner check → Supabase mutation → `revalidatePath('/list')` pattern.

---

### 7. Client Components

All under `src/app/(platform)/list/components/`:

#### [NEW] ListDashboard.tsx
- Grid of `<ListCard />` components
- "Create List" button opening `<CreateListModal />`
- Filter tabs by type (All / Todos / Wishlists / Ideas)
- Empty state with CTA

#### [NEW] ListCard.tsx
- Card showing list title, type badge, item count, completion progress (for todos)
- Click navigates to list detail
- Dropdown menu: Rename, Delete, Toggle Public
- Visual type indicator (icon + color per type)

#### [NEW] CreateListModal.tsx
- Dialog with title input + type selector (todo/wishlist/idea)
- Uses shadcn Dialog + Select components

#### [NEW] ListDetail.tsx
- Full list view with items
- Inline add item form
- Item list with checkboxes (todos), edit/delete actions
- Drag-and-drop reorder (if approved)
- Empty state

#### [NEW] ListItemRow.tsx
- Single item row: checkbox (if todo) + title + description preview + actions
- Inline edit mode
- Strikethrough animation on complete

---

### 8. List Detail Route

#### [NEW] [page.tsx](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/list/[id]/page.tsx)

Server Component — fetches single list + all items. Verifies ownership. Renders `<ListDetail />`.

#### [NEW] [loading.tsx](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/list/[id]/loading.tsx)

Skeleton for detail view.

---

### 9. App Switcher Update

#### [MODIFY] [page.tsx](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/app/page.tsx)

Change List app `status` from `'coming_soon'` to `'active'` and update `href` to `/list`.

---

### 10. Documentation

#### [NEW] [list.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/list.md)

App documentation following cashflow.md pattern — data model, features, sharing rules.

#### [MODIFY] [Kytbox.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/Kytbox.md)

Update implementation status table — add List rows. Add List to route reference table.

---

## File Summary

| Action | File | Purpose |
|---|---|---|
| NEW | `supabase/migrations/20260629_create_list_tables.sql` | Database schema |
| MODIFY | `src/types/supabase.ts` | Add list table types |
| MODIFY | `src/types/database.ts` | Add row type aliases |
| MODIFY | `src/types/dto.ts` | Add ListDTO, ListItemDTO |
| MODIFY | `src/lib/validation.schemas.ts` | Add list Zod schemas |
| MODIFY | `src/lib/mappers.ts` | Add list DTO mappers |
| MODIFY | `src/proxy.ts` | Protect `/list` route |
| NEW | `src/app/(platform)/list/page.tsx` | List dashboard page |
| NEW | `src/app/(platform)/list/loading.tsx` | Dashboard skeleton |
| NEW | `src/app/(platform)/list/actions.ts` | Server actions (CRUD) |
| NEW | `src/app/(platform)/list/[id]/page.tsx` | List detail page |
| NEW | `src/app/(platform)/list/[id]/loading.tsx` | Detail skeleton |
| NEW | `src/app/(platform)/list/components/ListDashboard.tsx` | Dashboard grid |
| NEW | `src/app/(platform)/list/components/ListCard.tsx` | List card |
| NEW | `src/app/(platform)/list/components/CreateListModal.tsx` | Create dialog |
| NEW | `src/app/(platform)/list/components/ListDetail.tsx` | Detail view |
| NEW | `src/app/(platform)/list/components/ListItemRow.tsx` | Item row |
| MODIFY | `src/app/(platform)/app/page.tsx` | Activate list in switcher |
| NEW | `docs/list.md` | App documentation |
| MODIFY | `docs/Kytbox.md` | Update status tables |

---

## Verification Plan

### Automated Tests
- `cmd /c npm run build` — verify zero type errors, zero build failures
- `cmd /c npm run lint` — verify no lint violations
- Unit tests for Zod schemas (`listTypeSchema`, `createListSchema`, `listItemSchema`)

### Manual Verification
- Navigate to `/app` — List card should show as **active** (not "Coming Soon")
- Click List → `/list` loads dashboard with empty state
- Create a todo list → card appears with correct type badge
- Open list → add items, toggle completion, reorder
- Create wishlist + idea lists → verify type-specific rendering
- Toggle `is_public` → verify RLS allows public read
- Test auth: unauthenticated access to `/list` redirects to `/login`
- Mobile responsiveness at 320px viewport
