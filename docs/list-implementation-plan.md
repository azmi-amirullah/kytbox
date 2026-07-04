# Kytbox List App — Implementation Plan (v3 — Final)

Implement the **List** app — the third Kytbox app after Bio and Cashflow. List is a hub containing three sub-apps: **Todo** (Kanban board), **Wishlist** (priced items), and **Ideas** (brain dump).

This plan is the **final version** after incorporating all user feedback. All architecture decisions are locked in.

---

## 📋 Feature Specification

### Hub (`/list`)

The entry point for the List app. A clean page with 3 cards — one for each sub-app. Each card shows the sub-app icon, name, description, and count of boards/lists the user has. Clicking a card navigates to that sub-app's grid.

| Feature | Description |
|---|---|
| 3 type cards | Todo (blue), Wishlist (pink), Ideas (amber) — each clickable |
| Per-type count | Shows how many boards/lists of that type exist |
| Navigation | Card click → `/list/todo`, `/list/wishlist`, `/list/ideas` |

---

### 📌 Todo — Kanban Board (`/list/todo`)

A Trello-like project management tool. Users create **boards**, and each board has **columns** (stages). Items are **cards** that live inside columns and can be dragged between them.

#### Board Grid (`/list/todo`)

| Feature | Description |
|---|---|
| Create board | "New Board" button → title + optional description |
| Board cards | Shows title, description preview, card count, completion progress bar, last modified time |
| Completion stats | `X/Y done` — counts cards in done-columns vs total cards |
| Sorting | Recently modified first |
| Actions dropdown | Rename, Delete, Toggle Public |

#### Kanban Board View (`/list/todo/[id]`)

| Feature | Description |
|---|---|
| **Columns** | Default 4 on new board: **Todo → In Progress → Review → Completed** |
| Add column | "+ Add Column" button at end of column row |
| Rename column | Inline edit — click column title to rename |
| Delete column | Deletes column **and all cards inside it** (confirmation dialog warns user) |
| Reorder columns | Drag columns horizontally to reorder |
| Done column | Any column can be marked as "done" column (green header/accent). Cards moved here auto-set `is_completed = true`. Cards moved out auto-set `is_completed = false`. Default: "Completed" column is the done column |
| **Cards** | |
| Add card | "+ Add Card" button at bottom of each column |
| Card content | Title (required) + description (optional) |
| Edit card | Click card → inline edit title & description |
| Delete card | Delete button on card with confirmation |
| Drag within column | Reorder cards vertically within the same column |
| Drag between columns | Drag a card from one column to another (cross-column DnD). Optimistic UI — instant visual move, persists to DB via server action |
| Done auto-sync | When a card lands in a done-column → `is_completed = true`. When it leaves → `is_completed = false` |
| **Board actions** | |
| Back button | Returns to `/list/todo` grid |
| Public toggle | Toggle `is_public` for simple sharing |
| Board settings | Rename board, edit description |
| **Mobile** | Columns scroll horizontally (no stacking). Touch drag supported via `@dnd-kit` PointerSensor |

---

### 💖 Wishlist (`/list/wishlist`)

A list of things you want — with price tracking. Think of it as a shopping/gift wish tracker.

#### Wishlist Grid (`/list/wishlist`)

| Feature | Description |
|---|---|
| Create wishlist | "New Wishlist" button → title + optional description |
| Wishlist cards | Title, description preview, item count, completion (purchased count), last modified |
| Actions dropdown | Rename, Delete, Toggle Public |

#### Wishlist Detail (`/list/wishlist/[id]`)

| Feature | Description |
|---|---|
| **Items** | |
| Add wish item | Title (required), description (optional), price (optional), currency (optional), purchase URL (optional) |
| Item display | Title + price badge (formatted with currency) + URL as clickable external link icon |
| Mark as purchased | Checkbox toggle → `is_completed = true`. Strikethrough animation on purchased items (CSS `line-through` + `opacity-60`) |
| Edit item | Inline edit — all fields (title, description, price, currency, URL) |
| Delete item | Delete with confirmation |
| Drag reorder | Vertical drag-and-drop to reorder items |
| **Summary** | |
| Total remaining | Sum of prices for unpurchased items (displayed at bottom) |
| Progress | `X/Y purchased` count |
| **List actions** | |
| Back button | Returns to `/list/wishlist` grid |
| Public toggle | Toggle `is_public` |
| Edit list | Rename title, edit description |

---

### 💡 Ideas — Brain Dump (`/list/ideas`)

The simplest sub-app. Just write things down so you don't forget them. No metadata, no complexity — pure capture.

#### Ideas Grid (`/list/ideas`)

| Feature | Description |
|---|---|
| Create idea list | "New Idea List" button → title + optional description |
| Idea list cards | Title, description preview, item count, last modified |
| Actions dropdown | Rename, Delete, Toggle Public |

#### Idea Detail (`/list/ideas/[id]`)

