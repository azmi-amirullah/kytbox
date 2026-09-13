import { describe, it, expect } from 'vitest';
import {
  isPrivateOrRestrictedHost,
  assertSafeRemoteHost,
  detectResourceMetadata,
} from '@/features/list/lib/resource-metadata';
import { addResourceSchema, deleteResourceSchema } from '@/features/list/schemas.server';

describe('Card Resource Links & SSRF Defense (Day 16)', () => {
  describe('SSRF Protection (isPrivateOrRestrictedHost)', () => {
    it('blocks localhost and loopback addresses', () => {
      expect(isPrivateOrRestrictedHost('localhost')).toBe(true);
      expect(isPrivateOrRestrictedHost('127.0.0.1')).toBe(true);
      expect(isPrivateOrRestrictedHost('127.0.0.2')).toBe(true);
      expect(isPrivateOrRestrictedHost('127.1.2.3')).toBe(true);
      expect(isPrivateOrRestrictedHost('::1')).toBe(true);
      expect(isPrivateOrRestrictedHost('0.0.0.0')).toBe(true);
    });

    it('blocks decimal, hex, and octal encoded IP addresses', () => {
      // 2130706433 is 127.0.0.1 in decimal notation
      expect(isPrivateOrRestrictedHost('2130706433')).toBe(true);
      // 0x7f000001 is 127.0.0.1 in hex notation
      expect(isPrivateOrRestrictedHost('0x7f000001')).toBe(true);
      // 017700000001 is 127.0.0.1 in octal notation
      expect(isPrivateOrRestrictedHost('017700000001')).toBe(true);
    });

    it('blocks IPv4 private subnets (RFC 1918)', () => {
      // 10.0.0.0/8
      expect(isPrivateOrRestrictedHost('10.0.0.1')).toBe(true);
      expect(isPrivateOrRestrictedHost('10.254.1.1')).toBe(true);

      // 172.16.0.0/12
      expect(isPrivateOrRestrictedHost('172.16.0.1')).toBe(true);
      expect(isPrivateOrRestrictedHost('172.31.255.255')).toBe(true);
      // Public 172 range should NOT be blocked by 172.16-31
      expect(isPrivateOrRestrictedHost('172.15.0.1')).toBe(false);
      expect(isPrivateOrRestrictedHost('172.32.0.1')).toBe(false);

      // 192.168.0.0/16
      expect(isPrivateOrRestrictedHost('192.168.1.1')).toBe(true);
      expect(isPrivateOrRestrictedHost('192.168.0.254')).toBe(true);
    });

    it('blocks Cloud metadata service IP (169.254.169.254)', () => {
      expect(isPrivateOrRestrictedHost('169.254.169.254')).toBe(true);
      expect(isPrivateOrRestrictedHost('169.254.0.1')).toBe(true);
    });

    it('allows valid public domain names and public IPs', () => {
      expect(isPrivateOrRestrictedHost('github.com')).toBe(false);
      expect(isPrivateOrRestrictedHost('figma.com')).toBe(false);
      expect(isPrivateOrRestrictedHost('loom.com')).toBe(false);
      expect(isPrivateOrRestrictedHost('drive.google.com')).toBe(false);
      expect(isPrivateOrRestrictedHost('8.8.8.8')).toBe(false);
      expect(isPrivateOrRestrictedHost('1.1.1.1')).toBe(false);
    });

    it('assertSafeRemoteHost rejects restricted hosts before network fetch', async () => {
      await expect(assertSafeRemoteHost('localhost')).rejects.toThrow(
        'Access to private or internal network addresses is blocked',
      );
      await expect(assertSafeRemoteHost('127.0.0.1')).rejects.toThrow(
        'Access to private or internal network addresses is blocked',
      );
      await expect(assertSafeRemoteHost('169.254.169.254')).rejects.toThrow(
        'Access to private or internal network addresses is blocked',
      );
      await expect(assertSafeRemoteHost('2130706433')).rejects.toThrow(
        'Access to private or internal network addresses is blocked',
      );
    });
  });

  describe('Known Cloud Presets (detectResourceMetadata)', () => {
    it('detects Figma links with instant fallback metadata and 0 HTTP requests', async () => {
      const meta = await detectResourceMetadata('https://www.figma.com/file/abcdef12345/Design-System');
      expect(meta.service).toBe('figma');
      expect(meta.title).toBe('Figma Design');
    });

    it('detects GitHub links with repo/issue extraction', async () => {
      const meta = await detectResourceMetadata('https://github.com/azmi-amirullah/link-hub/pull/42');
      expect(meta.service).toBe('github');
      expect(meta.title).toBe('GitHub: azmi-amirullah/link-hub');
    });

    it('detects Google Drive & Docs links', async () => {
      const meta = await detectResourceMetadata('https://docs.google.com/document/d/123456789/edit');
      expect(meta.service).toBe('drive');
      expect(meta.title).toBe('Google Docs Document');
    });

    it('detects Loom video links', async () => {
      const meta = await detectResourceMetadata('https://www.loom.com/share/987654321');
      expect(meta.service).toBe('loom');
      expect(meta.title).toBe('Loom Video Recording');
    });

    it('detects Notion workspace links', async () => {
      const meta = await detectResourceMetadata('https://www.notion.so/myworkspace/Meeting-Notes-12345');
      expect(meta.service).toBe('notion');
      expect(meta.title).toBe('Notion Page');
    });

    it('rejects SSRF attacks gracefully without throwing unhandled exceptions', async () => {
      const meta = await detectResourceMetadata('http://169.254.169.254/latest/meta-data/');
      expect(meta.title).toBe('169.254.169.254');
      expect(meta.service).toBe('link');
    });
  });

  describe('Resource Validation Schemas', () => {
    it('validates bookmark addition with URL trimming', () => {
      const valid = addResourceSchema.safeParse({
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        url: '  https://github.com/azmi-amirullah/link-hub  ',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.url).toBe('https://github.com/azmi-amirullah/link-hub');
      }

      const invalidUrl = addResourceSchema.safeParse({
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        url: 'not-a-valid-url',
      });
      expect(invalidUrl.success).toBe(false);
    });

    it('validates bookmark deletion', () => {
      const valid = deleteResourceSchema.safeParse({
        resourceId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(valid.success).toBe(true);
    });
  });
});
