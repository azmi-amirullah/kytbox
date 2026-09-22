'use server';

import { z } from 'zod';
import { env } from '@/env';
import { getAuthenticatedUserWithRateLimit } from '@/lib/auth-with-rate-limit';
import * as Sentry from '@sentry/nextjs';
import { EXPENSE_CATEGORIES, isTagDuplicateOfCategory } from './constants';
import type { ExtractedReceiptData } from './lib/receipt-extractor';

const parseReceiptImageInputSchema = z.object({
  base64: z.string().min(10, 'Base64 data cannot be empty').max(10_000_000, 'Image data exceeds maximum size'),
  mimeType: z.enum(['image/webp', 'image/jpeg', 'image/png', 'image/jpg']),
});

const geminiApiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(
            z.object({
              text: z.string(),
            }),
          ),
        }),
      }),
    )
    .min(1),
});

const geminiReceiptSchema = z.object({
  merchant: z.string().nullable(),
  amount: z.number().nullable(),
  date: z.string().nullable(),
  category: z.string().nullable(),
  suggestedTags: z.array(z.string()).optional().default([]),
  confidence: z.number().min(0).max(1),
});

export type ParseReceiptResult =
  | { success: true; data: ExtractedReceiptData }
  | { success: false; error: string };

const validCategorySlugs = EXPENSE_CATEGORIES.map((c) => c.value);

const geminiGenerationConfig = {
  responseMimeType: 'application/json',
  responseSchema: {
    type: 'OBJECT',
    properties: {
      merchant: {
        type: 'STRING',
        nullable: true,
        description: 'Clean merchant or store name without platform badges or noise',
      },
      amount: {
        type: 'NUMBER',
        nullable: true,
        description: 'Final total transaction amount paid as a positive number',
      },
      date: {
        type: 'STRING',
        nullable: true,
        description: 'Transaction date in ISO YYYY-MM-DD format',
      },
      category: {
        type: 'STRING',
        nullable: true,
        enum: validCategorySlugs,
        description: 'Category slug for expense',
      },
      suggestedTags: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: '1 to 3 relevant tags with the first character uppercase (e.g. ["Coffee", "Cafe"], ["Groceries", "Supermarket"]). Must NOT duplicate the chosen category.',
      },
      confidence: {
        type: 'NUMBER',
        description: 'Confidence score between 0.0 and 1.0',
      },
    },
    required: ['merchant', 'amount', 'date', 'category', 'suggestedTags', 'confidence'],
  },
};

const RECEIPT_EXTRACTION_INSTRUCTIONS = `Valid expense categories:
- food (restaurants, cafes, food delivery, groceries, snacks)
- transport (rideshare, taxi, fuel, parking, public transit, tolls)
- utilities (electricity, water, internet, phone credit, streaming subscriptions)
- entertainment (movies, games, events, hobbies)
- shopping (clothing, electronics, home goods, personal care)
- health (pharmacy, doctor, dental, fitness, medical)
- other (unmatched or miscellaneous expenses)

Rules:
1. merchant: Extract the store, merchant, biller, or transfer recipient name. Do NOT use the banking app or platform name (e.g., ignore "BCA Mobile", "GoPay", "Shopee", "App Store"). Strip platform badges (e.g. "Official Store", "Mall", "Star+").
2. amount: Extract the final total monetary amount paid as a positive number.
   - Deduct discounts and vouchers; include taxes, service charges, and admin fees.
   - Never extract cash tendered ("Tunai"), change returned ("Kembali"), subtotals, or barcodes.
   - Thousand/Decimal separators: Infer from context/currency (e.g., "Rp 50.000" or "50.000,00" = 50000; "$50.00" = 50).
3. date: Extract the transaction date formatted strictly as ISO "YYYY-MM-DD".
   - If year is omitted on the receipt, assume 2026.
   - If year is 2 digits (e.g., '26), convert to 20XX.
   - If date cannot be determined, return null.
4. category: Choose the single best category slug from the valid categories list above based on the items or merchant type. If unsure, use "other".
5. suggestedTags: Provide 1 to 3 short keyword tags where the first character of each tag is uppercase (e.g. ["Coffee", "Cafe"], ["Groceries", "Supermarket"]). Never suggest a tag that duplicates the chosen category (e.g. if category is transport, do not include "Transport"; if food, do not include "Food").
6. confidence: A number between 0.0 and 1.0 reflecting extraction certainty.`;

const GEMINI_RECEIPT_MODEL = 'gemini-3.5-flash-lite';

/**
 * Server action to parse a receipt image directly using Gemini 3.5 Flash-Lite multimodal vision.
 * Bypasses traditional OCR, preserving 2D layout, columns, and visual context.
 */
export async function parseReceiptImageWithAI(input: {
  base64: string;
  mimeType: 'image/webp' | 'image/jpeg' | 'image/png' | 'image/jpg';
}): Promise<ParseReceiptResult> {
  try {
    // 1. Authenticate user & enforce Upstash rate limiting
    await getAuthenticatedUserWithRateLimit();

    // 2. Validate input boundary
    const validation = parseReceiptImageInputSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: 'Invalid receipt image input' };
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'GEMINI_API_KEY is not configured' };
    }

    const normalizedMimeType =
      validation.data.mimeType === 'image/jpg' ? 'image/jpeg' : validation.data.mimeType;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_RECEIPT_MODEL}:generateContent?key=${apiKey}`;

    const prompt = `You are an expert financial receipt and transaction parser. Analyze the provided receipt image or transaction screenshot and extract structured cashflow data.

${RECEIPT_EXTRACTION_INSTRUCTIONS}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: normalizedMimeType,
                  data: validation.data.base64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: geminiGenerationConfig,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return {
        success: false,
        error: `Gemini API returned status ${response.status}: ${errorBody.slice(0, 150)}`,
      };
    }

    const payload: unknown = await response.json();
    const apiResult = geminiApiResponseSchema.safeParse(payload);

    if (!apiResult.success) {
      return { success: false, error: 'Unexpected response structure from Gemini API' };
    }

    const candidate = apiResult.data.candidates[0];
    const part = candidate?.content?.parts[0];
    if (!part) {
      return { success: false, error: 'No parts in Gemini response content' };
    }

    const parsedJson: unknown = JSON.parse(part.text);
    const parsedData = geminiReceiptSchema.safeParse(parsedJson);

    if (!parsedData.success) {
      return { success: false, error: 'Gemini JSON output failed schema validation' };
    }

    const { merchant, amount, date, category, suggestedTags, confidence } = parsedData.data;

    const formattedTags = (suggestedTags ?? [])
      .map((tag) => {
        const cleaned = tag.trim().replace(/^#/, '');
        if (!cleaned) return '';
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      })
      .filter(
        (t): t is string =>
          Boolean(t) && !isTagDuplicateOfCategory(t, category),
      );

    return {
      success: true,
      data: {
        merchant,
        amount,
        date,
        category,
        suggestedTags: formattedTags,
        confidence,
      },
    };
  } catch (err) {
    Sentry.captureException(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown AI parsing error';
    return { success: false, error: errorMessage };
  }
}