| Feature | Description |
|---|---|
| Add idea | Inline "Add idea" form at top — just type and press Enter |
| Item display | Title + description preview (expandable) |
| Mark as noted | Checkbox toggle → `is_completed = true`. Subtle visual change (dimmed text) |
| Edit idea | Inline edit — title + description |
| Delete idea | Delete with confirmation |
| Drag reorder | Vertical drag-and-drop to reorder |
| **List actions** | |
| Back button | Returns to `/list/ideas` grid |
| Public toggle | Toggle `is_public` |
| Edit list | Rename title, edit description |

---

### Shared Features (All Types)

| Feature | Description |
|---|---|
| `is_public` toggle | Owner-only. Makes the list readable by anyone with the link (read-only). V1 = simple sharing, no ACL |
| Drag and drop | `@dnd-kit` (already installed). Vertical reorder for wishlist/ideas. Cross-column for Kanban |
| Empty states | Type-specific empty state with icon + CTA when no items exist |
| Skeletons | `loading.tsx` for every route — zero-jank transitions per [LOADING_STATES.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/LOADING_STATES.md) |
| Error boundary | Smart Recovery — logged-in users → `/support`, guests → email |
| Auth protection | All `/list/*` routes require login (via `proxy.ts`) |
| Mobile-first | 320px min-width. Responsive layouts. Kanban scrolls horizontally |
| WCAG 2.2 | ARIA roles, keyboard navigation, focus management on all interactive elements |

---

## 🔑 Key Architecture Decisions (Locked In)

| Decision | Resolution | Rationale |
|---|---|---|
| **1 table vs 3 tables** | **1 unified `lists` parent table** with `type` column | Uniform permissions/sharing, simpler RLS, future "send to" between types is just an UPDATE on `list_id` |
| **Todo structure** | **Kanban board** with customizable columns (Trello-like) | User confirmed ✅ |
| **Column deletion** | **Cascade-delete all items** in that column (with confirmation dialog warning) | User confirmed ✅ |
| **Done column** | `is_done_column` flag + **green visual indicator** (green header/border accent) | User confirmed ✅ |
| **Wishlist fields** | `metadata` JSONB: `{price, currency, purchase_url}` | User confirmed ✅ |
| **Idea fields** | Title + description only, no priority | User confirmed ✅ |
| **Sharing model** | (B) Simple sharing — `is_public` toggle only | User confirmed ✅ |
| **Drag and drop** | Yes, all types. `@dnd-kit` already installed | Cross-column DnD for Kanban, within-list reorder for wishlist/ideas |
| **Limits** | No cap for V1 | User confirmed ✅, Pro for later |
| **Sub-app routing** | `/list` hub → `/list/todo`, `/list/wishlist`, `/list/ideas` | User spec: separate menus |

> [!WARNING]
> **Migration Execution** — The plan includes a Supabase migration SQL file. Run via CLI (`supabase db push` / `supabase migration up`) or SQL Editor.

---

## Proposed Changes

### 1. Database Layer (Supabase Migration)

#### [NEW] [20260701_create_list_tables.sql](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/supabase/migrations/20260701_create_list_tables.sql)

Three tables + one view + two triggers.

---

**`lists`** (parent container — shared across all types)

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | |
| `user_id` | `uuid` FK→profiles | — | Owner. `ON DELETE CASCADE` |
| `title` | `text NOT NULL` | — | Board/list name |
| `description` | `text` | `null` | Optional context |
| `type` | `text NOT NULL` | — | CHECK: `todo`, `wishlist`, `idea` |
| `is_public` | `boolean NOT NULL` | `false` | Simple sharing toggle |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | Auto-maintained by trigger |

---

**`list_columns`** (Kanban columns — only for `type = 'todo'`)

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | |
| `list_id` | `uuid` FK→lists | — | `ON DELETE CASCADE` |
| `title` | `text NOT NULL` | — | Column name (user-editable) |
| `sort_order` | `integer NOT NULL` | `0` | Column position |
| `is_done_column` | `boolean NOT NULL` | `false` | Items here auto-set `is_completed = true` |
| `created_at` | `timestamptz` | `now()` | |

---

**`list_items`** (child entries — shared across all types)

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | |
| `list_id` | `uuid` FK→lists | — | `ON DELETE CASCADE` |
| `column_id` | `uuid` FK→list_columns | `null` | `ON DELETE CASCADE`. Only used for `todo` type. When a column is deleted, its items are deleted too |
| `title` | `text NOT NULL` | — | Item text |
| `description` | `text` | `null` | Optional notes |
| `is_completed` | `boolean NOT NULL` | `false` | Universal done flag. Auto-synced for Kanban via server action |
| `sort_order` | `integer NOT NULL` | `0` | Position within column (todo) or list (wishlist/idea) |
| `metadata` | `jsonb` | `null` | Type-specific: `{price, currency, purchase_url}` for wishlists |
| `created_at` | `timestamptz` | `now()` | |

---

