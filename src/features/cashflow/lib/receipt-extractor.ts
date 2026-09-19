import { resolveMerchantCategory } from './merchant-rules';

export interface ExtractedReceiptData {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  category: string | null;
  suggestedTags?: string[];
  rawText: string;
  confidence: number;
}

/**
 * Preprocesses an image file on an HTML Canvas:
 * 1. Resizes large images down to max 1500px dimension for faster, more accurate OCR.
 * 2. Converts pixels to grayscale and applies slight contrast stretching.
 * 3. Returns a high-contrast Blob suitable for OCR engine.
 */
export async function preprocessReceiptImage(file: File): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      // Adaptive scaling: Upscale small photos to ensure text height meets Tesseract's minimum LSTM threshold (~20px x-height).
      // Downscale ultra-high-res photos to 2200px max edge to optimize OCR speed and memory.
      const minLongEdge = 1600;
      const maxLongEdge = 2200;
      const currentLongEdge = Math.max(width, height);

      if (currentLongEdge < minLongEdge) {
        const scale = minLongEdge / currentLongEdge;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      } else if (currentLongEdge > maxLongEdge) {
        const scale = maxLongEdge / currentLongEdge;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Grayscale conversion and contrast stretch
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Luminance formula
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          // Slight contrast enhancement
          const enhanced = gray < 128 ? Math.max(0, gray * 0.8) : Math.min(255, gray * 1.2);

          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
        }

        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          'image/png',
        );
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Helper to identify and filter out phone status bar, app navigation, action buttons, and receipt noise.
 */
