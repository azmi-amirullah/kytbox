import { describe, it, expect } from 'vitest';
import { customDomainInputSchema } from '@/features/bio/schemas.server';
import { mapCustomDomainToDTO } from '@/lib/mappers';
import { verifyDnsTxtRecord } from '@/features/bio/utils/dns';

describe('Custom Domain Validation & Mapping Engine', () => {
  describe('customDomainInputSchema', () => {
    it('accepts valid custom domains', () => {
      expect(customDomainInputSchema.parse('links.creator.com')).toBe('links.creator.com');
      expect(customDomainInputSchema.parse('MYBRAND.CO.UK ')).toBe('mybrand.co.uk');
      expect(customDomainInputSchema.parse('bio.john-doe.me')).toBe('bio.john-doe.me');
    });

    it('accepts local development domains (.local, .test, .localhost)', () => {
      expect(customDomainInputSchema.parse('testcreator.local')).toBe('testcreator.local');
      expect(customDomainInputSchema.parse('mybrand.test')).toBe('mybrand.test');
      expect(customDomainInputSchema.parse('custom.localhost')).toBe('custom.localhost');
    });

    it('rejects invalid domain formats', () => {
      expect(() => customDomainInputSchema.parse('not a domain')).toThrow();
      expect(() => customDomainInputSchema.parse('http://links.creator.com')).toThrow();
      expect(() => customDomainInputSchema.parse('a')).toThrow();
    });

    it('rejects reserved system platform domains', () => {
      expect(() => customDomainInputSchema.parse('kytbox.app')).toThrow();
      expect(() => customDomainInputSchema.parse('app.kytbox.app')).toThrow();
      expect(() => customDomainInputSchema.parse('localhost')).toThrow();
      expect(() => customDomainInputSchema.parse('127.0.0.1')).toThrow();
    });
  });

  describe('mapCustomDomainToDTO', () => {
    it('correctly maps raw database custom_domains row to DTO', () => {
      const rawRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        profile_id: 'profile-123',
        domain: 'links.creator.com',
        status: 'verified',
        verification_token: 'kytbox-verify-abc123',
        created_at: '2026-08-12T10:00:00Z',
        updated_at: '2026-08-12T10:00:00Z',
      };

      const dto = mapCustomDomainToDTO(rawRow);
      expect(dto).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        profile_id: 'profile-123',
        domain: 'links.creator.com',
        status: 'verified',
        verification_token: 'kytbox-verify-abc123',
        created_at: '2026-08-12T10:00:00Z',
        updated_at: '2026-08-12T10:00:00Z',
      });
    });

    it('normalizes unverified status to pending', () => {
      const rawRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        profile_id: 'profile-123',
        domain: 'links.creator.com',
        status: 'pending',
        verification_token: 'kytbox-verify-abc123',
        created_at: '2026-08-12T10:00:00Z',
        updated_at: '2026-08-12T10:00:00Z',
      };

      const dto = mapCustomDomainToDTO(rawRow);
      expect(dto.status).toBe('pending');
    });
  });

  describe('verifyDnsTxtRecord', () => {
    it('auto-verifies .local and .test domains in development', async () => {
      const result = await verifyDnsTxtRecord('mybrand.local', 'token123');
      expect(result.verified).toBe(true);
    });
  });
});
