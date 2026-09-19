import type { CashflowEntryDTO } from '@/types/dto';

export interface MerchantMatchResult {
  category: string;
  confidence: 'learned' | 'rule';
  suggestedType: 'income' | 'expense';
  suggestedTags?: string[];
  merchantName?: string;
}

export interface LearnedMerchantSummary {
  category: string;
  type: 'income' | 'expense';
  tags: string[];
  count: number;
}

export type LearnedMerchantIndex = Map<string, LearnedMerchantSummary>;

/**
 * Strips common banking transaction noise, payment gateway prefixes, and identifiers.
 */
export function normalizeMerchantDescription(rawDesc: string): string {
  if (!rawDesc) return '';

  return rawDesc
    .replace(
      /\b(pos debit|pos purchase|purchase auth|qris|transfer ke|transfer dari|trsf|bi-fast|kartu debit|kartu kredit|debit card|credit card|pembayaran|tagihan|bill payment|id:\s*\w+)\b/gi,
      ' ',
    )
    .replace(/[^\w\s&'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Built-in curated merchant aliases and keyword rules.
 */
interface BuiltInMerchantRule {
  pattern: RegExp;
  merchantName: string;
  category: string;
  type: 'income' | 'expense';
  defaultTags?: string[];
}

export const BUILT_IN_MERCHANT_RULES: readonly BuiltInMerchantRule[] = [
  // --- Food & Dining ---
  {
    pattern:
      /\b(grabfood|gofood|shopeefood|starbucks|mcdonalds?|mcd|kfc|burger king|pizza hut|subway|dominos?|dunkin|jco|kopi kenangan|janji jiwa|fore coffee|djournal|point coffee|cafe|coffee|kopi|restaurant|resto|bakery|breadtalk|roti|holland bakery|warteg|padang|naspad|nasi padang|nasi uduk|nasi goreng|nasgor|nasi|bakso|mie ayam|mie|sate|ayam geprek|geprek|pecel|sushi|ramen|boba|mixue|chatime|haidilao|solaria|hokben)\b/i,
    merchantName: 'Food & Dining',
    category: 'food',
    type: 'expense',
    defaultTags: ['food'],
  },

  // --- Groceries & Supermarkets ---
  {
    pattern:
      /\b(indomaret|alfamart|alfamidi|superindo|hypermart|transmart|carrefour|hero|ranch market|farmers market|grand lucky|lottemart|giant|grocery|groceries|supermarket|trader joe|whole foods|costco|walmart|target)\b/i,
    merchantName: 'Groceries',
    category: 'food',
    type: 'expense',
    defaultTags: ['groceries'],
  },

  // --- Transport & Fuel ---
  {
    pattern:
      /\b(grab|gojek|goride|gocar|uber|lyft|pertamina|spbu|shell|bp|total|chevron|exxon|mobil|petronas|bensin|petrol|fuel|gas|gas station|mrt|lrt|krl|kai|kereta|commuter|garuda|lion air|citilink|airasia|batik air|super air jet|singapore airlines|flight|airline|taxi|bluebird|tol|toll|tarif tol|jasamarga|parkir|parking)\b/i,
    merchantName: 'Transport & Commute',
    category: 'transport',
    type: 'expense',
    defaultTags: ['transport'],
  },

  // --- Utilities & Telecom ---
  {
    pattern:
      /\b(pln|listrik|token pln|pdam|air minum|telkom|indihome|biznet|myrepublic|first media|xl home|iconnet|bpjs|pbb|pajak|iuran|internet|wifi|pulsa|paket data|telkomsel|indosat|tri|smartfren|verizon|at&t|t-mobile|vodafone|electricity|water bill|utility|utilities)\b/i,
    merchantName: 'Utilities & Bills',
    category: 'utilities',
    type: 'expense',
    defaultTags: ['bills'],
  },

  // --- Entertainment & Subscriptions ---
  {
    pattern:
      /\b(netflix|spotify|youtube|disney|disney\+|hbo|apple tv|prime video|crunchyroll|steam|playstation|psn|nintendo|xbox|cinema|xxi|premiere|cgv|cinepolis|tiket\.com|traveloka|patreon|discord)\b/i,
    merchantName: 'Entertainment & Media',
    category: 'entertainment',
    type: 'expense',
    defaultTags: ['subscription'],
  },

  // --- Shopping & Retail ---
  {
    pattern:
      /\b(tokopedia|shopee|lazada|blibli|tiktok shop|amazon|zalora|uniqlo|zara|h&m|pull&bear|bershka|sephora|sociolla|decathlon|ikea|ace hardware|mr diy|gramedia|apple store|ibox|digimap|erafone|mall|retail|shopping)\b/i,
    merchantName: 'Shopping & Retail',
    category: 'shopping',
    type: 'expense',
    defaultTags: ['shopping'],
  },

  // --- Health, Pharmacy & Wellness ---
  {
    pattern:
      /\b(apotek|pharmacy|kimia farma|century|guardian|watsons|k24|klinik|clinic|rumah sakit|hospital|rsia|dokter|doctor|dental|gigi|gym|fitness|golds gym|celebrity fitness|f45|anytime fitness|vitamin|supplement|optik|optic|melawai|seis)\b/i,
    merchantName: 'Health & Wellness',
    category: 'health',
    type: 'expense',
    defaultTags: ['health'],
  },

  // --- Income: Salary & Payroll ---
  {
    pattern: /\b(gaji|payroll|salary|upah|honor|thr|bonus|overtime)\b/i,
    merchantName: 'Salary & Compensation',
    category: 'salary',
    type: 'income',
    defaultTags: ['payroll'],
  },

  // --- Income: Freelance & Client Work ---
  {
    pattern:
      /\b(upwork|fiverr|toptal|freelance|client payment|invoice payment|stripe payout|side gig|consulting fee)\b/i,
    merchantName: 'Freelance & Contract',
    category: 'freelance',
    type: 'income',
    defaultTags: ['freelance'],
  },

  // --- Income: Investments & Capital ---
  {
    pattern:
      /\b(dividend|dividen|coupon obligasi|bunga bank|yield|bibit|bareksa|ajaib|stockbit|binance|tokocrypto|indodax|reksadana|saham|crypto)\b/i,
    merchantName: 'Investment Yield',
    category: 'investment',
    type: 'income',
    defaultTags: ['investment'],
  },
];

/**
 * Analyzes previous transaction history in the book and builds an in-memory frequency index.
 * Matches normalized merchant keywords to the user's preferred category and tags.
 */
export function learnMerchantRulesFromEntries(
  entries: CashflowEntryDTO[],
): LearnedMerchantIndex {
  const index: LearnedMerchantIndex = new Map();
  if (!entries || entries.length === 0) return index;

  interface AggregatedStats {
    typeCounts: { income: number; expense: number };
    categoryCounts: Map<string, number>;
    tagCounts: Map<string, number>;
    totalCount: number;
  }

  const aggregates = new Map<string, AggregatedStats>();

  for (const entry of entries) {
    if (!entry.description || !entry.category) continue;
    const normalized = normalizeMerchantDescription(entry.description);
    if (!normalized || normalized.length < 3) continue;

    // Index by full normalized description and primary keyword tokens
    const tokens = normalized.split(' ').filter((t) => t.length >= 3);
    const keysToIndex = new Set<string>([normalized, ...tokens]);

    for (const key of keysToIndex) {
      let stats = aggregates.get(key);
      if (!stats) {
        stats = {
          typeCounts: { income: 0, expense: 0 },
          categoryCounts: new Map<string, number>(),
          tagCounts: new Map<string, number>(),
          totalCount: 0,
        };
        aggregates.set(key, stats);
      }

      stats.totalCount += 1;
      if (entry.type === 'income') {
        stats.typeCounts.income += 1;
      } else {
        stats.typeCounts.expense += 1;
      }

      const catCount = stats.categoryCounts.get(entry.category) ?? 0;
      stats.categoryCounts.set(entry.category, catCount + 1);

      if (entry.tags && Array.isArray(entry.tags)) {
        for (const tag of entry.tags) {
          if (tag) {
            const tCount = stats.tagCounts.get(tag) ?? 0;
            stats.tagCounts.set(tag, tCount + 1);
          }
        }
      }
    }
  }

  // Determine winning category, dominant type, and frequent tags for each key
  for (const [key, stats] of aggregates.entries()) {
    // Require at least 1 entry for exact/token matches
    let dominantCategory = '';
    let maxCategoryCount = 0;
    for (const [cat, count] of stats.categoryCounts.entries()) {
      if (count > maxCategoryCount) {
        maxCategoryCount = count;
        dominantCategory = cat;
      }
    }

    if (!dominantCategory) continue;

    const dominantType: 'income' | 'expense' =
      stats.typeCounts.income > stats.typeCounts.expense ? 'income' : 'expense';

    // Top tags appearing in at least 30% of entries
    const frequentTags: string[] = [];
    for (const [tag, count] of stats.tagCounts.entries()) {
      if (count >= Math.max(1, stats.totalCount * 0.3)) {
        frequentTags.push(tag);
      }
    }

    index.set(key, {
      category: dominantCategory,
      type: dominantType,
      tags: frequentTags,
      count: stats.totalCount,
    });
  }

  return index;
}

/**
 * Resolves category, type, and tags from a description using learned history first,
 * falling back to curated merchant alias rules.
 */
export function resolveMerchantCategory(
  description: string,
  typePreference?: 'income' | 'expense',
  learnedSource?: LearnedMerchantIndex | CashflowEntryDTO[],
): MerchantMatchResult | null {
  if (!description || !description.trim()) return null;

  const normalized = normalizeMerchantDescription(description);
  if (!normalized) return null;

  // 1. Check Learned History (Highest Priority)
  let learnedIndex: LearnedMerchantIndex | null = null;
  if (learnedSource) {
    if (learnedSource instanceof Map) {
      learnedIndex = learnedSource;
    } else if (Array.isArray(learnedSource)) {
      learnedIndex = learnMerchantRulesFromEntries(learnedSource);
    }
  }

  if (learnedIndex && learnedIndex.size > 0) {
    // Check full normalized string first
    const fullMatch = learnedIndex.get(normalized);
    if (fullMatch && (!typePreference || fullMatch.type === typePreference)) {
      return {
        category: fullMatch.category,
        confidence: 'learned',
        suggestedType: fullMatch.type,
        suggestedTags: fullMatch.tags.length > 0 ? fullMatch.tags : undefined,
        merchantName: description.trim(),
      };
    }

    // Check individual tokens
    const tokens = normalized.split(' ').filter((t) => t.length >= 3);
    for (const token of tokens) {
      const tokenMatch = learnedIndex.get(token);
      if (
        tokenMatch &&
        tokenMatch.count >= 2 &&
        (!typePreference || tokenMatch.type === typePreference)
      ) {
        return {
          category: tokenMatch.category,
          confidence: 'learned',
          suggestedType: tokenMatch.type,
          suggestedTags:
            tokenMatch.tags.length > 0 ? tokenMatch.tags : undefined,
          merchantName: description.trim(),
        };
      }
    }
  }

  // 2. Check Curated Built-In Rules (Second Priority)
  for (const rule of BUILT_IN_MERCHANT_RULES) {
    if (typePreference && rule.type !== typePreference) continue;
    if (rule.pattern.test(normalized)) {
      return {
        category: rule.category,
        confidence: 'rule',
        suggestedType: rule.type,
        suggestedTags: rule.defaultTags,
        merchantName: rule.merchantName,
      };
    }
  }

  return null;
}
