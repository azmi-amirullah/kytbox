# Loading State Implementation Status

This document tracks the implementation of Streaming SSR loading states (`loading.tsx`) across the application.

> **Why this matters:** `loading.tsx` allows the server to send an instant "App Shell" while fetching data in the background. This prevents the "blank screen" effect and improves perceived performance.

## Route Coverage

| Route              | Page Type          | Status         | File Location                             | Notes                                                    |
| ------------------ | ------------------ | -------------- | ----------------------------------------- | -------------------------------------------------------- |
| `/`                | Landing Page       | ✅ Implemented | `src/app/(marketing)/loading.tsx`         | Route group isolates marketing pages from platform shell |
| `/app`             | Dashboard Home     | ✅ Implemented | `src/app/(platform)/app/loading.tsx`      | Shows app grid skeleton                                  |
| `/bio`             | Bio Link Editor    | ✅ Implemented | `src/app/(platform)/bio/loading.tsx`      | Mimics split-pane layout                                 |
| `/cashflow`        | Cashflow Dashboard | ✅ Implemented | `src/app/(platform)/cashflow/loading.tsx` | Mimics lists and stats                                   |
| `/cashflow/[id]`   | Cashflow Detail    | ✅ Implemented | `src/app/cashflow/[id]/loading.tsx`       | Public/shared cashflow view (outside platform group)     |
| `/settings`        | User Settings      | ✅ Implemented | `src/app/(platform)/settings/loading.tsx` | Uses `PlatformHeaderSkeleton`                            |
| `/[username]`      | Public Profile     | ✅ Implemented | `src/app/[username]/loading.tsx`          | **Critical**: Public facing page. Uses neutral skeleton. |
| `/login`           | Auth               | ❌ Not Needed  | -                                         | Static / Client-side form mostly                         |
| `/signup`          | Auth               | ❌ Not Needed  | -                                         | Static / Client-side form mostly                         |
| `/forgot-password` | Auth               | ❌ Not Needed  | -                                         | Static / Client-side form mostly                         |

## Reusable Skeleton Components

### `PlatformHeaderSkeleton`

Location: `src/components/skeletons/platform-header-skeleton.tsx`

A reusable skeleton for the platform header (logo, theme toggle, user nav). Used across multiple platform loading states to ensure consistency and reduce duplication.

```tsx
import { PlatformHeaderSkeleton } from '@/components/skeletons/platform-header-skeleton';

export default function Loading() {
  return (
    <>
      <PlatformHeaderSkeleton />
      {/* Page-specific skeleton content */}
    </>
  );
}
```

## Best Practices

When adding new pages, follow these rules:

1. **Always add `loading.tsx`** if the page fetches data (e.g., `await supabase...`).
2. **Match the Layout**: The skeleton should look _exactly_ like the final page to avoid Layout Shift (CLS).
3. **Use shadcn/ui Skeleton**: Import `Skeleton` from `@/components/ui/skeleton`.
4. **No Spinners**: Avoid full-screen spinners. Use skeletons that hint at the content structure.
5. **Reuse Common Components**: Use `PlatformHeaderSkeleton` for platform pages to maintain consistency.

## How to Check

You can verify if a page has a loading state by checking for the existence of `loading.tsx` in its directory.

```bash
# Check for all loading.tsx files
fd loading.tsx src/app
```
