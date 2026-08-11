import { describe, it, expect } from 'vitest';
import { subscribeSchema, bioTabSchema } from '@/features/bio/schemas.server';
import { mapSubscriberToDTO } from '@/lib/mappers';

describe('Bio Subscribers Schemas & Mappers', () => {
  describe('subscribeSchema', () => {
    it('validates a correct subscription payload', () => {
      const result = subscribeSchema.safeParse({
        profileId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'creator.fan@example.com',
        sourceUrl: 'https://kytbox.app/alex',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profileId).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(result.data.email).toBe('creator.fan@example.com');
        expect(result.data.sourceUrl).toBe('https://kytbox.app/alex');
      }
    });

    it('rejects an invalid profile ID', () => {
      const result = subscribeSchema.safeParse({
        profileId: 'not-a-uuid',
        email: 'creator.fan@example.com',
      });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid email address', () => {
      const result = subscribeSchema.safeParse({
        profileId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('bioTabSchema', () => {
    it('accepts subscribers as a valid tab', () => {
      const result = bioTabSchema.parse('subscribers');
      expect(result).toBe('subscribers');
    });
  });

  describe('mapSubscriberToDTO', () => {
    it('correctly maps subscriber DB row to DTO', () => {
      const row = {
        id: 'sub-123',
        profile_id: 'prof-456',
        email: 'fan@domain.com',
        source_url: 'https://kytbox.app/creator',
        created_at: '2026-08-10T12:00:00Z',
      };
      const dto = mapSubscriberToDTO(row);
      expect(dto).toEqual({
        id: 'sub-123',
        profile_id: 'prof-456',
        email: 'fan@domain.com',
        source_url: 'https://kytbox.app/creator',
        created_at: '2026-08-10T12:00:00Z',
      });
    });

    it('handles null source_url gracefully', () => {
      const row = {
        id: 'sub-789',
        profile_id: 'prof-456',
        email: 'fan2@domain.com',
        source_url: null,
        created_at: '2026-08-10T12:00:00Z',
      };
      const dto = mapSubscriberToDTO(row);
      expect(dto.source_url).toBeNull();
    });
  });
});
