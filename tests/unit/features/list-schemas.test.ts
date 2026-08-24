import { describe, it, expect } from 'vitest';
import {
  createListSchema,
  listColumnSchema,
  wishlistMetadataSchema,
  createListItemSchema,
  moveItemSchema,
  reorderColumnsSchema,
  reorderItemsSchema,
  createSubtaskSchema,
  toggleSubtaskSchema,
  updateSubtaskTitleSchema,
  reorderSubtasksSchema,
} from '@/features/list/schemas.server';

describe('List Server Schemas', () => {
  describe('createListSchema', () => {
    it('validates a valid board creation', () => {
      const result = createListSchema.safeParse({
        title: 'Project Alpha Board',
        type: 'todo',
        description: 'Roadmap and tasks',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Project Alpha Board');
        expect(result.data.type).toBe('todo');
      }
    });

    it('rejects unsupported list types', () => {
      const result = createListSchema.safeParse({
        title: 'Invalid Type',
        type: 'shopping_list', // not in ['todo', 'wishlist', 'idea']
      });
      expect(result.success).toBe(false);
    });

    it('enforces maximum title length', () => {
      const longTitle = 'a'.repeat(101);
      const result = createListSchema.safeParse({
        title: longTitle,
        type: 'idea',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('listColumnSchema', () => {
    it('requires a column title', () => {
      const result = listColumnSchema.safeParse({ title: '  ' });
      expect(result.success).toBe(false);
    });

    it('accepts valid column names', () => {
      const result = listColumnSchema.safeParse({ title: 'In Progress' });
      expect(result.success).toBe(true);
    });
  });

  describe('wishlistMetadataSchema', () => {
    it('parses valid price, currency, and url metadata', () => {
      const result = wishlistMetadataSchema.parse({
        price: '199.99',
        currency: 'USD',
        purchase_url: 'https://store.example.com/item',
      });
      expect(result).toEqual({
        price: 199.99,
        currency: 'USD',
        purchase_url: 'https://store.example.com/item',
      });
    });

    it('handles null and missing fields gracefully', () => {
      const result = wishlistMetadataSchema.parse({});
      expect(result).toEqual({
        price: null,
        currency: null,
        purchase_url: null,
      });
    });

    it('falls back to null fields when corrupt metadata is passed', () => {
      const result = wishlistMetadataSchema.parse({
        price: -50, // invalid non-negative
        purchase_url: 'not-a-url',
      });
      expect(result).toEqual({
        price: null,
        currency: null,
        purchase_url: null,
      });
    });
  });

  describe('createListItemSchema', () => {
    it('requires a valid UUID for listId', () => {
      const result = createListItemSchema.safeParse({
        listId: '1234',
        title: 'Task Item',
      });
      expect(result.success).toBe(false);

      const validResult = createListItemSchema.safeParse({
        listId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Task Item',
      });
      expect(validResult.success).toBe(true);
    });
  });

  describe('mutation schemas', () => {
    it('requires UUIDs and a finite sort order for item moves', () => {
      const result = moveItemSchema.safeParse({
        itemId: 'not-an-id',
        columnId: 'not-an-id',
        sortOrder: Number.NaN,
        isDoneColumn: false,
      });

      expect(result.success).toBe(false);
    });

    it('rejects duplicate item IDs during reorder', () => {
      const itemId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const result = reorderItemsSchema.safeParse({
        listId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
        itemIds: [itemId, itemId],
      });

      expect(result.success).toBe(false);
    });

    it('rejects duplicate column IDs during reorder', () => {
      const columnId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const result = reorderColumnsSchema.safeParse({
        listId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
        columnIds: [columnId, columnId],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('dueDate schemas', () => {
    it('accepts valid YYYY-MM-DD date format and null', () => {
      const valid = createListItemSchema.safeParse({
        listId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Task with Deadline',
        dueDate: '2026-08-25',
      });
      expect(valid.success).toBe(true);

      const nullDate = createListItemSchema.safeParse({
        listId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Task without Deadline',
        dueDate: null,
      });
      expect(nullDate.success).toBe(true);
    });

    it('rejects malformed date formats', () => {
      const malformed = createListItemSchema.safeParse({
        listId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Invalid Date Task',
        dueDate: '25-08-2026',
      });
      expect(malformed.success).toBe(false);
    });
  });

  describe('subtask schemas', () => {
    it('validates createSubtaskSchema with valid UUID and title', () => {
      const valid = createSubtaskSchema.safeParse({
        itemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Draft landing page copy',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects empty or whitespace-only subtask title', () => {
      const empty = createSubtaskSchema.safeParse({
        itemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        title: '   ',
      });
      expect(empty.success).toBe(false);
    });

    it('validates toggleSubtaskSchema and updateSubtaskTitleSchema', () => {
      const toggle = toggleSubtaskSchema.safeParse({
        subtaskId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        isCompleted: true,
      });
      expect(toggle.success).toBe(true);

      const update = updateSubtaskTitleSchema.safeParse({
        subtaskId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Updated subtask title',
      });
      expect(update.success).toBe(true);
    });

    it('rejects duplicate subtask IDs during reorder', () => {
      const subtaskId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const duplicate = reorderSubtasksSchema.safeParse({
        itemId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
        subtaskIds: [subtaskId, subtaskId],
      });
      expect(duplicate.success).toBe(false);
    });
  });
});

