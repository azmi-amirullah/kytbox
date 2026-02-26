# Deep Dive: Unified Profile Architecture

This document serves as the definitive reference for the **Profile View Architecture** in Kytbox Bio. It outlines the transition from a "Duplicate Preview" model to a "True 1:1 Parity" system.

## 1. Executive Summary

Historically, the live phone preview used a parallel set of styles (`isPreview` flags) to mimic a mobile screen on a desktop monitor. This led to "Drift"—where the preview looked shrunken or slightly different from the actual public page.

In February 2026, we refactored the system into a **True Unified Component Architecture**.

- **100% Component Parity**: The Dashboard uses the exact same `ProfileView` component as the public page.
- **Scaling vs. Logic**: We removed all conditional mobile-vs-preview logic. Instead, we use **85% CSS scaling** and **mobile-first breakpoints** to handle the rendering.

## 2. Core Architectural Decisions

### 2.1 The "Parity Over Logic" Rule

We eliminated all `isPreview` and `variant` props from `ProfileHeader`, `ProfileLinks`, and `SocialGrid`.

| Feature      | Old Method                                                 | New Method                                                                                                   |
| :----------- | :--------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Styling**  | Conditional Tailwind (e.g., `isPreview ? 'w-20' : 'w-32'`) | Mobile-first CSS + `md:` overrides                                                                           |
| **Scaling**  | Font-size reduction logic                                  | `transform: scale(0.85)` in [PhonePreview.tsx](<file:///src/app/(platform)/bio/components/PhonePreview.tsx>) |
| **Rounding** | Hardcoded `rounded-2xl`                                    | Concentric geometry (Parent radius - Border width)                                                           |

### 2.2 CSS Viewport Scaling

To fit a 390px (iPhone 14) screen onto a desktop dashboard without triggering `md:` (768px) media queries erroneously, the `PhonePreview` component:

1. Wraps the content in a fixed `width: 390px`.
2. Applies a `scale(0.85)` transform.
3. Automatically calculates negative margins to keep the scaled element visually centered.

## 3. Unified Skeleton Architecture

We moved away from hardcoded server-side skeletons in favor of a **Prop-Driven Unified System**.

### 3.1 Principles

- **Matched Containers**: The `loading.tsx` file for both the platform and public profile now renders the **real** client components with `isLoading={true}`.
- **Pixel-Perfect Skeletons**:
  - [ProfileLinks.tsx](file:///src/app/[username]/components/ProfileLinks.tsx) skeletons use `h-[60px]` to match the exact height of a LinkButton.
  - [ProfileHeader.tsx](file:///src/app/[username]/components/ProfileHeader.tsx) skeletons use responsive height classes (e.g., `md:h-10`) to match typography drift.

### 3.2 Zero-Flash Hydration (Optimization)

To prevent the "Double Loading" flash (Server Shell -> Client Skeleton -> Real UI), we implemented **Single-Source Handover**:

1. **Public Profile**: Renders themed HTML on the server. The client hydrates directly into the real UI without showing a temporary skeleton.
2. **Dashboard Preview**: Uses the same `isLoading` state passed from the Parent.

## 4. Component Deep Dive

### [ProfileView](file:///src/app/[username]/components/ProfileView.tsx)

The orchestrator. It is responsible for the themed container, branding footer, and layout structure. It is the only component rendered in `loading.tsx` for the public page.

### [SocialGrid](<file:///src/app/(platform)/bio/components/SocialGrid.tsx>)

Handles platform auto-detection. It now supports a premium loading state with circular icon skeletons to maintain row geometry.

## 5. Dynamic Theme Engine

In February 2026, we introduced a high-performance **Custom Theme System** that allows users to define their own visual branding while maintaining the "Parity" and "Performance" goals of the project.

### 5.1 CSS Variable Injection

To keep the components decoupled from specific hex values, we use **CSS Variables** (`--custom-bg`, `--custom-text-primary`, etc.).

- **Centralized Logic**: [ProfileView.tsx](file:///src/app/[username]/components/ProfileView.tsx) acts as the bridge, injecting these variables via a `style` attribute on the root container.
- **Tailwind Integration**: Components use standard Tailwind classes that reference these variables (e.g., `text-[var(--custom-text-primary)]`), allowing us to use Tailwind's utilities (like `opacity-80` or `hover:`) alongside custom colors.

### 5.2 Performance: The Debounce Pattern

To prevent UI lag in the Dashboard preview while users are typing Hex codes:

1. **Local State Snapshot**: [AppearanceEditor.tsx](<file:///src/app/(platform)/bio/components/AppearanceEditor.tsx>) maintains a local synchronous state for the input boxes.
2. **Debounced Propagation**: A `useEffect` hook waits for **300ms** of inactivity before updating the shared `previewState`. This ensures a buttery-smooth typing experience on mobile and desktop alike.

### 5.3 Technical Resilience: Hex Normalization

To ensure the CSS Variables never "break" during typing, we implemented an **Auto-Padding Normalizer** in [theme.utils.ts](file:///src/lib/theme/theme.utils.ts):

- **Predictive Padding**: Incomplete hex codes like `#FF` are automatically treated as `#FF0000` (Red) in the CSS variables.
- **Strict Validation**: If invalid characters (e.g., `X`, `G`) are detected, the system safely defaults to `#000000` (Black) to match native browser color-picker behavior.

## 6. Summary of Achievements

✅ **Zero Layout Shift (CLS)**: Skeletons and UI are geographically identical.
✅ **Mobile-True Preview**: Dashboard preview is now an authentic representation of the public page.
✅ **Unified Codebase**: 40% reduction in conditional rendering logic in bio components.
✅ **High-Performance Personalization**: Fluid, real-time custom theme engine with zero-lag inputs.

## 7. Nested Directory Architecture

In late February 2026, we introduced Nested Folders for the Bio profile, architected specifically to preserve the Unified Profile ideals (Zero CLS and strict 1:1 parity).

### 7.1 Single-Table Design

Instead of creating a separate `folders` table, folders exist as rows within the existing `links` table.

- **Columns Added**: `is_folder` (boolean) and `parent_id` (uuid, self-referencing).
- **Integrity**: `parent_id` is bound by a PostgreSQL `ON DELETE CASCADE` constraint. Deleting a folder guarantees the instant deletion of all nested links, preventing orphan rows without requiring application-level cleanup logic.
- **Performance**: This allows the frontend to fetch the entire directory structure in a single, simple Supabase query without `JOIN` operations.

### 7.2 The "Drill-Down" Dashboard UI

To prevent the chaotic UX of dragging and dropping items into deep, expanding trees on mobile screens, the Creator Dashboard uses a **Drill-Down** architecture.

- Clicking a folder replaces the active root view with the folder's view.
- Drag-and-drop ordering is strictly maintained within the isolated view of that specific folder.
- A "Move to Folder" Modal handles cross-directory transport, bypassing complex multi-touch gestures.

### 7.3 Public View Slide Transitions

Expanding folders via Accordions pushes content down, causing massive Cumulative Layout Shift (CLS) penalties and breaking the premium feel.

- **Framer Motion**: The `ProfileLinks` component uses `<AnimatePresence>` to render iOS-style sliding transitions.
- When navigating into a folder, the root links slide out to the left, and the folder contents slide in from the right, maintaining a static viewport height and a native-app feel.

### 7.4 Technical Debt & Future Optimizations (Code Review Notes)

As identified by the architectural review (`@[/code-reviewer]`), two areas require monitoring as the product scales:

1.  **Analytics Ambiguity**: Folders are currently recorded in the `links` table. Analytics queries (e.g., `get_analytics_chart_data`) must explicitly filter out `is_folder = true` to prevent false "clicks" being registered when a user simply opens a folder.
2.  **Schema Recursion**: The UI strictly enforces a 1-level limit (folders cannot contain folders). However, the underlying Postgres schema technically allows infinite recursion. If the API is ever exposed publicly, a Postgres trigger should be implemented to reject `parent_id` updates where the target parent is itself a child.

## 8. Caching & Dynamic IO (Next.js 16 Modern)

In late February 2026, we revolutionized the data layer by enabling `cacheComponents: true` and adopting the most cutting-edge Next.js 16 caching APIs.

### 8.1 The `'use cache'` Directive

We implemented a centralized, high-performance data cache in [data-cache.ts](file:///src/lib/data-cache.ts) using the modern `'use cache'` directive.

- **Granular Tagging**: We use `cacheTag(profile-${username})` to ensure that cache invalidation is laser-targeted to the specific user being updated, preventing global cache thrashing.
- **Static First**: By using `createStaticClient()`, we decouple data fetching from request-level cookies, allowing public profiles to be served with the performance of static assets while maintaining a dynamic backend.

### 8.2 Instant Revalidation with `updateTag`

To provide "Read-Your-Own-Writes" semantics without the latency of traditional revalidation, all mutation actions now use the **Server Action-only** `updateTag` API:

```typescript
updateTag(`profile-${username}`);
```

Unlike `revalidateTag`, which can be lazy, `updateTag` immediately expires the cache in the current request's context, ensuring the user sees their changes the moment the page refreshes.

### 8.3 Handling Dynamic IO with `connection()`

With `cacheComponents` enabled, Next.js 16 enforces strict rules on dynamic IO (cookies, headers, non-deterministic values). To maintain consistency in authenticated or dynamic segments without breaking the build, we use the `connection()` API:

- **Usage**: Awaited at the top of layouts or pages (e.g., [PlatformLayout](<file:///src/app/(platform)/layout.tsx>), [CurrentYear](file:///src/components/ui/current-year.tsx)).
- **Purpose**: It signals to the Next.js compiler that a specific component or layout is intentionally dynamic, allowing it to bypass the static-rendering requirement of `cacheComponents` mode while still optimizing the rest of the tree.
