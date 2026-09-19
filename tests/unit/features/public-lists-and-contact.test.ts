import { describe, it, expect, vi } from 'vitest'

vi.mock('@/env', () => ({
  env: {
    NODE_ENV: 'test',
    NEXT_PUBLIC_SITE_URL: 'https://kytbox.com',
    UPSTASH_REDIS_REST_URL: 'https://mock-redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'mock-token',
    SUPABASE_SECRET_KEY: 'mock-secret',
    NEXT_PUBLIC_SUPABASE_URL: 'https://mock.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: 'mock-key',
  },
}))
import { slugify, generateUniqueListSlug } from '@/features/list/lib/slug'
import {
  listSlugSchema,
  claimWishlistItemSchema,
  unclaimWishlistItemSchema,
  releaseWishlistItemClaimSchema,
} from '@/features/list/schemas.server'
import { wishlistMetadataClientSchema } from '@/features/list/schemas.client'
import {
  contactMessageSchema,
  updateContactMessageStatusSchema,
} from '@/features/bio/schemas.server'
import {
  bioContactMessageDtoSchema,
  contactMessageStatusClientSchema,
} from '@/features/bio/schemas.client'
import {
  mapListToDTO,
  mapListWithSummaryToDTO,
  mapBioContactMessageToDTO,
} from '@/lib/mappers'
import { contactRateLimit } from '@/lib/upstash/redis'
import type { List, ListWithSummary, BioContactMessage } from '@/types/database'

describe('Day 29: List Slug & Public Wishlist Gift Claiming', () => {
  describe('slugify()', () => {
    it('converts titles to clean lowercase hyphenated slugs', () => {
      expect(slugify('My Birthday Wishlist 2026')).toBe('my-birthday-wishlist-2026')
      expect(slugify('  Tokyo Trip & Packing List! ')).toBe('tokyo-trip-packing-list')
      expect(slugify('Special@#Chars$$%Here')).toBe('special-chars-here')
    })

    it('falls back to "list" for empty or symbol-only strings', () => {
      expect(slugify('')).toBe('list')
      expect(slugify('   ')).toBe('list')
      expect(slugify('!!!@@@###$$$')).toBe('list')
    })
  })

  describe('generateUniqueListSlug()', () => {
    it('returns base slug when no duplicate exists', async () => {
      const slugChecker = vi.fn().mockResolvedValue(false)

      const slug = await generateUniqueListSlug(
        slugChecker,
        'user-1',
        'Gadgets Wishlist'
      )
      expect(slug).toBe('gadgets-wishlist')
      expect(slugChecker).toHaveBeenCalledWith('gadgets-wishlist')
    })

    it('appends incrementing suffix when duplicate slug is found', async () => {
      let callCount = 0
      const slugChecker = vi.fn().mockImplementation(async () => {
        callCount++
        return callCount === 1
      })

      const slug = await generateUniqueListSlug(
        slugChecker,
        'user-1',
        'Holiday Gifts'
      )
      expect(slug).toBe('holiday-gifts-2')
      expect(slugChecker).toHaveBeenCalledWith('holiday-gifts')
      expect(slugChecker).toHaveBeenCalledWith('holiday-gifts-2')
    })
  })

  describe('Day 29 Schemas', () => {
    it('validates list slugs correctly', () => {
      expect(listSlugSchema.safeParse('birthday-wishlist-2026').success).toBe(true)
      expect(listSlugSchema.safeParse('my-list').success).toBe(true)
      expect(listSlugSchema.safeParse('simple').success).toBe(true)

      // Invalid slugs
      expect(listSlugSchema.safeParse('Uppercase-Not-Allowed').success).toBe(false)
      expect(listSlugSchema.safeParse('spaces in slug').success).toBe(false)
      expect(listSlugSchema.safeParse('trailing-dash-').success).toBe(false)
      expect(listSlugSchema.safeParse('-leading-dash').success).toBe(false)
    })

    it('validates claimWishlistItemSchema', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      const res = claimWishlistItemSchema.safeParse({
        itemId: validUuid,
        claimedByName: 'Uncle Bob',
        note: 'Happy 30th Birthday!',
      })
      expect(res.success).toBe(true)

      // Missing name
      const missingName = claimWishlistItemSchema.safeParse({
        itemId: validUuid,
        claimedByName: '',
      })
      expect(missingName.success).toBe(false)

      // Invalid itemId
      const invalidId = claimWishlistItemSchema.safeParse({
        itemId: 'not-a-uuid',
        claimedByName: 'Bob',
      })
      expect(invalidId.success).toBe(false)
    })

    it('validates unclaimWishlistItemSchema and releaseWishlistItemClaimSchema', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      const unclaimRes = unclaimWishlistItemSchema.safeParse({
        itemId: validUuid,
        claimToken: 'claim_abc1234567890123456789',
      })
      expect(unclaimRes.success).toBe(true)

      const releaseRes = releaseWishlistItemClaimSchema.safeParse({
        itemId: validUuid,
        listId: validUuid,
      })
      expect(releaseRes.success).toBe(true)
    })

    it('validates wishlist client schema with claim metadata', () => {
      const parsed = wishlistMetadataClientSchema.parse({
        price: 99.99,
        currency: 'USD',
        purchase_url: 'https://amazon.com/item',
        claim: {
          claimed_by_name: 'Sarah',
          claimed_at: '2026-09-29T10:00:00Z',
          claim_token: 'claim_123',
          note: 'From your favorite sister',
        },
      })
      expect(parsed.claim?.claimed_by_name).toBe('Sarah')
      expect(parsed.price).toBe(99.99)
    })
  })

  describe('List DTO Mappers with slug', () => {
    it('maps list slug to ListDTO correctly', () => {
      const row: List = {
        id: 'list-123',
        user_id: 'user-456',
        title: 'Tech Wishlist',
        description: 'Upcoming gadgets',
        type: 'wishlist',
        is_public: true,
        slug: 'tech-wishlist',
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      }
      const dto = mapListToDTO(row)
      expect(dto.slug).toBe('tech-wishlist')
      expect(dto.is_public).toBe(true)
      expect(dto.type).toBe('wishlist')
    })

    it('maps list_summary with slug to ListDTO correctly', () => {
      const summary: ListWithSummary & { slug?: string | null } = {
        id: 'list-123',
        user_id: 'user-456',
        title: 'Tech Wishlist',
        description: null,
        type: 'wishlist',
        is_public: true,
        slug: 'tech-wishlist-2',
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
        item_count: 8,
        completed_count: 3,
      }
      const dto = mapListWithSummaryToDTO(summary)
      expect(dto.slug).toBe('tech-wishlist-2')
      expect(dto.item_count).toBe(8)
    })
  })
})

