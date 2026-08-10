import { describe, it, expect } from 'vitest';
import {
  bioTabSchema,
  addLinkSchema,
  updateLinkSchema,
  socialLinksSchema,
  updateSeoSchema,
} from '@/features/bio/schemas.server';

describe('Bio Server Schemas', () => {
  describe('updateSeoSchema', () => {
    it('validates a correct SEO metadata payload', () => {
      const result = updateSeoSchema.safeParse({
        metaTitle: 'John Doe — Creator & Developer',
        metaDescription: 'Discover all my links and projects.',
        ogImageUrl: 'https://example.com/social-banner.png',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metaTitle).toBe('John Doe — Creator & Developer');
        expect(result.data.metaDescription).toBe('Discover all my links and projects.');
        expect(result.data.ogImageUrl).toBe('https://example.com/social-banner.png');
      }
    });

    it('accepts empty/optional SEO fields', () => {
      const result = updateSeoSchema.safeParse({
        metaTitle: '',
        metaDescription: '',
        ogImageUrl: '',
      });
      expect(result.success).toBe(true);
    });

    it('fails when metaTitle exceeds 120 characters', () => {
      const longTitle = 'a'.repeat(121);
      const result = updateSeoSchema.safeParse({ metaTitle: longTitle });
      expect(result.success).toBe(false);
    });

    it('fails when ogImageUrl does not start with http or https', () => {
      const result = updateSeoSchema.safeParse({
        ogImageUrl: 'ftp://example.com/image.png',
      });
      expect(result.success).toBe(false);
    });
  });

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
        icon_url: 'https://example.com/icon.png',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.icon_url).toBe('https://example.com/icon.png');
      }
    });
  });

  describe('favicon utility', () => {
    it('generates Google favicon URL for valid domains', async () => {
      const { getFaviconUrl, resolveLinkIcon } = await import(
        '@/features/bio/utils/favicon'
      );
      expect(getFaviconUrl('https://github.com/azmi')).toBe(
        'https://www.google.com/s2/favicons?domain=github.com&sz=128',
      );

      const resolvedCustom = resolveLinkIcon(
        'https://github.com',
        'https://custom.com/icon.png',
      );
      expect(resolvedCustom).toEqual({
        url: 'https://custom.com/icon.png',
        isFavicon: false,
      });

      const resolvedAuto = resolveLinkIcon('https://github.com', null);
      expect(resolvedAuto).toEqual({
        url: 'https://www.google.com/s2/favicons?domain=github.com&sz=128',
        isFavicon: true,
      });
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
