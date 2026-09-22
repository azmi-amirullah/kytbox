import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing ai-actions
vi.mock('@/lib/auth-with-rate-limit', () => ({
  getAuthenticatedUserWithRateLimit: vi.fn().mockResolvedValue({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

const mockEnv = {
  GEMINI_API_KEY: 'test-api-key',
};

vi.mock('@/env', () => ({
  env: mockEnv,
}));

describe('parseReceiptImageWithAI Server Action', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('parseReceiptImageWithAI (Multimodal Vision)', () => {
    it('rejects invalid or empty base64 input', async () => {
      const { parseReceiptImageWithAI } = await import('@/features/cashflow/ai-actions');
      const result = await parseReceiptImageWithAI({
        base64: '',
        mimeType: 'image/webp',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid receipt image input');
      }
    });

    it('fails gracefully when GEMINI_API_KEY is not configured', async () => {
      mockEnv.GEMINI_API_KEY = '';
      const { parseReceiptImageWithAI } = await import('@/features/cashflow/ai-actions');
      const result = await parseReceiptImageWithAI({
        base64: 'validbase64contenthere1234567890',
        mimeType: 'image/webp',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('GEMINI_API_KEY is not configured');
      }
    });

    it('successfully extracts structured receipt data from multimodal image', async () => {
      const mockGeminiOutput = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    merchant: 'Indomaret Point',
                    amount: 16650,
                    date: '2026-09-19',
                    category: 'food',
                    suggestedTags: ['groceries', 'snacks'],
                    confidence: 0.98,
                  }),
                },
              ],
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockGeminiOutput), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const { parseReceiptImageWithAI } = await import('@/features/cashflow/ai-actions');
      const result = await parseReceiptImageWithAI({
        base64: 'samplevalidbase64imagedata1234567890',
        mimeType: 'image/webp',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.merchant).toBe('Indomaret Point');
        expect(result.data.amount).toBe(16650);
        expect(result.data.date).toBe('2026-09-19');
        expect(result.data.category).toBe('food');
        expect(result.data.suggestedTags).toEqual(['Groceries', 'Snacks']);
        expect(result.data.confidence).toBe(0.98);
      }
    });

    it('filters out suggested tags that duplicate the category', async () => {
      const mockGeminiOutput = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    merchant: 'Bluebird Taxi',
                    amount: 50000,
                    date: '2026-09-19',
                    category: 'transport',
                    suggestedTags: ['transport', 'Taxi', 'Transports'],
                    confidence: 0.95,
                  }),
                },
              ],
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockGeminiOutput), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const { parseReceiptImageWithAI } = await import('@/features/cashflow/ai-actions');
      const result = await parseReceiptImageWithAI({
        base64: 'samplevalidbase64imagedata1234567890',
        mimeType: 'image/webp',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('transport');
        expect(result.data.suggestedTags).toEqual(['Taxi']);
      }
    });

    it('handles Gemini 429 rate limit error gracefully without retrying', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response('Rate limit exceeded', {
          status: 429,
          statusText: 'Too Many Requests',
        }),
      );

      const { parseReceiptImageWithAI } = await import('@/features/cashflow/ai-actions');
      const result = await parseReceiptImageWithAI({
        base64: 'samplevalidbase64imagedata1234567890',
        mimeType: 'image/webp',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('429');
      }
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('handles Gemini 503 high demand error gracefully and fails fast', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response('High demand spike', {
          status: 503,
          statusText: 'Service Unavailable',
        }),
      );

      const { parseReceiptImageWithAI } = await import('@/features/cashflow/ai-actions');
      const result = await parseReceiptImageWithAI({
        base64: 'samplevalidbase64imagedata1234567890',
        mimeType: 'image/webp',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('503');
      }
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(vi.mocked(global.fetch).mock.calls[0]?.[0]).toContain('gemini-3.5-flash-lite');
    });

    it('fails fast on 400 Bad Request', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response('Bad request payload', {
          status: 400,
          statusText: 'Bad Request',
        }),
      );
      global.fetch = fetchMock;

      const { parseReceiptImageWithAI } = await import('@/features/cashflow/ai-actions');
      const result = await parseReceiptImageWithAI({
        base64: 'samplevalidbase64imagedata1234567890',
        mimeType: 'image/webp',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('400');
      }
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
