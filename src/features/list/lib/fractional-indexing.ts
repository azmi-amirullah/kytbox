/**
 * Fractional Indexing Engine
 * Allows inserting or moving items between any two positions with strictly 1 database update.
 * Prevents 50-row sequential updates and race condition lockups.
 */

export const DEFAULT_SORT_GAP = 1000;

export function calculateFractionalSortOrder(
  prevOrder: number | null | undefined,
  nextOrder: number | null | undefined,
): number {
  const hasPrev = typeof prevOrder === 'number' && !Number.isNaN(prevOrder);
  const hasNext = typeof nextOrder === 'number' && !Number.isNaN(nextOrder);

  // Case 1: Empty column or only item
  if (!hasPrev && !hasNext) {
    return DEFAULT_SORT_GAP;
  }

  // Case 2: Inserting at top of column before first item
  if (!hasPrev && hasNext) {
    return nextOrder > 0 ? nextOrder / 2 : nextOrder - DEFAULT_SORT_GAP;
  }

  // Case 3: Inserting at bottom of column after last item
  if (hasPrev && !hasNext) {
    return prevOrder + DEFAULT_SORT_GAP;
  }

  // Case 4: Inserting between two existing items
  if (hasPrev && hasNext) {
    // If somehow prev >= next due to identical or corrupted past indices, spread them
    if (prevOrder >= nextOrder) {
      return prevOrder + 0.5;
    }
    return (prevOrder + nextOrder) / 2;
  }

  return DEFAULT_SORT_GAP;
}
