import { describe, it, expect } from 'vitest';
import {
  bioTabSchema,
  addLinkSchema,
  updateLinkSchema,
  socialLinksSchema,
} from '@/features/bio/schemas.server';

describe('Bio Server Schemas', () => {
  describe('bioTabSchema', () => {
    it('parses valid tabs', () => {
      expect(bioTabSchema.parse('links')).toBe('links');
      expect(bioTabSchema.parse('appearance')).toBe('appearance');
    });

    it('falls back to "links" for invalid tabs via .catch()', () => {
      expect(bioTabSchema.parse('unknown_tab')).toBe('links');
      expect(bioTabSchema.parse(null)).toBe('links');
    });
  });

  describe('addLinkSchema', () => {
    it('validates a standard link payload', () => {
      const result = addLinkSchema.safeParse({
        title: ' My Portfolio ',
        url: 'https://example.com',
        isFolder: 'false',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('My Portfolio');
        expect(result.data.isFolder).toBe(false);
      }
    });

    it('preprocesses string "true" to boolean true for folders', () => {
      const result = addLinkSchema.safeParse({
        title: 'Projects',
        isFolder: 'true',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isFolder).toBe(true);
      }
    });

    it('requires a non-empty title', () => {
      const result = addLinkSchema.safeParse({
        title: '   ',
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid scheduling dates', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 86400000);
      const result = addLinkSchema.safeParse({
        title: 'Event Link',
        scheduled_at: now.toISOString(),
        expires_at: future.toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it('fails when expires_at is before scheduled_at', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 86400000);
      const result = addLinkSchema.safeParse({
        title: 'Event Link',
        scheduled_at: now.toISOString(),
        expires_at: past.toISOString(),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Expiry must be after start date');
      }
    });
  });

  describe('updateLinkSchema', () => {
    it('validates link update with title and folder state', () => {
      const result = updateLinkSchema.safeParse({
        title: 'Updated Title',
        url: 'https://newurl.com',
        isFolder: 'false',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('socialLinksSchema', () => {
    it('parses valid key-value pairs', () => {
      const result = socialLinksSchema.parse({
        twitter: 'https://twitter.com/user',
        github: 'https://github.com/user',
      });
      expect(result).toEqual({
        twitter: 'https://twitter.com/user',
        github: 'https://github.com/user',
      });
    });

    it('falls back to empty object on non-record input', () => {
      expect(socialLinksSchema.parse('invalid string')).toEqual({});
      expect(socialLinksSchema.parse(null)).toEqual({});
    });
  });
});
