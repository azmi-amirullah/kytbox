import { describe, it, expect } from 'vitest';
import {
  createListSchema,
  listColumnSchema,
  wishlistMetadataSchema,
  createListItemSchema,
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
});
