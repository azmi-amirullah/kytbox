import type { ListLabelDTO } from '@/types/dto';

export interface LabelColorStyle {
  bg: string;
  text: string;
  border: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  dot: string;
}

// 12 maximally distinct, high-contrast, non-overlapping color hues with dark-mode harmony
export const LABEL_COLORS: Array<LabelColorStyle> = [
  {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/40 dark:border-emerald-400/50',
    activeBg: 'bg-emerald-500/25 dark:bg-emerald-500/30',
    activeText: 'text-emerald-800 dark:text-emerald-200 font-semibold',
    activeBorder: 'border-emerald-600/70 dark:border-emerald-400/80',
    dot: 'bg-emerald-500',
  }, // 0: Emerald Green
  {
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-500/40 dark:border-violet-400/50',
    activeBg: 'bg-violet-500/25 dark:bg-violet-500/30',
    activeText: 'text-violet-800 dark:text-violet-200 font-semibold',
    activeBorder: 'border-violet-600/70 dark:border-violet-400/80',
    dot: 'bg-violet-500',
  }, // 1: Violet / Purple
  {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/40 dark:border-amber-400/50',
    activeBg: 'bg-amber-500/25 dark:bg-amber-500/30',
    activeText: 'text-amber-800 dark:text-amber-200 font-semibold',
    activeBorder: 'border-amber-600/70 dark:border-amber-400/80',
    dot: 'bg-amber-500',
  }, // 2: Warm Gold / Amber
  {
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500/40 dark:border-sky-400/50',
    activeBg: 'bg-sky-500/25 dark:bg-sky-500/30',
    activeText: 'text-sky-800 dark:text-sky-200 font-semibold',
    activeBorder: 'border-sky-600/70 dark:border-sky-400/80',
    dot: 'bg-sky-500',
  }, // 3: Sky Blue
  {
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/40 dark:border-rose-400/50',
    activeBg: 'bg-rose-500/25 dark:bg-rose-500/30',
    activeText: 'text-rose-800 dark:text-rose-200 font-semibold',
    activeBorder: 'border-rose-600/70 dark:border-rose-400/80',
    dot: 'bg-rose-500',
  }, // 4: Rose / Crimson
  {
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-500/40 dark:border-teal-400/50',
    activeBg: 'bg-teal-500/25 dark:bg-teal-500/30',
    activeText: 'text-teal-800 dark:text-teal-200 font-semibold',
    activeBorder: 'border-teal-600/70 dark:border-teal-400/80',
    dot: 'bg-teal-500',
  }, // 5: Teal / Seafoam
  {
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500/40 dark:border-orange-400/50',
    activeBg: 'bg-orange-500/25 dark:bg-orange-500/30',
    activeText: 'text-orange-800 dark:text-orange-200 font-semibold',
    activeBorder: 'border-orange-600/70 dark:border-orange-400/80',
    dot: 'bg-orange-500',
  }, // 6: Orange / Tangerine
  {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/40 dark:border-indigo-400/50',
    activeBg: 'bg-indigo-500/25 dark:bg-indigo-500/30',
    activeText: 'text-indigo-800 dark:text-indigo-200 font-semibold',
    activeBorder: 'border-indigo-600/70 dark:border-indigo-400/80',
    dot: 'bg-indigo-500',
  }, // 7: Deep Indigo
  {
    bg: 'bg-lime-500/10 dark:bg-lime-500/15',
    text: 'text-lime-800 dark:text-lime-300',
    border: 'border-lime-500/40 dark:border-lime-400/50',
    activeBg: 'bg-lime-500/25 dark:bg-lime-500/30',
    activeText: 'text-lime-900 dark:text-lime-200 font-semibold',
    activeBorder: 'border-lime-600/70 dark:border-lime-400/80',
    dot: 'bg-lime-500',
  }, // 8: Lime / Yellow-Green
  {
    bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/15',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    border: 'border-fuchsia-500/40 dark:border-fuchsia-400/50',
    activeBg: 'bg-fuchsia-500/25 dark:bg-fuchsia-500/30',
    activeText: 'text-fuchsia-800 dark:text-fuchsia-200 font-semibold',
    activeBorder: 'border-fuchsia-600/70 dark:border-fuchsia-400/80',
    dot: 'bg-fuchsia-500',
  }, // 9: Fuchsia / Magenta
  {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-500/40 dark:border-cyan-400/50',
    activeBg: 'bg-cyan-500/25 dark:bg-cyan-500/30',
    activeText: 'text-cyan-800 dark:text-cyan-200 font-semibold',
    activeBorder: 'border-cyan-600/70 dark:border-cyan-400/80',
    dot: 'bg-cyan-500',
  }, // 10: Cyan / Aqua
  {
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/15',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-500/40 dark:border-yellow-400/50',
    activeBg: 'bg-yellow-500/25 dark:bg-yellow-500/30',
    activeText: 'text-yellow-900 dark:text-yellow-200 font-semibold',
    activeBorder: 'border-yellow-600/70 dark:border-yellow-400/80',
    dot: 'bg-yellow-500',
  }, // 11: Sun Yellow
];