function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2) return true;

  // 0. Symbols, single characters, or repetitive noise like "i = i", "|", "\", "?", "== Ty a"
  if (/^[\s|/\\=~_\-+*#?.,:;a-z]{1,4}$/i.test(trimmed) && !/^[a-z]{3,}$/i.test(trimmed)) {
    return true;
  }
  if (/^[=~_\-+*|\\/]+\s*[a-z0-9]?\s*[=~_\-+*|\\/]*$/i.test(trimmed)) {
    return true;
  }
  if (/^[a-z]\s*=\s*[a-z]$/i.test(trimmed)) {
    return true;
  }

  // 1. Mobile phone status bar (e.g. "2:52 al 4G @", "14:30 5G", "9:41 AM 100%")
  if (/\b\d{1,2}[:.]\d{2}\b/.test(trimmed) && /\b(?:4g|5g|lte|volte|wifi|al|am|pm|\d{1,3}%|kb\/s|mb\/s)\b/i.test(trimmed)) {
    return true;
  }
  if (/^\s*\d{1,2}[:.]\d{2}(?:\s*[ap]m)?\s*$/i.test(trimmed)) {
    return true;
  }
  if (/^(?:4g|5g|lte|wifi|volte|\d{1,3}%|[\s\d:./%@|&~—_#*+<>-])+$/i.test(trimmed) && trimmed.length < 20) {
    return true;
  }

  // 2. Mobile app navigation / screen headers (e.g. "Pesanan Saya", "Rincian Pesanan", "Detail Transaksi")
  if (
    /\b(pesanan saya|my orders?|rincian pesanan|detail pesanan|order details?|riwayat transaksi|detail transaksi|bukti transfer|status transaksi|status pesanan|daftar pesanan|keranjang saya|checkout)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }

  // 3. Navigation tabs (e.g. "Semua Belum Bayar Dikemas Dikirim Selesai")
  if (
    /(?:semua\s+belum\s*bayar|dikemas\s+dikirim|dikirim\s+selesai|belum\s*bayar|dibatalkan\s+pengembalian)/i.test(
      trimmed,
    )
  ) {
    return true;
  }

  // 4. Action buttons & recommendations (e.g. "Hubungi Penjual", "Beli Lagi", "Lacak", "Kamu Mungkin Juga Suka")
  if (
    /^(?:hubungi penjual|chat penjual|beli lagi|lacak|batalkan pesanan|ajukan pengembalian|rincian|lihat detail|kembali|beranda)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  if (/^[-—_\s]*(?:kamu mungkin juga suka|rekomendasi|you may also like)[-—_\s]*$/i.test(trimmed)) {
    return true;
  }

  // 5. Delivery estimates & shipping metadata
  if (/\b(?:estimasi tiba|perkiraan tiba|delivery estimate|ongkos kirim|ongkir)\b/i.test(trimmed)) {
    return true;
  }

  // 6. Common receipt metadata / tax / phone / cashier noise
  if (
    /^(?:npwp|tax|telp|phone|date|tanggal|receipt|bill|invoice|table|meja|guest|order|kasir|cashier|antrian|queue|no\.)/i.test(
      trimmed,
    )
  ) {
    return true;
  }

  // 7. Pure digits / barcodes
  if (/^\d+$/.test(trimmed.replace(/[\s\-_.:/]/g, ''))) {
    return true;
  }

  // 8. Currency/price line without merchant
  if (/^(?:rp|idr|\$|€|£)\s*[0-9.,]+$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Strips e-commerce platform badges, logo noise, and status tags from store name lines.
 * E.g. "AEROSTREET Official Shop Dikemas" -> "AEROSTREET"
 * E.g. "YF Top 100 | 2" -> "Top 100"
 */
function cleanMerchantLine(line: string): string {
  return line
    .replace(/^(?:mall\s*ori|mall|star\+|star|official\s*store|official\s*shop)\s+/i, '')
    .replace(/\s+(?:dikemas|dikirim|selesai|dibatalkan|menunggu pembayaran|pesanan dibuat)$/i, '')
    .replace(/\s+(?:official\s*shop|official\s*store|flagship\s*store)\b/i, '')
    .replace(/^[^\w\s]+|[^\w\s]+$/g, '')
    .replace(/^[a-z]{1,2}\s+(?=[a-z0-9])/i, '') // strip leading 1-2 char OCR artifacts like "YF ", "ae ", "? "
    .replace(/\s*\|\s*\d+.*$/i, '') // strip trailing "| 2" or "| 1"
    .replace(/\s*\|\s*$/i, '')
    .trim();
}

/**
 * Intelligent regex and keyword extraction for raw receipt OCR text.
 * Extracts merchant name, total monetary amount, transaction date, and predicted category.
 */
export function parseReceiptText(rawText: string): ExtractedReceiptData {
  if (!rawText || !rawText.trim()) {
    return {
      merchant: null,
      amount: null,
      date: null,
      category: null,
      rawText: '',
      confidence: 0,
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let merchant: string | null = null;
  let category: string | null = null;
  let suggestedTags: string[] | undefined = undefined;
  let merchantLineIndex = -1;

  // 1. Merchant Detection: Scan non-noise lines (up to top 15 lines to accommodate mobile status bar and tabs)
  const candidateLines = lines.slice(0, 15);
  for (let idx = 0; idx < candidateLines.length; idx++) {
    const line = candidateLines[idx];
    if (isNoiseLine(line)) continue;

    const cleaned = cleanMerchantLine(line);
    if (cleaned.length < 3) continue;

    const match = resolveMerchantCategory(cleaned);
    if (match) {
      merchant = match.merchantName || cleaned;
      category = match.category;
      suggestedTags = match.suggestedTags;
      merchantLineIndex = idx;
      break;
    }
  }

  // Fallback merchant: first prominent non-noise line from top
  if (!merchant) {
    for (let idx = 0; idx < candidateLines.length; idx++) {
      const line = candidateLines[idx];
      if (isNoiseLine(line)) continue;

      const cleaned = cleanMerchantLine(line);
      if (cleaned.length >= 3) {
        merchant = cleaned;
        merchantLineIndex = idx;
        const match = resolveMerchantCategory(cleaned);
        if (match) {
          category = match.category;
          suggestedTags = match.suggestedTags;
        }
        break;
      }
    }
  }

  // 2. Date Detection
  let date: string | null = null;
  const isoDateRegex = /\b(202\d[-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01]))\b/;
  const dmyDateRegex = /\b((?:0[1-9]|[12]\d|3[01])[-/.](?:0[1-9]|1[0-2])[-/.](?:202\d|2\d))\b/;
  const wordDateRegex =
    /\b((?:0?[1-9]|[12]\d|3[01])\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:202\d))\b/i;

  for (const line of lines) {
    const isoMatch = line.match(isoDateRegex);
    if (isoMatch) {
      date = isoMatch[1].replace(/[/.]/g, '-');
      break;
    }

    const dmyMatch = line.match(dmyDateRegex);
    if (dmyMatch) {
      const parts = dmyMatch[1].split(/[-/.]/);
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        const month = parts[1].padStart(2, '0');
        const day = parts[0].padStart(2, '0');
        date = `${year}-${month}-${day}`;
        break;
      }
    }

    const wordMatch = line.match(wordDateRegex);
    if (wordMatch) {
      const parts = wordMatch[1].split(/\s+/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const monthKey = parts[1].toLowerCase().slice(0, 3);
        const year = parts[2];
        const monthMap: Record<string, string> = {
          jan: '01',
          feb: '02',
          mar: '03',
          apr: '04',
          may: '05',
          jun: '06',
          jul: '07',
          aug: '08',
          sep: '09',
          oct: '10',
          nov: '11',
          dec: '12',
        };
        const month = monthMap[monthKey];
        if (month) {
          date = `${year}-${month}-${day}`;
          break;
        }
      }
    }
  }

  // 3. Amount Detection
  let amount: number | null = null;

  // Pattern A: E-Commerce Order Cards (e.g. "Total 1 produk: Rp141.298", "Total Pesanan: Rp...")
  // Search from the detected merchant line downwards to capture the matching order's total
  const ecommerceTotalRegex =
    /(?:total\s+\d+\s+produk|total\s+pesanan|total\s+belanja|total\s+pembayaran)\s*:\s*(?:rp|idr|\$|€|£)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+)/i;

  const searchStartIndex = merchantLineIndex >= 0 ? merchantLineIndex : 0;
  for (let i = searchStartIndex; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(ecommerceTotalRegex);
    if (match && match[1]) {
      const parsedAmt = parseMonetaryString(match[1]);
      if (parsedAmt !== null && parsedAmt > 0) {
        amount = parsedAmt;
        break;
      }
    }
  }

  // Pattern B: Traditional Receipt Pattern (search in reverse from bottom)
  if (amount === null) {
    const totalKeywords =
      /(total|grand total|jumlah|subtotal|amount due|tagihan|bayar|net amount|total bayar)/i;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (totalKeywords.test(line)) {
        // Check current line first, then next line for two-column thermal receipts (e.g. "Total Rp.:" on line i, "610,815" on line i+1)
        const candidateLines = [line];
        if (i + 1 < lines.length && !totalKeywords.test(lines[i + 1])) {
          candidateLines.push(lines[i + 1]);
        }
        for (const cand of candidateLines) {
          const numMatches = cand.match(
            /(?:rp|idr|\$|€|£)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+)/gi,
          );
          if (numMatches && numMatches.length > 0) {
            const lastNumStr = numMatches[numMatches.length - 1]
              .replace(/(?:rp|idr|\$|€|£)\s*/gi, '')
              .trim();
            const parsedAmt = parseMonetaryString(lastNumStr);
            if (parsedAmt !== null && parsedAmt > 0) {
              amount = parsedAmt;
              break;
            }
          }
        }
        if (amount !== null) break;
      }
    }
  }

  // Fallback: If no keyword found, find the largest monetary number in the bottom half of the text
  if (amount === null) {
    const bottomHalf = lines.slice(Math.floor(lines.length / 2));
    let maxVal = 0;
    for (const line of bottomHalf) {
      const nums = line.match(/\b([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]{2,})\b/g);
      if (nums) {
        for (const n of nums) {
          // Ignore raw barcodes (e.g. 8991001780140, 089686010312, 12931025000)
          if (n.length >= 7 && !/[.,]/.test(n)) continue;

          const val = parseMonetaryString(n);
          if (val !== null && val > maxVal && val < 100000000) {
            maxVal = val;
          }
        }
      }
    }
    if (maxVal > 0) {
      amount = maxVal;
    }
  }

  // Calculate confidence score (0 to 1)
  let score = 0;
  if (amount !== null) score += 0.4;
  if (merchant !== null) score += 0.3;
  if (date !== null) score += 0.2;
  if (category !== null) score += 0.1;

  return {
    merchant,
    amount,
    date,
    category,
    suggestedTags,
    rawText,
    confidence: Math.round(score * 100) / 100,
  };
}

/**
 * Parses numeric strings in both Western ($12.50 or $1,250.00) and Indonesian (Rp 125.000 or 12.500,50) formats.
 */
function parseMonetaryString(val: string): number | null {
  const cleaned = val.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;

  // Indonesian/European format: 125.000,00 or 125.000
  if (/\.\d{3},\d{2}$/.test(cleaned)) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(normalized);
    return isNaN(n) ? null : n;
  }
  if (/,\d{3}\.\d{2}$/.test(cleaned)) {
    const normalized = cleaned.replace(/,/g, '');
    const n = parseFloat(normalized);
    return isNaN(n) ? null : n;
  }

  // Thousands separator with dot: 125.000
  if (/^\d{1,3}(?:\.\d{3})+$/.test(cleaned)) {
    const n = parseFloat(cleaned.replace(/\./g, ''));
    return isNaN(n) ? null : n;
  }
  // Thousands separator with comma: 125,000
  if (/^\d{1,3}(?:,\d{3})+$/.test(cleaned)) {
    const n = parseFloat(cleaned.replace(/,/g, ''));
    return isNaN(n) ? null : n;
  }

  // Standard float: 12.50
  if (/^\d+\.\d{1,2}$/.test(cleaned)) {
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }
  // Comma decimal: 12,50
  if (/^\d+,\d{1,2}$/.test(cleaned)) {
    const n = parseFloat(cleaned.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  // Plain integers: 125000
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/**
 * Performs client-side Zero-Storage OCR extraction on a receipt image.
 * The image is processed in browser memory and NEVER uploaded to Supabase Storage.
 */
export async function extractReceiptData(
  file: File,
  onProgress?: (progress: number, status: string) => void,
): Promise<ExtractedReceiptData> {
  onProgress?.(10, 'Preprocessing receipt image...');
  const processedBlob = await preprocessReceiptImage(file);

  onProgress?.(30, 'Initializing OCR engine...');
  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker(['eng', 'ind'], 1, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract',
    langPath: '/tesseract',
    workerBlobURL: false,
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(30 + Math.round(m.progress * 60), 'Recognizing receipt text...');
      }
    },
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(processedBlob);

    onProgress?.(95, 'Parsing merchant, amount, and date...');
    const result = parseReceiptText(text);
    onProgress?.(100, 'Complete');
    return result;
  } finally {
    await worker.terminate();
  }
}
