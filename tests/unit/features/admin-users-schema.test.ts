import { describe, it, expect } from 'vitest';
import { adminUsersQuerySchema } from '@/features/admin/schemas';
import { adminUserSearchClientSchema } from '@/features/admin/schemas.client';

describe('Admin Feature Schemas', () => {
  describe('adminUsersQuerySchema', () => {
    it('applies defaults when given empty input', () => {
      const result = adminUsersQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
      expect(result.search).toBeUndefined();
    });

    it('coerces string numbers to integers for page and pageSize', () => {
      const result = adminUsersQuerySchema.parse({
        page: '3',
        pageSize: '50',
        search: '  alex  ',
      });
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(50);
      expect(result.search).toBe('alex');
    });

    it('falls back to defaults when page or pageSize are invalid or negative', () => {
      const result = adminUsersQuerySchema.parse({
        page: '-5',
        pageSize: '999',
      });
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
    });

    it('catches invalid search strings exceeding max limit', () => {
      const longSearch = 'x'.repeat(150);
      const result = adminUsersQuerySchema.parse({ search: longSearch });
      expect(result.search).toBeUndefined();
    });
  });

  describe('adminUserSearchClientSchema', () => {
    it('parses valid search term', () => {
      const result = adminUserSearchClientSchema.safeParse({ search: 'john' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('john');
      }
    });

    it('trims whitespace on client search', () => {
      const result = adminUserSearchClientSchema.safeParse({ search: '  space  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('space');
      }
    });
  });
});
