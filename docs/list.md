# Kytbox List App

The List app is the third core module in Kytbox (following Bio and Cashflow). It provides a centralized hub for managing three types of lists:
1. **Todo**: Kanban-style project boards.
2. **Wishlist**: Price-tracking wishlists.
3. **Ideas**: Simple, frictionless brain dumps.

This app is primarily for private use but supports simple public sharing via an `is_public` toggle.

---

## 🚀 Core Features

### 1. Hub (`/list`)
The entry point dashboard. It displays 3 cards for each sub-app (Todo, Wishlist, Ideas) and shows the total count of lists/boards the user has created in each category.

### 2. Todo (Kanban Boards) — `/list/todo`
A Trello-style project management board for tracking tasks across customizable stages.
- **Boards**: Collections of columns and cards.
- **Columns**: Vertical stages (e.g., Todo, In Progress, Review, Completed). 
  - **Done Column**: A special column marked with a green accent. Cards dropped into this column automatically have their `is_completed` flag set to `true`.
  - **Cascade Delete**: Deleting a column also deletes all cards within it.
- **Cards**: Tasks that can be dragged vertically within a column or horizontally across columns.

### 3. Wishlist — `/list/wishlist`
A list designed for tracking items you want to purchase.
- **Price Tracking**: Each item supports an optional price and currency.
- **External Links**: Items can hold a `purchase_url` to link directly to the store.
- **Summary**: Displays the total remaining cost of all unpurchased items at the bottom.

### 4. Ideas (Brain Dump) — `/list/ideas`
A lightweight, minimal list for capturing fleeting thoughts.
- No complex metadata (no prices, no columns).
- Just a title and an optional description.
- Supports marking ideas as "noted" (completed) and drag-and-drop reordering.

---

## 🏗️ Technical Architecture

### Database Schema
The List app is powered by a unified schema to simplify access control and sharing.

1. **`lists`**: The parent table for all types. Contains the list title, type (`todo`, `wishlist`, `idea`), and `is_public` toggle.
2. **`list_columns`**: Used *only* for the `todo` type. Represents the stages in a Kanban board.
3. **`list_items`**: The child items. Contains the text and a flexible `metadata` JSONB column (used for Wishlist prices/URLs). If the parent list is a `todo`, it maps to a `column_id`.

### Access Control (RLS)
The app uses Supabase Row Level Security (RLS) matching the Cashflow pattern:
- **Owner CRUD**: The user who created the list (via `user_id`) has full read/write/delete permissions.
- **Public Read**: If a list's `is_public` flag is `true`, anyone can read it (guests).

### Frontend Routing
All routes are protected by the Edge Proxy middleware (except public views in the future).
- `/list`: Hub
- `/list/todo` & `/list/todo/[id]`: Kanban grids and boards
- `/list/wishlist` & `/list/wishlist/[id]`: Wishlist grids and details
- `/list/ideas` & `/list/ideas/[id]`: Idea grids and details

### Drag and Drop
The app uses `@dnd-kit` for drag-and-drop interactions:
- **Vertical Reordering**: Used in Wishlists and Ideas (via `useSortable`).
- **Cross-Column Dragging**: Used in Kanban boards to move cards between columns.

---

## 🔒 API Surface (Server Actions)

The app exclusively uses Next.js Server Actions for database mutations.

### List Actions (`actions.ts`)
- `createList`: Creates a list. If type is `todo`, automatically seeds 4 default columns (Todo, In Progress, Review, Completed).
- `updateList` / `deleteList`: Basic CRUD.
- `toggleListPublic`: Simple sharing.

### Item Actions (`actions.ts`)
- `addItem`: Adds an item. Parses metadata for wishlists.
- `updateItem` / `deleteItem` / `toggleItem`: Basic CRUD.
- `moveItem`: Kanban-specific action to move a card between columns and auto-sync its `is_completed` state based on the destination column.
- `reorderItems`: Batch updates `sort_order` for vertical dragging.

### Column Actions (`column-actions.ts`)
- `addColumn` / `updateColumn` / `deleteColumn`: Kanban column CRUD.
- `toggleDoneColumn`: Marks a column as the "done" column and batch-updates all its items to `is_completed = true`.
