import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractReceiptData, compressReceiptImage } from '@/features/cashflow/lib/receipt-extractor';

vi.mock('@/features/cashflow/ai-actions', () => ({
  parseReceiptImageWithAI: vi.fn(),
}));

const VALID_FILE_CONTENT = 'a'.repeat(2500);

describe('Direct Multimodal Receipt Extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects files with insufficient base64 entropy as blank or invalid', async () => {
    const tinyFile = new File(['tiny'], 'receipt.jpg', { type: 'image/jpeg' });
    await expect(compressReceiptImage(tinyFile)).rejects.toThrow(
      'The image appears to be blank or contains no legible text.',
    );
  });

  it('compressReceiptImage converts valid file to base64 in non-browser/node environment', async () => {
    const fakeFile = new File([VALID_FILE_CONTENT], 'receipt.jpg', { type: 'image/jpeg' });
    const result = await compressReceiptImage(fakeFile);

    expect(result.mimeType).toBe('image/jpeg');
    expect(typeof result.base64).toBe('string');
    expect(result.base64.length).toBeGreaterThanOrEqual(2000);
  });

  it('extractReceiptData coordinates compression and calls parseReceiptImageWithAI', async () => {
    const { parseReceiptImageWithAI } = await import('@/features/cashflow/ai-actions');
    const mockData = {
      merchant: 'Starbucks',
      amount: 10.5,
      date: '2026-09-15',
      category: 'food',
      suggestedTags: ['coffee'],
      confidence: 0.95,
    };

    vi.mocked(parseReceiptImageWithAI).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const progressLogs: Array<{ progress: number; status: string }> = [];
    const fakeFile = new File([VALID_FILE_CONTENT], 'receipt.png', { type: 'image/png' });

    const result = await extractReceiptData(fakeFile, (progress, status) => {
      progressLogs.push({ progress, status });
    });

    expect(result).toEqual(mockData);
    expect(parseReceiptImageWithAI).toHaveBeenCalledTimes(1);
    expect(progressLogs.length).toBeGreaterThan(0);
    expect(progressLogs[progressLogs.length - 1]?.progress).toBe(100);
  });

  it('extractReceiptData throws error when AI parsing fails', async () => {
    const { parseReceiptImageWithAI } = await import('@/features/cashflow/ai-actions');
    vi.mocked(parseReceiptImageWithAI).mockResolvedValue({
      success: false,
      error: 'GEMINI_API_KEY is not configured',
    });

    const fakeFile = new File([VALID_FILE_CONTENT], 'receipt.webp', { type: 'image/webp' });

    await expect(extractReceiptData(fakeFile)).rejects.toThrow(
      'GEMINI_API_KEY is not configured',
    );
  });
});