**`list_summaries`** (SQL View, `security_invoker = true`)

Mirrors `cashflow_summaries` pattern. Pre-aggregates at the DB level:

```sql
CREATE VIEW list_summaries WITH (security_invoker = true) AS
SELECT
  l.id, l.user_id, l.title, l.description, l.type, l.is_public,
  l.created_at, l.updated_at,
  COUNT(li.id)::int AS item_count,
  COUNT(li.id) FILTER (WHERE li.is_completed = true)::int AS completed_count
FROM lists l
LEFT JOIN list_items li ON li.list_id = l.id
GROUP BY l.id;
```

---

**Triggers:**

```sql
-- 1. Auto-update lists.updated_at on any UPDATE
CREATE OR REPLACE FUNCTION update_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION update_lists_updated_at();

-- 2. Touch parent list updated_at when items change
CREATE OR REPLACE FUNCTION touch_list_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lists SET updated_at = now()
  WHERE id = COALESCE(NEW.list_id, OLD.list_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_touch_list_on_item
  AFTER INSERT OR UPDATE OR DELETE ON list_items
  FOR EACH ROW EXECUTE FUNCTION touch_list_on_item_change();
```

---

**RLS Policies:**

| Table | Policy | Rule |
|---|---|---|
| `lists` | Owner CRUD | `auth.uid() = user_id` (for all: SELECT, INSERT, UPDATE, DELETE) |
| `lists` | Public SELECT | `is_public = true` |
| `list_columns` | Owner CRUD | `list_id IN (SELECT id FROM lists WHERE user_id = auth.uid())` |
| `list_items` | Owner CRUD | `list_id IN (SELECT id FROM lists WHERE user_id = auth.uid())` |
| `list_items` | Public SELECT | `list_id IN (SELECT id FROM lists WHERE is_public = true)` |

---

**Indexes:**

```sql
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_type ON lists(type);
CREATE INDEX idx_lists_is_public ON lists(is_public) WHERE is_public = true;
CREATE INDEX idx_list_columns_list_id ON list_columns(list_id);
CREATE INDEX idx_list_items_list_id ON list_items(list_id);
CREATE INDEX idx_list_items_column_id ON list_items(column_id);
CREATE INDEX idx_list_items_sort_order ON list_items(list_id, sort_order);
```

---

### 2. TypeScript Types

#### [MODIFY] [supabase.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/types/supabase.ts)

Regenerate via `supabase gen types typescript` to pick up `lists`, `list_columns`, `list_items` tables and `list_summaries` view.

#### [MODIFY] [database.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/types/database.ts)

```typescript
export type List = Database['public']['Tables']['lists']['Row'];
export type ListColumn = Database['public']['Tables']['list_columns']['Row'];
export type ListItem = Database['public']['Tables']['list_items']['Row'];
export type ListWithSummary =
  Database['public']['Views']['list_summaries']['Row'];
```

#### [MODIFY] [dto.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/types/dto.ts)

```typescript
export type ListType = 'todo' | 'wishlist' | 'idea';

export interface ListDTO {
  id: string;
  title: string;
  description: string | null;
  type: ListType;
  is_public: boolean;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
  item_count: number;
  completed_count: number;
}

export interface ListColumnDTO {
  id: string;
  list_id: string;
  title: string;
  sort_order: number;
  is_done_column: boolean;
}

export interface ListItemDTO {
  id: string;
  list_id: string;
  column_id: string | null;
  title: string;
  description: string | null;
  is_completed: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string | null;
}

// Wishlist-specific metadata shape (parsed from JSONB)
export interface WishlistItemMeta {
  price: number | null;
  currency: string | null;
  purchase_url: string | null;
}
```

---

### 3. Validation Schemas

#### [MODIFY] [validation.schemas.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/lib/validation.schemas.ts)

```typescript
// ==========================================
// LIST SCHEMAS
// ==========================================

export const listTypeSchema = z.enum(['todo', 'wishlist', 'idea']);

export const createListSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long'),
  type: listTypeSchema,
  description: z.string().max(500).optional().or(z.literal('')),
});

export const updateListSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500).optional().or(z.literal('')),
});

export const listColumnSchema = z.object({
  title: z.string().trim().min(1, 'Column name is required').max(50, 'Column name too long'),
});

export const listItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300, 'Title too long'),
  description: z.string().max(1000).optional().or(z.literal('')),
});

export const createListItemSchema = listItemSchema.extend({
  listId: z.uuid({ message: 'Invalid list ID' }),
  columnId: z.uuid({ message: 'Invalid column ID' }).optional().or(z.literal('')),
});

export const wishlistMetadataSchema = z.object({
  price: z.coerce.number().nonnegative().nullable().catch(null),
  currency: z.string().max(3).nullable().catch(null),
  purchase_url: z.string().url().nullable().catch(null),
}).catch({ price: null, currency: null, purchase_url: null });

export const listItemMetadataSchema = z.record(z.string(), z.unknown()).catch({});
```

