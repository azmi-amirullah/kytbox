# Loading State & Centralized Loader Architecture

This document tracks the technical implementation of streaming SSR, route transitions, and centralized loader states across the Kytbox platform.

## 🚀 2026 Loading Manifesto (Strategic Conventions)

As of Next.js 16, Kytbox follows a **Clean, Zero-Maintenance Strategy** to balance speed with visual clarity.

1. **Centralized Brand Loader**: All loading states use the centralized [`src/components/ui/loader.tsx`](../src/components/ui/loader.tsx), featuring a precision vector orbital ring and Swiss Modernist geometric anchor with WCAG 2.2 accessibility compliance.
2. **Elimination of Mock Skeletons**: Complex pixel-mocking skeletons have been purged in favor of clean container loaders. This eliminates UI drift and maintenance debt when component layouts change.
3. **Route Coverage**: Dynamic route segments use `loading.tsx` to render `<Loader />` or `<Loader fullScreen />`, preventing blank flashes during server streaming.
4. **Card / Inline Loading**: Dynamic imports (like charts) and asynchronous widgets use `<Loader className="min-h-90 py-12 bg-card border rounded-xl" text="Loading..." />` or compact size variants (`size="sm" | "md" | "lg"`) to preserve container height without layout shifts (CLS).

## 🧭 Route Coverage Matrix

| Route Area                      | Strategy            | Status            | Implementation                                                         |
| :------------------------------ | :------------------ | :---------------- | :--------------------------------------------------------------------- |
| **Root Shell**                  | Silent Boundary     | `fallback={null}` | `NextTopLoader` is the primary top-bar indicator.                      |
| **(platform) / Bio**            | Centralized Loader  | ✅ Active         | Route-level `<Loader />` during streaming.                             |
| **(platform) / Analytics**      | Centralized Loader  | ✅ Active         | Card-level `<Loader />` inside `AnalyticsChart` and `AnalyticsClient`. |
| **(platform) / Cashflow (all)** | Centralized Loader  | ✅ Active         | `<Loader className="min-h-90 ..." />` on dynamic `CashflowCharts`.     |
| **(platform) / List (all)**     | Centralized Loader  | ✅ Active         | Clean list loading state without fragile mock cards.                   |
| **(platform) / App & Overview** | Centralized Loader  | ✅ Active         | Suspense boundaries with card-level `<Loader />`.                      |
| **(platform) / Support (all)**  | Centralized Loader  | ✅ Active         | Form card `<Loader />` while fetching ticket/user state.               |
| **(admin) / Admin Queue**       | Centralized Loader  | ✅ Active         | Branded route `<Loader />`.                                            |
| **(auth) / Login, Signup**      | Centralized Loader  | ✅ Active         | Card `<Loader text="Loading login..." />` for client boundaries.       |
| **Onboarding / Pw Update**      | Fullscreen Loader   | ✅ Active         | `<Loader fullScreen />` for credential transitions.                    |

## Component Usage: `Loader`

The [`Loader`](../src/components/ui/loader.tsx) component supports:

- `size?: 'sm' | 'md' | 'lg'`: Sizing tier for inline (`sm` - 20px), card widget (`md` - 36px), or page (`lg` - 48px).
- `fullScreen?: boolean`: Renders a fixed backdrop blur overlay with `lg` size (used during auth/password redirects).
- `text?: string`: Optional custom label rendered in Geist Mono uppercase (defaults to `'Loading...'`).
- `variant?: 'brand' | 'minimal'`: Whether to show the central brand geometric anchor (`'brand'`) or a minimalist ring (`'minimal'`).
- `className?: string`: Standard Tailwind classes to control container height, padding, or card background.

### Examples

```tsx
import { Loader } from '@/components/ui/loader';

// 1. Route loading screen (loading.tsx)
export default function Loading() {
  return <Loader />;
}

// 2. Fullscreen overlay with custom text
<Loader fullScreen text="Securing account..." />

// 3. Dynamic card loading fallback
<Loader className="min-h-90 py-12 bg-card border rounded-xl" text="Loading overview..." />

// 4. Inline / Compact Button or Table Row
<Loader size="sm" text="" className="py-2" />
```

---

_Last Updated: August 15, 2026_
