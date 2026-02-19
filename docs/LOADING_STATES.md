# Loading State & Skeleton Architecture

This document tracks the technical implementation of streaming SSR and unified skeleton states across the Kytbox platform.

## Architecture: Unified Skeleton Pattern

Kytbox uses a **Unified Skeleton Architecture**. Instead of maintaining separate skeleton components for `loading.tsx`, we pass an `isLoading` prop directly to the primary Client Components.

### Benefits

- **Zero Layout Shift (CLS)**: The skeleton uses the exact same grid, spacing, and dimensions as the real UI.
- **Single Source of Truth**: UI changes made to the component automatically update the loading state.
- **Lower Maintenance**: No need to sync two separate JSX trees.

### Implementation Pattern

```tsx
// 1. The main Client Component accepts isLoading
export default function FeatureClient({ data, isLoading }: Props) {
  return (
    <div className='grid gap-4'>
      {isLoading ? <Skeleton className='h-40' /> : <RealUI data={data} />}
    </div>
  );
}

// 2. The loading.tsx file simply renders the client in loading mode
// This ensures that the skeleton perfectly matches the hydrated state.
export default function Loading() {
  return (
    <FeatureClient
      isLoading={true}
      data={[]} // Pass empty/dummy data
    />
  );
}
```

### Pixel-Perfect Matching Requirements

To achieve **Zero Layout Shift**, skeletons must exactly match the hydrated UI:

- **Responsive Sizing**: Skeletons must use the same `md:` and `lg:` classes as the real content (e.g., responsive font sizes, avatar dimensions).
- **Exact Heights**: Fixed-height elements (like buttons) must have their exact height defined in the skeleton (e.g., `h-[60px]`).
- **Standard Link Count**: Common lists (like Bio links) should show **3 skeletons** by default to prevent vertical jumping when data arrives.

## Hydration & Performance Best Practices

To prevent "Blank Flashes" or "Jank" during the transition from Server HTML to Client Interactivity, follow these rules:

### 1. Avoid `useSearchParams` for Initial Render

Components using `useSearchParams` can trigger a Suspense fallback during hydration.

- **Fix**: Identify the active tab/state in the server-side `page.tsx`.
- **Action**: Pass the initial state as a **Prop** to the client component.
- [DashboardClient.tsx](<file:///src/app/(platform)/bio/components/DashboardClient.tsx>) uses this pattern for the `activeTab`.

### 2. The Hydration Guard (`mounted` state)

Responsive components (like Recharts) often need to measure the DOM. If they render too early, they might show an empty space.

- **Pattern**: Use a `mounted` state in `useEffect` to keep the skeleton visible until the client is fully hydrated and ready to measure.
- [AnalyticsChart.tsx](file:///src/components/analytics/AnalyticsChart.tsx) implementation:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => {
  const timer = setTimeout(() => setMounted(true), 0);
  return () => clearTimeout(timer);
}, []);

const showSkeleton = isLoading || !mounted;
```

### 3. Zero-Flash Hydration (Public Pages)

On public-facing pages that are server-rendered with a theme (like the Bio profile), a hydration guard can cause a **"Double Flash"** (Server HTML -> Client Skeleton -> Real UI).

- **Rule**: If the page is server-rendered and the content is static/themed, **do not** use a hydration guard for the entire layout.
- **Action**: Render the themed HTML immediately. The client will hydrate in the background without switching back to a skeleton.
- [ProfileView.tsx](file:///src/app/[username]/components/ProfileView.tsx) follows this pattern.

### 3. Disable Growth Animations

Default animations (e.g., bar charts growing from bottom) can look like "blank space" for the first 1.5 seconds.

- **Action**: Set `isAnimationActive={false}` on charts to enable instant data appearance as soon as the skeleton disappears.

## Reusable Components

### `StatsCard`

The [StatsCard](<file:///src/app/(platform)/bio/components/StatsCard.tsx>) is the primary stat driver. It supports:

- `isLoading`: Shows internal skeleton for label and value.
- `hideSecondaryIcon`: Removes large decorative icons for more compact dashboards (like Analytics).
- `variant`: Supports thematic coloring (primary, blue, green, orange).

## Best Practices Checklist

1. **Match Container Hierarchy**: Ensure `loading.tsx` uses the same `max-w-*` and `px-*` wrappers as the main `page.tsx`.
2. **Prop-Driven Skeletons**: Pass `isLoading` down the tree. Avoid `if (loading) return <Skeleton />` at the top level to keep the layout shell intact.
3. **No Spinning Icons**: Use defined skeletons that hint at the final component structure.
4. **Instant Interactivity**: Disable entrance animations on data-heavy elements to improve perceived speed.