#### [MODIFY] `validation.schemas.client.ts`

Add client-side equivalents using `zod/mini`:

```typescript
// LIST SCHEMAS (client)
export const listTypeSchema = z.enum(['todo', 'wishlist', 'idea']);

export const createListFormSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required'), z.maxLength(100, 'Too long')),
  type: listTypeSchema,
  description: z.optional(z.string()),
});

export const listItemFormSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required'), z.maxLength(300, 'Too long')),
  description: z.optional(z.string()),
});

export const listColumnFormSchema = z.object({
  title: z.string().check(z.minLength(1, 'Name is required'), z.maxLength(50, 'Too long')),
});

export const wishlistItemFormSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required'), z.maxLength(300, 'Too long')),
  description: z.optional(z.string()),
  price: z.optional(z.string()),
  currency: z.optional(z.string()),
  purchase_url: z.optional(z.string()),
});
```

---

### 4. DTO Mappers

#### [MODIFY] [mappers.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/lib/mappers.ts)

```typescript
import type { ListWithSummary, ListColumn, ListItem } from '@/types/database';
import type { ListDTO, ListColumnDTO, ListItemDTO } from '@/types/dto';
import { listTypeSchema, listItemMetadataSchema } from '@/lib/validation.schemas';

export function mapListToDTO(row: ListWithSummary): ListDTO {
  return {
    id: row.id!,
    title: row.title!,
    description: row.description ?? null,
    type: listTypeSchema.catch('todo').parse(row.type),
    is_public: !!row.is_public,
    user_id: row.user_id!,
    created_at: row.created_at,
    updated_at: row.updated_at,
    item_count: Number(row.item_count ?? 0),
    completed_count: Number(row.completed_count ?? 0),
  };
}

export function mapListColumnToDTO(row: ListColumn): ListColumnDTO {
  return {
    id: row.id,
    list_id: row.list_id,
    title: row.title,
    sort_order: row.sort_order ?? 0,
    is_done_column: !!row.is_done_column,
  };
}

export function mapListItemToDTO(row: ListItem): ListItemDTO {
  return {
    id: row.id,
    list_id: row.list_id,
    column_id: row.column_id ?? null,
    title: row.title,
    description: row.description ?? null,
    is_completed: !!row.is_completed,
    sort_order: row.sort_order ?? 0,
    metadata: listItemMetadataSchema.parse(row.metadata),
    created_at: row.created_at,
  };
}
```

---

### 5. Edge Proxy (Auth)

#### [MODIFY] [proxy.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/proxy.ts)

Add `/list` to `protectedPaths` array. All `/list/*` sub-routes are private in V1:

```diff
  const protectedPaths = [
    '/app',
    '/bio',
+   '/list',
    '/onboarding',
    '/settings',
    '/support',
    '/support-admin',
    '/update-password',
  ];
```

---

### 6. Routing Structure

```
/list                          → Hub page (choose: Todo / Wishlist / Ideas)
/list/todo                     → All todo boards
/list/todo/[id]                → Kanban board view
/list/wishlist                 → All wishlists
/list/wishlist/[id]            → Wishlist detail
/list/ideas                    → All idea lists
/list/ideas/[id]               → Ideas detail
```

