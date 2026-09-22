import { parseReceiptImageWithAI } from '../ai-actions';

export interface ExtractedReceiptData {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  category: string | null;
  suggestedTags?: string[];
  rawText?: string;
  confidence: number;
}

/**
 * Preprocesses and compresses a receipt image on an HTML Canvas:
 * 1. Resizes large images down to a max 1200px edge to minimize bandwidth and latency.
 * 2. Encodes to lightweight WebP (or JPEG fallback) at 80% quality (~100-200 KB).
 * 3. Extracts Base64 string for direct Multimodal AI transmission without storage.
 */
export async function compressReceiptImage(
  file: File,
): Promise<{ base64: string; mimeType: 'image/webp' | 'image/jpeg' | 'image/png' }> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType =
      file.type === 'image/png'
        ? 'image/png'
        : file.type === 'image/jpeg'
          ? 'image/jpeg'
          : 'image/webp';
    return { base64, mimeType };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      const maxEdge = 1200;
      const currentLongEdge = Math.max(width, height);

      if (currentLongEdge > maxEdge) {
        const scale = maxEdge / currentLongEdge;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // Fallback to direct file read if canvas context is unavailable
        if (file.size > 2 * 1024 * 1024) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Image is too large to process without canvas support.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            const base64 = result.split(',')[1] ?? '';
            resolve({ base64, mimeType: 'image/webp' });
          } else {
            reject(new Error('Failed to read image as base64'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Export as WebP
      const dataUrl = canvas.toDataURL('image/webp', 0.8);
      if (dataUrl.startsWith('data:image/webp')) {
        const base64 = dataUrl.replace(/^data:image\/webp;base64,/, '');
        resolve({ base64, mimeType: 'image/webp' });
      } else {
        // Fallback to JPEG if browser canvas doesn't support WebP export
        const jpegUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = jpegUrl.replace(/^data:image\/jpeg;base64,/, '');
        resolve({ base64, mimeType: 'image/jpeg' });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}

/**
 * Performs client-side Zero-Storage receipt extraction using Gemini 3.8 Flash Multimodal AI.
 * The image is processed in browser memory and NEVER saved to permanent storage.
 */
export async function extractReceiptData(
  file: File,
  onProgress?: (progress: number, status: string) => void,
): Promise<ExtractedReceiptData> {
  onProgress?.(20, 'Optimizing receipt image...');
  const { base64, mimeType } = await compressReceiptImage(file);

  onProgress?.(50, 'Analyzing receipt with Gemini AI...');
  let result;
  try {
    result = await parseReceiptImageWithAI({ base64, mimeType });
  } catch (err: unknown) {
    const isNetwork =
      err instanceof Error &&
      (err.message.includes('Load failed') ||
        err.message.includes('fetch') ||
        err.name === 'TypeError');
    throw new Error(
      isNetwork
        ? 'Network connection lost during receipt scanning. Please check your connection and try again.'
        : 'Failed to scan receipt image.',
    );
  }

  if (!result.success) {
    throw new Error(result.error);
  }

  onProgress?.(100, 'Complete');
  return result.data;
}