describe('Day 30: Bio Contact Relay Widget & Inquiries', () => {
  describe('contactMessageSchema Validation & Spam Defense', () => {
    const validProfileId = '123e4567-e89b-12d3-a456-426614174000'

    it('validates a legitimate contact inquiry', () => {
      const res = contactMessageSchema.safeParse({
        profileId: validProfileId,
        senderName: 'Jane Doe',
        senderEmail: 'jane@example.com',
        message: 'Hi Alex, I love your podcasts! Would you be open to an interview next month?',
      })
      expect(res.success).toBe(true)
    })

    it('accepts messages with 1 URL but rejects messages with 2 or more URLs (spam relay defense)', () => {
      // 1 URL is acceptable
      const oneUrlRes = contactMessageSchema.safeParse({
        profileId: validProfileId,
        senderName: 'John Mark',
        senderEmail: 'john@example.com',
        message: 'Here is my portfolio link: https://johnmark.dev - excited to connect!',
      })
      expect(oneUrlRes.success).toBe(true)

      // 2 or more URLs is rejected as spam relay
      const twoUrlRes = contactMessageSchema.safeParse({
        profileId: validProfileId,
        senderName: 'Spam Bot',
        senderEmail: 'spambot@spam.com',
        message: 'Check out https://spam1.com and buy cheap products at https://spam2.com today!',
      })
      expect(twoUrlRes.success).toBe(false)
      if (!twoUrlRes.success) {
        expect(twoUrlRes.error.issues[0]?.message).toContain('more than 1 URL')
      }
    })

    it('enforces character length limits (10 to 1,000 chars)', () => {
      // Too short
      const shortRes = contactMessageSchema.safeParse({
        profileId: validProfileId,
        senderName: 'Jane',
        senderEmail: 'jane@example.com',
        message: 'Hello!',
      })
      expect(shortRes.success).toBe(false)

      // Too long (>1,000 chars)
      const longRes = contactMessageSchema.safeParse({
        profileId: validProfileId,
        senderName: 'Jane',
        senderEmail: 'jane@example.com',
        message: 'A'.repeat(1001),
      })
      expect(longRes.success).toBe(false)
    })

    it('validates sender email format', () => {
      const res = contactMessageSchema.safeParse({
        profileId: validProfileId,
        senderName: 'Jane',
        senderEmail: 'not-an-email',
        message: 'Hello, this is a legitimate message with more than 10 characters.',
      })
      expect(res.success).toBe(false)
    })

    it('parses honeypot field', () => {
      const res = contactMessageSchema.safeParse({
        profileId: validProfileId,
        senderName: 'Bot',
        senderEmail: 'bot@spam.com',
        message: 'This is a spam message filled by automated form filler.',
        website: 'https://badbot.com',
      })
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.website).toBe('https://badbot.com')
      }
    })
  })

  describe('updateContactMessageStatusSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000'

    it('accepts valid statuses (unread, read, archived)', () => {
      expect(
        updateContactMessageStatusSchema.safeParse({
          messageId: validUuid,
          status: 'read',
        }).success
      ).toBe(true)

      expect(
        updateContactMessageStatusSchema.safeParse({
          messageId: validUuid,
          status: 'archived',
        }).success
      ).toBe(true)

      expect(
        updateContactMessageStatusSchema.safeParse({
          messageId: validUuid,
          status: 'unread',
        }).success
      ).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(
        updateContactMessageStatusSchema.safeParse({
          messageId: validUuid,
          status: 'deleted',
        }).success
      ).toBe(false)
    })
  })

  describe('mapBioContactMessageToDTO', () => {
    it('maps database contact message row to DTO correctly', () => {
      const row: BioContactMessage = {
        id: 'msg-1',
        profile_id: 'profile-1',
        sender_name: 'David Chen',
        sender_email: 'david@agency.com',
        message: 'Interested in sponsoring your channel.',
        status: 'unread',
        created_at: '2026-09-30T12:00:00Z',
      }

      const dto = mapBioContactMessageToDTO(row)
      expect(dto.id).toBe('msg-1')
      expect(dto.sender_name).toBe('David Chen')
      expect(dto.sender_email).toBe('david@agency.com')
      expect(dto.message).toBe('Interested in sponsoring your channel.')
      expect(dto.status).toBe('unread')
      expect(dto.created_at).toBe('2026-09-30T12:00:00Z')
    })

    it('normalizes unknown status values to unread', () => {
      const row = {
        id: 'msg-2',
        profile_id: 'profile-1',
        sender_name: 'Alice',
        sender_email: 'alice@test.com',
        message: 'Great bio setup!',
        status: 'spam_flagged',
        created_at: '2026-09-30T12:00:00Z',
      }

      const dto = mapBioContactMessageToDTO(row)
      expect(dto.status).toBe('unread')
    })
  })

  describe('contactRateLimit', () => {
    it('is configured and callable', () => {
      expect(contactRateLimit).toBeDefined()
      expect(typeof contactRateLimit.limit).toBe('function')
    })
  })

  describe('Client Schemas', () => {
    it('safely parses contactMessageStatusClientSchema fallback', () => {
      expect(contactMessageStatusClientSchema.parse('unread')).toBe('unread')
      expect(contactMessageStatusClientSchema.parse('read')).toBe('read')
      expect(contactMessageStatusClientSchema.parse('archived')).toBe('archived')
      expect(contactMessageStatusClientSchema.parse('unknown_status')).toBe('unread')
    })

    it('validates bioContactMessageDtoSchema', () => {
      const validDto = bioContactMessageDtoSchema.parse({
        id: 'msg-123',
        profile_id: 'profile-456',
        sender_name: 'Bob',
        sender_email: 'bob@example.com',
        message: 'Hello there!',
        status: 'unread',
        created_at: '2026-09-30T14:00:00Z',
      })
      expect(validDto.sender_name).toBe('Bob')
      expect(validDto.status).toBe('unread')
    })
  })
})