All routes are private (auth required via proxy). This matches [Kytbox.md §4.2](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/Kytbox.md#L110-L128): "If it modifies data, it belongs here."

---

### 7. File Structure

```
src/app/(platform)/list/
├── page.tsx                              # Hub page
├── loading.tsx                           # Hub skeleton
├── error.tsx                             # Smart Recovery error boundary
├── actions.ts                            # List + item CRUD server actions
├── column-actions.ts                     # Kanban column management actions
├── todo/
│   ├── page.tsx                          # Todo boards grid
│   ├── loading.tsx                       # Grid skeleton
│   └── [id]/
│       ├── page.tsx                      # Kanban board
│       └── loading.tsx                   # Board skeleton
├── wishlist/
│   ├── page.tsx                          # Wishlists grid
│   ├── loading.tsx                       # Grid skeleton
│   └── [id]/
│       ├── page.tsx                      # Wishlist detail
│       └── loading.tsx                   # Detail skeleton
├── ideas/
│   ├── page.tsx                          # Ideas grid
│   ├── loading.tsx                       # Grid skeleton
│   └── [id]/
│       ├── page.tsx                      # Idea detail
│       └── loading.tsx                   # Detail skeleton
└── components/
    ├── ListHub.tsx                       # Hub with 3 type cards
    ├── TypeListGrid.tsx                  # Shared grid for type pages
    ├── ListCard.tsx                      # List/board card (type-aware)
    ├── CreateListModal.tsx               # Create dialog (type pre-selected)
    ├── EditListModal.tsx                 # Rename/edit dialog
    ├── DeleteListDialog.tsx              # Delete confirmation
    │
    │── # KANBAN (Todo)
    ├── KanbanBoard.tsx                   # Full Kanban layout (DndContext)
    ├── KanbanColumn.tsx                  # Single column (droppable zone, green accent if done)
    ├── KanbanCard.tsx                    # Card in column (sortable item)
    ├── AddColumnModal.tsx                # Add new column dialog
    ├── EditColumnModal.tsx               # Rename column dialog
    ├── DeleteColumnDialog.tsx            # Delete column + cascade-delete items (confirmation)
    │
    │── # WISHLIST
    ├── WishlistDetail.tsx                # Wishlist view with items
    ├── WishlistItemRow.tsx               # Item with price/url display
    ├── AddWishlistItemModal.tsx          # Add wish item (title + price + url)
    │
    │── # IDEAS
    ├── IdeaDetail.tsx                    # Idea list view
    ├── IdeaItemRow.tsx                   # Simple idea item
    └── AddItemModal.tsx                  # Shared simple add (idea, inline for kanban)
```

---

### 8. Server Actions

#### [NEW] [actions.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/list/actions.ts)

All use `getAuthenticatedUserWithRateLimit as getAuthenticatedUser` from `@/lib/auth-with-rate-limit`.

**List-level actions:**

| Action | Validation | Notes |
|---|---|---|
| `createList(formData)` | `createListSchema` | INSERT into `lists`. If `type === 'todo'`, also INSERT 4 default columns (Todo, In Progress, Review, Completed) with `is_done_column = true` on "Completed" |
| `updateList(listId, formData)` | `updateListSchema` | UPDATE title/description. Owner check via `.eq('user_id', user.id)` |
| `deleteList(listId)` | uuid | DELETE with owner check. CASCADE handles children |
| `toggleListPublic(listId)` | — | UPDATE `is_public`. Owner check |

**Item-level actions:**

| Action | Validation | Notes |
|---|---|---|
| `addItem(formData)` | `createListItemSchema` | INSERT into `list_items`. For todo: requires `columnId`. For wishlist: parses `metadata` from form fields. Ownership via parent list join |
| `updateItem(itemId, formData)` | `listItemSchema` | UPDATE title/description/metadata. Ownership via `lists(user_id)` join |
| `toggleItem(itemId)` | — | Toggle `is_completed`. For wishlist/ideas only (Kanban uses `moveItem`) |
| `deleteItem(itemId)` | — | DELETE with ownership check via parent |
| `reorderItems(listId, itemIds)` | uuid[] | Batch UPDATE `sort_order`. For within-column (todo) or within-list (wishlist/idea) |
| `moveItem(itemId, columnId, sortOrder)` | uuids | **Kanban-specific**: UPDATE `column_id` + `sort_order`. Auto-sync `is_completed` based on target column's `is_done_column` flag |

Ownership verification pattern (from Cashflow):
```typescript
const joinedOwnerSchema = z
  .object({ user_id: z.string() })
  .nullish()
  .transform((v) => v?.user_id);
```

**Default columns seeding** (inside `createList`):
```typescript
if (parsed.data.type === 'todo') {
  const defaultColumns = [
    { list_id: newList.id, title: 'Todo', sort_order: 0, is_done_column: false },
    { list_id: newList.id, title: 'In Progress', sort_order: 1, is_done_column: false },
    { list_id: newList.id, title: 'Review', sort_order: 2, is_done_column: false },
    { list_id: newList.id, title: 'Completed', sort_order: 3, is_done_column: true },
  ];
  await supabase.from('list_columns').insert(defaultColumns);
}
```

#### [NEW] [column-actions.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/list/column-actions.ts)

| Action | Validation | Notes |
|---|---|---|
| `addColumn(listId, title)` | `listColumnSchema` | INSERT. Auto `sort_order` = max + 1. Verify parent list ownership + type = todo |
| `updateColumn(columnId, title)` | `listColumnSchema` | UPDATE title. Ownership via parent list join |
| `deleteColumn(columnId)` | uuid | **Cascade-delete**: DELETE column → all items in that column are cascade-deleted via FK constraint. Confirmation dialog on client warns: "This will permanently delete X cards in this column." Must verify at least 1 column remains after deletion |
| `reorderColumns(listId, columnIds)` | uuid[] | Batch UPDATE `sort_order`. Ownership check |
| `toggleDoneColumn(columnId)` | uuid | Toggle `is_done_column`. When marking as done: batch UPDATE all items in that column to `is_completed = true`. When unmarking: batch UPDATE to `is_completed = false` |

---

### 9. Client Components — Detail

#### ListHub.tsx
- 3 visual cards: Todo (Kanban icon, blue), Wishlist (heart icon, pink), Ideas (lightbulb icon, amber)
- Each card shows: icon, title, description, count of boards/lists of that type
- Click navigates to `/list/todo`, `/list/wishlist`, `/list/ideas`
- Receives `counts: { todo: number, wishlist: number, idea: number }` from server

#### TypeListGrid.tsx
- Shared component used by all 3 type pages
- Grid of `<ListCard />` components
- "Create" button opening `<CreateListModal />` with type pre-selected
- Empty state with type-specific CTA and icon
- Sort: Recently modified first (default)

#### ListCard.tsx
- Title, description preview, item count, completion progress (bar for todo/wishlist)
- Type badge with icon:
  - Todo: `LuLayoutGrid` + blue
  - Wishlist: `LuHeart` + pink
  - Ideas: `LuLightbulb` + amber
- `updated_at` relative timestamp
- Dropdown: Rename, Delete, Toggle Public
- Click → navigates to detail

#### KanbanBoard.tsx (most complex component)
- Uses `@dnd-kit/core` with `DndContext`, `DragOverlay`, `closestCenter` collision detection
- `@dnd-kit/sortable` for within-column reorder
- Cross-column drag uses `handleDragOver` + `handleDragEnd` pattern from [dnd-kit docs](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/react/guides/multiple-sortable-lists.mdx)
- Each column is a `useDroppable` zone
- Each card is a `useSortable` item
- **Optimistic updates**: Move item in local state immediately, persist via `moveItem` server action
- Board header: list title, back button, public toggle, settings dropdown
- "Add Column" button at the end of the column row
- Horizontal scroll on mobile (columns don't stack)
- `isLoading` prop for skeleton (empty columns with skeleton cards)

#### KanbanColumn.tsx
- Column header: title (editable inline), item count, dropdown (Rename, Mark as Done, Delete)
- "Add card" button at bottom of column
- Drop zone for cards (`useDroppable`)
- `SortableContext` wraps children for within-column reorder
- **Done column visual**: Green header background/border accent (`bg-emerald-500/10 border-emerald-500/30`), green checkmark icon next to title, so user clearly knows which column marks items as "done"
- Non-done columns: neutral styling (default card/border colors)

#### KanbanCard.tsx
- Title + description preview
- Completion indicator (checkmark if in done column)
- `useSortable` for drag behavior
- Drag handle (`LuGripVertical`)
- Click to expand: inline edit title/description
- Delete button

#### WishlistDetail.tsx
- List of wish items with drag-reorder
- "Add Wish" button/form
- Each item shows: title, price, currency, purchase URL (as clickable link)
- Checkbox to mark as "purchased" (`is_completed`)
- Total price summary at bottom (sum of all items where `is_completed = false`)

#### WishlistItemRow.tsx
- Checkbox (purchased toggle) + title + price badge + URL icon link
- Inline edit mode
- Price formatted with currency
- Strikethrough on purchased items
- Drag handle

#### IdeaDetail.tsx
- Simplest view: list of ideas with drag-reorder
- "Add Idea" inline form
- Checkbox to mark as "noted" (`is_completed`)

#### IdeaItemRow.tsx
- Checkbox + title + description preview
- Inline edit
- Subtle styling (no metadata, clean)
- Drag handle

---

### 10. Hub Page (Server Component)

#### [NEW] [page.tsx](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/app/(platform)/list/page.tsx)

```typescript
const { user, supabase } = await getAuthenticatedUser();

// Get counts per type in one query
const { data: lists } = await supabase
  .from('list_summaries')
  .select('type')
  .eq('user_id', user.id);

const counts = {
  todo: lists?.filter(l => l.type === 'todo').length ?? 0,
  wishlist: lists?.filter(l => l.type === 'wishlist').length ?? 0,
  idea: lists?.filter(l => l.type === 'idea').length ?? 0,
};

return <ListHub counts={counts} />;
```

---

### 11. Type Pages (Server Components)

#### [NEW] `list/todo/page.tsx`, `list/wishlist/page.tsx`, `list/ideas/page.tsx`

All follow the same pattern — fetch lists of that type:

```typescript
const { user, supabase } = await getAuthenticatedUser();
const { data } = await supabase
  .from('list_summaries')
  .select('*')
  .eq('user_id', user.id)
  .eq('type', 'todo') // or 'wishlist' or 'idea'
  .order('updated_at', { ascending: false });

return <TypeListGrid lists={(data || []).map(mapListToDTO)} type="todo" />;
```

---

### 12. Detail Pages (Server Components)

#### [NEW] `list/todo/[id]/page.tsx` — Kanban Board

```typescript
const { user, supabase } = await getAuthenticatedUser();

const [listResult, columnsResult, itemsResult] = await Promise.all([
  supabase.from('lists').select('*').eq('id', id).eq('user_id', user.id).eq('type', 'todo').single(),
  supabase.from('list_columns').select('*').eq('list_id', id).order('sort_order'),
  supabase.from('list_items').select('*').eq('list_id', id).order('sort_order'),
]);

if (!listResult.data) notFound();

return (
  <KanbanBoard
    list={mapListRawToDTO(listResult.data)}
    columns={(columnsResult.data || []).map(mapListColumnToDTO)}
    items={(itemsResult.data || []).map(mapListItemToDTO)}
  />
);
```

#### [NEW] `list/wishlist/[id]/page.tsx` — Wishlist Detail

Same pattern but fetches items only (no columns). Renders `<WishlistDetail />`.

#### [NEW] `list/ideas/[id]/page.tsx` — Ideas Detail

Same pattern, simplest data fetch. Renders `<IdeaDetail />`.

---

### 13. App Switcher Update

#### [MODIFY] [apps.ts](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/src/config/apps.ts)

```diff
  {
    id: 'list',
    name: 'List',
    description: 'Todo lists, wishlists & ideas',
    href: '/list',
    icon: LuListTodo,
-   status: 'coming_soon',
+   status: 'active',
    color: 'bg-blue-500/10 text-blue-600',
  },
```

---

### 14. Documentation

#### [NEW] [list.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/list.md)

Full app documentation following [cashflow.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/cashflow.md) structure:
1. Core Features (3 sub-apps: Todo Kanban, Wishlist, Ideas)
2. Technical Architecture (routing, access control, sub-path model)
3. Database Schema (3 tables + view + triggers)
4. Security Model (RLS policy matrix)
5. API Surface (server actions)
6. Design Decisions (1 table vs 3, Kanban architecture, metadata JSONB)
7. Implementation Status

#### [MODIFY] [Kytbox.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/Kytbox.md)

- Add List rows to Implementation Status table
- Add `/list`, `/list/todo`, `/list/wishlist`, `/list/ideas` to Route Reference (§12.3)
- Add `list.md` link to App Documentation (§12.2)

#### [MODIFY] [DATABASE_GUIDE.md](file:///c:/Users/Azmi/Documents/Azmi/Project/ukit/docs/DATABASE_GUIDE.md)

- Add §2.5 "List App" (`lists`, `list_columns`, `list_items`)
- Add migration #13 to Reference Migration History

---

## File Summary

| Action | File | Purpose |
|---|---|---|
| **NEW** | `supabase/migrations/20260701_create_list_tables.sql` | 3 tables + view + triggers + RLS + indexes |
| **MODIFY** | `src/types/supabase.ts` | Regenerate (lists, list_columns, list_items, list_summaries) |
| **MODIFY** | `src/types/database.ts` | Add `List`, `ListColumn`, `ListItem`, `ListWithSummary` |
| **MODIFY** | `src/types/dto.ts` | Add `ListDTO`, `ListColumnDTO`, `ListItemDTO`, `ListType`, `WishlistItemMeta` |
| **MODIFY** | `src/lib/validation.schemas.ts` | Add list/column/item/metadata Zod schemas |
| **MODIFY** | `src/lib/validation.schemas.client.ts` | Add client-side list schemas (zod/mini) |
| **MODIFY** | `src/lib/mappers.ts` | Add `mapListToDTO`, `mapListColumnToDTO`, `mapListItemToDTO` |
| **MODIFY** | `src/proxy.ts` | Add `/list` to `protectedPaths` |
| **MODIFY** | `src/config/apps.ts` | Set List status to `'active'` |
| **NEW** | `src/app/(platform)/list/page.tsx` | Hub page |
| **NEW** | `src/app/(platform)/list/loading.tsx` | Hub skeleton |
| **NEW** | `src/app/(platform)/list/error.tsx` | Smart Recovery error boundary |
| **NEW** | `src/app/(platform)/list/actions.ts` | List + item server actions |
| **NEW** | `src/app/(platform)/list/column-actions.ts` | Kanban column server actions |
| **NEW** | `src/app/(platform)/list/todo/page.tsx` | Todo boards grid |
| **NEW** | `src/app/(platform)/list/todo/loading.tsx` | Grid skeleton |
| **NEW** | `src/app/(platform)/list/todo/[id]/page.tsx` | Kanban board |
| **NEW** | `src/app/(platform)/list/todo/[id]/loading.tsx` | Board skeleton |
| **NEW** | `src/app/(platform)/list/wishlist/page.tsx` | Wishlists grid |
| **NEW** | `src/app/(platform)/list/wishlist/loading.tsx` | Grid skeleton |
| **NEW** | `src/app/(platform)/list/wishlist/[id]/page.tsx` | Wishlist detail |
| **NEW** | `src/app/(platform)/list/wishlist/[id]/loading.tsx` | Detail skeleton |
| **NEW** | `src/app/(platform)/list/ideas/page.tsx` | Ideas grid |
| **NEW** | `src/app/(platform)/list/ideas/loading.tsx` | Grid skeleton |
| **NEW** | `src/app/(platform)/list/ideas/[id]/page.tsx` | Ideas detail |
| **NEW** | `src/app/(platform)/list/ideas/[id]/loading.tsx` | Detail skeleton |
| **NEW** | `src/app/(platform)/list/components/ListHub.tsx` | Hub with 3 type cards |
| **NEW** | `src/app/(platform)/list/components/TypeListGrid.tsx` | Shared grid for type pages |
| **NEW** | `src/app/(platform)/list/components/ListCard.tsx` | List/board card |
| **NEW** | `src/app/(platform)/list/components/CreateListModal.tsx` | Create dialog |
| **NEW** | `src/app/(platform)/list/components/EditListModal.tsx` | Edit dialog |
| **NEW** | `src/app/(platform)/list/components/DeleteListDialog.tsx` | Delete confirmation |
| **NEW** | `src/app/(platform)/list/components/KanbanBoard.tsx` | Full Kanban layout |
| **NEW** | `src/app/(platform)/list/components/KanbanColumn.tsx` | Single column |
| **NEW** | `src/app/(platform)/list/components/KanbanCard.tsx` | Kanban card |
| **NEW** | `src/app/(platform)/list/components/AddColumnModal.tsx` | Add column dialog |
| **NEW** | `src/app/(platform)/list/components/EditColumnModal.tsx` | Rename column dialog |
| **NEW** | `src/app/(platform)/list/components/DeleteColumnDialog.tsx` | Delete column + cascade-delete items (confirmation) |
| **NEW** | `src/app/(platform)/list/components/WishlistDetail.tsx` | Wishlist view |
| **NEW** | `src/app/(platform)/list/components/WishlistItemRow.tsx` | Wish item row |
| **NEW** | `src/app/(platform)/list/components/AddWishlistItemModal.tsx` | Add wish item |
| **NEW** | `src/app/(platform)/list/components/IdeaDetail.tsx` | Ideas view |
| **NEW** | `src/app/(platform)/list/components/IdeaItemRow.tsx` | Idea item row |
| **NEW** | `src/app/(platform)/list/components/AddItemModal.tsx` | Shared simple add |
| **NEW** | `docs/list.md` | App documentation |
| **MODIFY** | `docs/Kytbox.md` | Status + route tables |
| **MODIFY** | `docs/DATABASE_GUIDE.md` | List schema docs |

**Total: 36 new files, 10 modified files**

---

## Implementation Order

Due to the significant scope (Kanban alone is a major feature), recommended build order:

### Phase 1: Foundation (all types)
1. Migration SQL (all 3 tables + view + triggers + RLS)
2. TypeScript types (supabase.ts, database.ts, dto.ts)
3. Validation schemas (server + client)
4. DTO mappers
5. Proxy update
6. App switcher config

### Phase 2: Hub + Ideas (simplest sub-app first)
7. Hub page + loading + error
8. Ideas pages (grid + detail) + components
9. Shared server actions (list CRUD + item CRUD)
10. Shared components (TypeListGrid, ListCard, CreateListModal, etc.)

### Phase 3: Wishlist
11. Wishlist pages (grid + detail)
12. Wishlist-specific components (WishlistDetail, WishlistItemRow, AddWishlistItemModal)
13. Wishlist metadata handling in actions

### Phase 4: Todo / Kanban
14. Column server actions
15. Todo pages (grid + Kanban board)
16. Kanban components (Board, Column, Card, modals)
17. Cross-column DnD implementation
18. Default column seeding in `createList`

### Phase 5: Polish + Docs
19. Documentation (list.md, Kytbox.md, DATABASE_GUIDE.md)
20. Build verification + lint
21. Manual testing matrix

---

## Verification Plan

### Automated Tests

```bash
cmd /c npm run build
cmd /c npm run lint
```

- Zod schema tests: `listTypeSchema`, `createListSchema`, `listColumnSchema`, `wishlistMetadataSchema`
- Mapper tests: `mapListToDTO`, `mapListColumnToDTO`, `mapListItemToDTO`

### Manual Verification

| Category | Test Case | Expected |
|---|---|---|
| **Hub** | Navigate `/app` → click List | List card is **Active**, navigates to `/list` |
| **Hub** | `/list` loads | Shows 3 type cards with counts |
| **Ideas** | Create idea list | Card appears in `/list/ideas` |
| **Ideas** | Add/edit/delete ideas | CRUD works, drag reorder persists |
| **Wishlist** | Create wishlist + add item with price | Price/currency/url display correctly |
| **Wishlist** | Mark wish as purchased | Strikethrough, total updates |
| **Todo** | Create todo board | 4 default columns appear (Todo/In Progress/Review/Completed) |
| **Todo** | Drag card between columns | Card moves, `is_completed` auto-syncs on done column |
| **Todo** | Add/rename/delete column | All CRUD works, delete shows confirmation "X cards will be deleted", cascade-deletes items |
| **Todo** | Reorder columns | Horizontal drag, persists on refresh |
| **Sharing** | Toggle `is_public` | Works on all types, owner-only |
| **Auth** | Unauthenticated → `/list` | Redirects to `/login` |
| **Mobile** | 320px viewport | Hub stacks, Kanban scrolls horizontally, lists responsive |
| **A11y** | Keyboard navigation | Tab/Enter/Space on all interactive elements |
| **Error** | Force error | Smart Recovery shows `/support` link |
