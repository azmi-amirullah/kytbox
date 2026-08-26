import { describe, it, expect } from 'vitest';
import {
  getDueDateStatus,
  formatDueDateLabel,
  getDueDateBadgeStyles,
  getDueDateInfo,
} from '@/features/list/lib/due-date';

describe('List Due Date Engine', () => {
  const baseDate = new Date(2026, 7, 15); // Aug 15, 2026

  describe('getDueDateStatus', () => {
    it('returns "none" when no due date is provided', () => {
      expect(getDueDateStatus(null, false, baseDate)).toBe('none');
      expect(getDueDateStatus(undefined, false, baseDate)).toBe('none');
      expect(getDueDateStatus('', false, baseDate)).toBe('none');
    });

    it('returns "completed" when item is marked completed regardless of date', () => {
      expect(getDueDateStatus('2026-08-10', true, baseDate)).toBe('completed');
      expect(getDueDateStatus('2026-08-15', true, baseDate)).toBe('completed');
      expect(getDueDateStatus('2026-08-20', true, baseDate)).toBe('completed');
    });

    it('returns "overdue" for dates in the past', () => {
      expect(getDueDateStatus('2026-08-14', false, baseDate)).toBe('overdue');
      expect(getDueDateStatus('2026-08-01', false, baseDate)).toBe('overdue');
      expect(getDueDateStatus('2025-12-31', false, baseDate)).toBe('overdue');
    });

    it('returns "due-today" for the current date', () => {
      expect(getDueDateStatus('2026-08-15', false, baseDate)).toBe('due-today');
    });

    it('returns "due-tomorrow" for the next calendar day', () => {
      expect(getDueDateStatus('2026-08-16', false, baseDate)).toBe('due-tomorrow');
    });

    it('returns "upcoming" for dates more than 1 day in the future', () => {
      expect(getDueDateStatus('2026-08-17', false, baseDate)).toBe('upcoming');
      expect(getDueDateStatus('2026-09-01', false, baseDate)).toBe('upcoming');
    });
  });

  describe('formatDueDateLabel', () => {
    it('returns empty string when no date is provided', () => {
      expect(formatDueDateLabel(null, false, baseDate)).toBe('');
      expect(formatDueDateLabel('', false, baseDate)).toBe('');
    });

    it('formats single-day overdue as "Overdue (1d)"', () => {
      expect(formatDueDateLabel('2026-08-14', false, baseDate)).toBe('Overdue (1d)');
    });

    it('formats multi-day overdue as "Overdue (Xd)"', () => {
      expect(formatDueDateLabel('2026-08-10', false, baseDate)).toBe('Overdue (5d)');
    });

    it('formats today as "Due today"', () => {
      expect(formatDueDateLabel('2026-08-15', false, baseDate)).toBe('Due today');
    });

    it('formats tomorrow as "Tomorrow"', () => {
      expect(formatDueDateLabel('2026-08-16', false, baseDate)).toBe('Tomorrow');
    });

    it('formats future dates in the same year as "dd MMM"', () => {
      expect(formatDueDateLabel('2026-08-25', false, baseDate)).toBe('25 Aug');
      expect(formatDueDateLabel('2026-11-04', false, baseDate)).toBe('04 Nov');
    });

    it('formats future dates in a subsequent year with full year format', () => {
      expect(formatDueDateLabel('2027-01-10', false, baseDate)).toBe('10 Jan 2027');
    });

    it('formats completed items with standard date format without overdue prefix', () => {
      expect(formatDueDateLabel('2026-08-10', true, baseDate)).toBe('10 Aug');
      expect(formatDueDateLabel('2027-02-14', true, baseDate)).toBe('14 Feb 2027');
    });
  });

  describe('getDueDateBadgeStyles', () => {
    it('provides distinct styling tokens for all status types', () => {
      expect(getDueDateBadgeStyles('overdue')).toContain('rose');
      expect(getDueDateBadgeStyles('due-today')).toContain('amber');
      expect(getDueDateBadgeStyles('due-tomorrow')).toContain('sky');
      expect(getDueDateBadgeStyles('upcoming')).toContain('muted');
      expect(getDueDateBadgeStyles('completed')).toContain('line-through');
      expect(getDueDateBadgeStyles('none')).toBe('');
    });
  });

  describe('getDueDateInfo', () => {
    it('returns structured metadata bundle for an active due date', () => {
      const info = getDueDateInfo('2026-08-15', false, baseDate);
      expect(info.status).toBe('due-today');
      expect(info.label).toBe('Due today');
      expect(info.diffDays).toBe(0);
      expect(info.badgeClassName).toContain('amber');
    });

    it('returns empty fallback structure when due date is null', () => {
      const info = getDueDateInfo(null, false, baseDate);
      expect(info.status).toBe('none');
      expect(info.label).toBe('');
      expect(info.diffDays).toBeNull();
      expect(info.badgeClassName).toBe('');
    });
  });
});
