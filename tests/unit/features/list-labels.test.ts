import { describe, it, expect } from 'vitest';
import {
  LABEL_COLOR_PALETTES,
  resolveLabelColor,
  getNextAvailableLabelColorIndex,
} from '@/features/list/lib/label-colors';
import {
  createListLabelSchema,
  setCardLabelsSchema,
} from '@/features/list/schemas.server';

describe('Card Custom Colored Labels (Day 15)', () => {
  describe('Label Color Palettes & Tokens', () => {
    it('provides exactly 12 distinct high-contrast color tokens', () => {
      expect(LABEL_COLOR_PALETTES).toHaveLength(12);
      for (const token of LABEL_COLOR_PALETTES) {
        expect(token.bg).toBeDefined();
        expect(token.text).toBeDefined();
        expect(token.border).toBeDefined();
        expect(token.dot).toBeDefined();
      }
    });

    it('resolves color tokens accurately within bounds and with fallback', () => {
      const color0 = resolveLabelColor(0);
      expect(color0.dot).toBe('bg-emerald-500');

      const color3 = resolveLabelColor(3);
      expect(color3.dot).toBe('bg-sky-500');

      // Cyclic fallback for out of bounds index (12 % 12 === 0)
      expect(resolveLabelColor(12).dot).toBe(LABEL_COLOR_PALETTES[0].dot);
      expect(resolveLabelColor(15).dot).toBe(LABEL_COLOR_PALETTES[3].dot);

      // Fallback for negative, NaN or undefined
      expect(resolveLabelColor(-1).dot).toBe(LABEL_COLOR_PALETTES[1].dot); // -1 % 12 safeIndex is 1
      expect(resolveLabelColor(NaN).dot).toBe(LABEL_COLOR_PALETTES[0].dot);
      expect(resolveLabelColor(undefined).dot).toBe(LABEL_COLOR_PALETTES[0].dot);
    });

    it('allocates the lowest available slot index', () => {
      // Empty labels -> slot 0
      expect(getNextAvailableLabelColorIndex([])).toBe(0);

      // Slot 0 taken -> slot 1
      expect(getNextAvailableLabelColorIndex([{ color_index: 0 }])).toBe(1);

      // Slots 0 and 1 taken -> slot 2
      expect(
        getNextAvailableLabelColorIndex([{ color_index: 0 }, { color_index: 1 }]),
      ).toBe(2);

      // Slots 0, 2 taken -> slot 1 (fill gap)
      expect(
        getNextAvailableLabelColorIndex([{ color_index: 0 }, { color_index: 2 }]),
      ).toBe(1);

      // All 12 slots taken -> wrap around to 0
      const allTwelve = Array.from({ length: 12 }, (_, i) => ({ color_index: i }));
      expect(getNextAvailableLabelColorIndex(allTwelve)).toBe(0);
    });
  });

  describe('Label Validation Schemas', () => {
    it('validates label creation inputs', () => {
      const valid = createListLabelSchema.safeParse({
        listId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Urgent Bug',
        colorIndex: 3,
      });
      expect(valid.success).toBe(true);

      const tooLong = createListLabelSchema.safeParse({
        listId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'a'.repeat(41),
      });
      expect(tooLong.success).toBe(false);

      const emptyName = createListLabelSchema.safeParse({
        listId: '123e4567-e89b-12d3-a456-426614174000',
        name: '   ',
      });
      expect(emptyName.success).toBe(false);
    });

    it('validates setting card labels array', () => {
      const valid = setCardLabelsSchema.safeParse({
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        labels: ['Personal', 'Work', 'Review'],
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.labels).toEqual(['Personal', 'Work', 'Review']);
      }

      // Max 20 labels per card
      const tooMany = setCardLabelsSchema.safeParse({
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        labels: Array.from({ length: 25 }, (_, i) => `Tag${i}`),
      });
      expect(tooMany.success).toBe(false);
    });
  });
});
