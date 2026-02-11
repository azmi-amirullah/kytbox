export const HIGH_URGENCY_THRESHOLD = 20;
export const MEDIUM_URGENCY_THRESHOLD = 3;

export function getUrgencyBadgeClass(totalUrgency: number) {
  if (totalUrgency > HIGH_URGENCY_THRESHOLD) {
    return 'bg-red-100 text-red-700';
  }

  if (totalUrgency > MEDIUM_URGENCY_THRESHOLD) {
    return 'bg-orange-100 text-orange-700';
  }

  return 'bg-slate-100 text-slate-700';
}