/**
 * Slot-filling color allocation algorithm:
 * 1. Count usage of each color index (0 to 11).
 * 2. Find minimum usage count across all 12 slots.
 * 3. Return the lowest index (0 to 11) with minimum usage count.
 */
export function getNextAvailableLabelColorIndex(
  existingLabels: Array<{ color_index: number }>,
): number {
  const counts = new Array(LABEL_COLORS.length).fill(0);
  for (const l of existingLabels) {
    if (typeof l.color_index === 'number' && l.color_index >= 0) {
      const slot = l.color_index % LABEL_COLORS.length;
      counts[slot]++;
    }
  }

  let minCount = Infinity;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] < minCount) {
      minCount = counts[i];
    }
  }

  for (let i = 0; i < counts.length; i++) {
    if (counts[i] === minCount) {
      return i;
    }
  }

  return 0;
}

/**
 * Deterministic Murmur3-mixed DJB2a hash fallback for standalone label strings without DB record.
 */
export function getLabelColorIndex(name: string): number {
  let h = 5381;
  const clean = name.trim().toLowerCase();
  for (let i = 0; i < clean.length; i++) {
    h = (Math.imul(h, 33) ^ clean.charCodeAt(i)) >>> 0;
  }
  h = (h ^ (clean.length * 2654435761)) >>> 0;
  h = (Math.imul(h ^ (h >>> 15), 0x85ebca6b)) >>> 0;
  h = (Math.imul(h ^ (h >>> 13), 0xc2b2ae35)) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) % LABEL_COLORS.length;
}

export function getLabelColor(colorIndex: number): LabelColorStyle {
  const safeIndex = Math.abs(colorIndex) % LABEL_COLORS.length;
  return LABEL_COLORS[safeIndex];
}

export const LABEL_COLOR_PALETTES = LABEL_COLORS;

export function resolveLabelColor(
  labelOrIndex: string | number | null | undefined,
  boardLabels?: ListLabelDTO[],
): LabelColorStyle {
  if (typeof labelOrIndex === 'number') {
    if (Number.isNaN(labelOrIndex)) return LABEL_COLORS[0];
    return getLabelColor(labelOrIndex);
  }
  if (!labelOrIndex || typeof labelOrIndex !== 'string') {
    return LABEL_COLORS[0];
  }
  if (boardLabels && boardLabels.length > 0) {
    const match = boardLabels.find(
      (l) => l.name.toLowerCase() === labelOrIndex.trim().toLowerCase(),
    );
    if (match && typeof match.color_index === 'number') {
      return getLabelColor(match.color_index);
    }
  }
  return getLabelColor(getLabelColorIndex(labelOrIndex));
}
