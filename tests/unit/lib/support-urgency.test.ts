import { describe, it, expect } from 'vitest';
import {
  getUrgencyBadgeClass,
  HIGH_URGENCY_THRESHOLD,
  MEDIUM_URGENCY_THRESHOLD,
} from '@/lib/support-urgency';

describe('getUrgencyBadgeClass', () => {
  it('returns high urgency class above HIGH threshold', () => {
    expect(getUrgencyBadgeClass(HIGH_URGENCY_THRESHOLD + 1)).toBe('bg-red-100 text-red-700');
  });

  it('returns high urgency class well above threshold', () => {
    expect(getUrgencyBadgeClass(100)).toBe('bg-red-100 text-red-700');
  });

  it('returns medium urgency class above MEDIUM but at or below HIGH threshold', () => {
    expect(getUrgencyBadgeClass(HIGH_URGENCY_THRESHOLD)).toBe('bg-orange-100 text-orange-700');
    expect(getUrgencyBadgeClass(MEDIUM_URGENCY_THRESHOLD + 1)).toBe('bg-orange-100 text-orange-700');
  });

  it('returns low urgency class at or below MEDIUM threshold', () => {
    expect(getUrgencyBadgeClass(MEDIUM_URGENCY_THRESHOLD)).toBe('bg-slate-100 text-slate-700');
    expect(getUrgencyBadgeClass(0)).toBe('bg-slate-100 text-slate-700');
  });

  it('returns low urgency class for negative values', () => {
    expect(getUrgencyBadgeClass(-5)).toBe('bg-slate-100 text-slate-700');
  });
});
