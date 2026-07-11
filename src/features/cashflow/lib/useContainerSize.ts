import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Measures a container element's dimensions via ResizeObserver.
 * Returns [ref, width, height] — width/height are 0 until measured.
 * Use this instead of Recharts' ResponsiveContainer to avoid
 * the -1px warning during React 19 concurrent hydration.
 */
export function useContainerSize(): [
  React.RefCallback<HTMLDivElement>,
  number,
  number,
] {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setSize({ width: rect.width, height: rect.height });
    }

    observerRef.current = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize((prev) =>
          prev.width === width && prev.height === height
            ? prev
            : { width, height },
        );
      }
    });
    observerRef.current.observe(node);
  }, []);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return [ref, size.width, size.height];
}
