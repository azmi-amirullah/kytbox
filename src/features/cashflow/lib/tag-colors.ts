import type { CashflowTagDTO } from '@/types/dto'

export interface TagColorStyle {
  bg: string
  text: string
  border: string
  activeBg: string
  activeText: string
  activeBorder: string
}

// 12 maximally distinct, high-contrast, non-overlapping color hues with natural deeper-tint active states
export const TAG_COLORS: Array<TagColorStyle> = [
  {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/40 dark:border-emerald-400/50',
    activeBg: 'bg-emerald-500/25 dark:bg-emerald-500/30',
    activeText: 'text-emerald-800 dark:text-emerald-200 font-semibold',
    activeBorder: 'border-emerald-600/70 dark:border-emerald-400/80',
  }, // 1: Green
  {
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-500/40 dark:border-violet-400/50',
    activeBg: 'bg-violet-500/25 dark:bg-violet-500/30',
    activeText: 'text-violet-800 dark:text-violet-200 font-semibold',
    activeBorder: 'border-violet-600/70 dark:border-violet-400/80',
  }, // 2: Purple
  {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/40 dark:border-amber-400/50',
    activeBg: 'bg-amber-500/25 dark:bg-amber-500/30',
    activeText: 'text-amber-800 dark:text-amber-200 font-semibold',
    activeBorder: 'border-amber-600/70 dark:border-amber-400/80',
  }, // 3: Warm Gold
  {
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500/40 dark:border-sky-400/50',
    activeBg: 'bg-sky-500/25 dark:bg-sky-500/30',
    activeText: 'text-sky-800 dark:text-sky-200 font-semibold',
    activeBorder: 'border-sky-600/70 dark:border-sky-400/80',
  }, // 4: Light Blue
  {
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/40 dark:border-rose-400/50',
    activeBg: 'bg-rose-500/25 dark:bg-rose-500/30',
    activeText: 'text-rose-800 dark:text-rose-200 font-semibold',
    activeBorder: 'border-rose-600/70 dark:border-rose-400/80',
  }, // 5: Crimson Red
  {
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-500/40 dark:border-teal-400/50',
    activeBg: 'bg-teal-500/25 dark:bg-teal-500/30',
    activeText: 'text-teal-800 dark:text-teal-200 font-semibold',
    activeBorder: 'border-teal-600/70 dark:border-teal-400/80',
  }, // 6: Seafoam
  {
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500/40 dark:border-orange-400/50',
    activeBg: 'bg-orange-500/25 dark:bg-orange-500/30',
    activeText: 'text-orange-800 dark:text-orange-200 font-semibold',
    activeBorder: 'border-orange-600/70 dark:border-orange-400/80',
  }, // 7: Tangerine
  {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/40 dark:border-indigo-400/50',
    activeBg: 'bg-indigo-500/25 dark:bg-indigo-500/30',
    activeText: 'text-indigo-800 dark:text-indigo-200 font-semibold',
    activeBorder: 'border-indigo-600/70 dark:border-indigo-400/80',
  }, // 8: Deep Navy
  {
    bg: 'bg-lime-500/10 dark:bg-lime-500/15',
    text: 'text-lime-800 dark:text-lime-300',
    border: 'border-lime-500/40 dark:border-lime-400/50',
    activeBg: 'bg-lime-500/25 dark:bg-lime-500/30',
    activeText: 'text-lime-900 dark:text-lime-200 font-semibold',
    activeBorder: 'border-lime-600/70 dark:border-lime-400/80',
  }, // 9: Yellow-Green
  {
    bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/15',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    border: 'border-fuchsia-500/40 dark:border-fuchsia-400/50',
    activeBg: 'bg-fuchsia-500/25 dark:bg-fuchsia-500/30',
    activeText: 'text-fuchsia-800 dark:text-fuchsia-200 font-semibold',
    activeBorder: 'border-fuchsia-600/70 dark:border-fuchsia-400/80',
  }, // 10: Magenta
  {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-500/40 dark:border-cyan-400/50',
    activeBg: 'bg-cyan-500/25 dark:bg-cyan-500/30',
    activeText: 'text-cyan-800 dark:text-cyan-200 font-semibold',
    activeBorder: 'border-cyan-600/70 dark:border-cyan-400/80',
  }, // 11: Aqua
  {
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/15',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-500/40 dark:border-yellow-400/50',
    activeBg: 'bg-yellow-500/25 dark:bg-yellow-500/30',
    activeText: 'text-yellow-900 dark:text-yellow-200 font-semibold',
    activeBorder: 'border-yellow-600/70 dark:border-yellow-400/80',
  }, // 12: Sun Yellow
]

/**
 * Slot-filling color allocation algorithm:
 * 1. Count usage of each color index (0 to 11).
 * 2. Find minimum usage count across all 12 slots.
 * 3. Return the lowest index (0 to 11) with minimum usage count.
 */
export function getNextAvailableColorIndex(
  existingTags: Array<{ color_index: number }>,
): number {
  const counts = new Array(TAG_COLORS.length).fill(0)
  for (const t of existingTags) {
    if (typeof t.color_index === 'number' && t.color_index >= 0) {
      const slot = t.color_index % TAG_COLORS.length
      counts[slot]++
    }
  }

  let minCount = Infinity
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] < minCount) {
      minCount = counts[i]
    }
  }

  for (let i = 0; i < counts.length; i++) {
    if (counts[i] === minCount) {
      return i
    }
  }

  return 0
}

/**
 * Deterministic Murmur3-mixed DJB2a hash fallback for standalone tags.
 */
export function getTagColorIndex(tag: string): number {
  let h = 5381
  for (let i = 0; i < tag.length; i++) {
    h = (Math.imul(h, 33) ^ tag.charCodeAt(i)) >>> 0
  }
  h = (h ^ (tag.length * 2654435761)) >>> 0
  h = (Math.imul(h ^ (h >>> 15), 0x85ebca6b)) >>> 0
  h = (Math.imul(h ^ (h >>> 13), 0xc2b2ae35)) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) % TAG_COLORS.length
}

export function resolveTagColor(
  tagName: string,
  bookTags?: CashflowTagDTO[],
): TagColorStyle {
  if (bookTags && bookTags.length > 0) {
    const match = bookTags.find(
      (t) => t.name.toLowerCase() === tagName.toLowerCase(),
    )
    if (match && typeof match.color_index === 'number') {
      return TAG_COLORS[match.color_index % TAG_COLORS.length]
    }
  }
  return TAG_COLORS[getTagColorIndex(tagName)]
}

export function getTagColor(tag: string): TagColorStyle {
  const index = getTagColorIndex(tag)
  return TAG_COLORS[index]
}

export function getBookTagColor(tag: string): TagColorStyle {
  return getTagColor(tag)
}
