import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Path,
  Polyline,
  Line,
  Circle,
  Rect,
} from '@react-pdf/renderer';
import type { FinancialReportData } from '../math';
import { formatCategoryName } from '../constants';
import { formatCurrency } from '@/lib/currency';
import { formatAppDate } from '@/lib/date-only';

// ─── Color tokens (matching Shadcn / Kytbox design system) ───────────────────
const C = {
  foreground: '#18181b', // zinc-900 / foreground
  mutedFg: '#71717a', // zinc-500 / muted-foreground
  primary: '#10b981', // emerald-500
  emerald: '#16a34a', // emerald-600
  emeraldBg: '#f0fdf4', // emerald-50
  border: '#e7e5dc', // warm border matching Kytbox theme
  muted: '#f8f7f0', // warm ivory (#f8f7f0) matching Kytbox --muted
  warmBox: '#faf9f5', // soft ivory box background
  track: '#edebe3', // progress bar track
  rose: '#e11d48', // rose-600
  roseBg: '#fff1f2', // rose-50
  white: '#ffffff',
};

// ─── Vector Icons (Native @react-pdf/renderer SVG primitives) ────────────────

function TrendingUpIcon({ color = C.emerald, size = 9 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox='0 0 24 24'>
      <Polyline
        points='23 6 13.5 15.5 8.5 10.5 1 18'
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
      <Polyline
        points='17 6 23 6 23 12'
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
    </Svg>
  );
}

function TrendingDownIcon({ color = C.rose, size = 9 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox='0 0 24 24'>
      <Polyline
        points='23 18 13.5 8.5 8.5 13.5 1 6'
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
      <Polyline
        points='17 18 23 18 23 12'
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
    </Svg>
  );
}

function PercentIcon({ color = C.mutedFg, size = 9 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox='0 0 24 24'>
      <Line
        x1='19'
        y1='5'
        x2='5'
        y2='19'
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
      <Circle cx='6.5' cy='6.5' r='2.5' stroke={color} strokeWidth={2.5} fill='none' />
      <Circle cx='17.5' cy='17.5' r='2.5' stroke={color} strokeWidth={2.5} fill='none' />
    </Svg>
  );
}

function CalendarIcon({ color = C.mutedFg, size = 8 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox='0 0 24 24'>
      <Rect
        x='3'
        y='4'
        width='18'
        height='18'
        rx='2'
        stroke={color}
        strokeWidth={2}
        fill='none'
      />
      <Line
        x1='16'
        y1='2'
        x2='16'
        y2='6'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
      <Line
        x1='8'
        y1='2'
        x2='8'
        y2='6'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
      <Line
        x1='3'
        y1='10'
        x2='21'
        y2='10'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
    </Svg>
  );
}

function ClockIcon({ color = C.mutedFg, size = 7.5 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox='0 0 24 24'>
      <Circle cx='12' cy='12' r='10' stroke={color} strokeWidth={2} fill='none' />
      <Polyline
        points='12 6 12 12 16 14'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
    </Svg>
  );
}

function FileSpreadsheetIcon({ color = C.mutedFg, size = 7.5 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox='0 0 24 24'>
      <Path
        d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
      <Polyline
        points='14 2 14 8 20 8'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
      <Path d='M8 13h8' stroke={color} strokeWidth={1.5} strokeLinecap='round' fill='none' />
      <Path d='M8 17h8' stroke={color} strokeWidth={1.5} strokeLinecap='round' fill='none' />
    </Svg>
  );
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: C.foreground,
    backgroundColor: C.white,
    padding: 36,
    paddingBottom: 48,
  },
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 14,
  },
  headerLeft: { flex: 1 },
  statementLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    color: C.primary,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: C.foreground,
    marginBottom: 3,
  },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  periodLabel: { fontSize: 8, color: C.mutedFg },
  periodValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.foreground },
  headerRight: { alignItems: 'flex-end', gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaLabel: { fontSize: 7.5, color: C.mutedFg },
  metaValue: { fontSize: 7.5, color: C.mutedFg },
  currencyBadge: {
    backgroundColor: C.muted,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  currencyText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.mutedFg },

  // ── KPI Summary Cards ───────────────────────────────────────────────────────
  kpiContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 5,
    padding: 8,
    justifyContent: 'space-between',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  kpiLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    color: C.mutedFg,
    textTransform: 'uppercase',
  },
  badgePill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  kpiValue: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  kpiSub: { fontSize: 6.5, color: C.mutedFg },

  // ── Category Section ────────────────────────────────────────────────────────
  categorySection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  categoryBoxExpense: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 5,
    padding: 8,
    backgroundColor: C.roseBg,
  },
  categoryBoxIncome: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 5,
    padding: 8,
    backgroundColor: C.emeraldBg,
  },
  sectionTitleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    color: C.mutedFg,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 6.5,
    color: C.mutedFg,
  },
  categoryItem: {
    paddingVertical: 2.5,
    marginBottom: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: { fontSize: 7.5, color: C.foreground, flex: 1 },
  categoryAmountBox: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  categoryAmount: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.foreground },
  categoryPct: { fontSize: 6.5, color: C.mutedFg },
  progressBarTrackExpense: {
    height: 2,
    backgroundColor: '#ffe4e6',
    borderRadius: 1,
    marginTop: 2,
    overflow: 'hidden',
  },
  progressBarTrackIncome: {
    height: 2,
    backgroundColor: '#dcfce7',
    borderRadius: 1,
    marginTop: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 2,
    borderRadius: 1,
  },

  // ── Top Expenses Spotlight Table ───────────────────────────────────────────
  spotlightSection: {
    marginBottom: 14,
  },
  spotlightTable: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  spotlightHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.muted,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  spotlightTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  colCatWide: { width: 100 },

  // ── Table / Ledger ──────────────────────────────────────────────────────────
  tableSection: {
    marginTop: 4,
  },
  tableTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.muted,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  thText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: C.mutedFg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  splitRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    backgroundColor: C.warmBox,
  },
  colDate: { width: 60 },
  colDesc: { flex: 1 },
  colCat: { width: 84 },
  colType: { width: 44 },
  colAmount: { width: 80, textAlign: 'right' },

  tdText: { fontSize: 7.5, color: C.foreground },
  tdBold: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  tdMuted: { fontSize: 7, color: C.mutedFg },
  tagPill: { fontSize: 6, color: C.mutedFg, marginTop: 1 },
  splitBullet: { width: 12, fontSize: 6.5, color: C.mutedFg, textAlign: 'center' },
  splitText: { fontSize: 7, color: C.mutedFg },

  // ── Table Footer ────────────────────────────────────────────────────────────
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.muted,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  footerLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.foreground },
  footerValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // ── Statement Summary Block ─────────────────────────────────────────────────
  docFooterBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },

  // ── Page Number Footer ──────────────────────────────────────────────────────
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerBrand: { fontSize: 6.5, color: C.mutedFg },
  pageNumber: { fontSize: 6.5, color: C.mutedFg },
});

interface FinancialReportDocumentProps {
  data: FinancialReportData;
  showSplits?: boolean;
}

export function FinancialReportDocument({
  data,
  showSplits = true,
}: FinancialReportDocumentProps) {
  const { kpi, currency } = data;
  const isNetPositive = kpi.netSavings >= 0;

  return (
    <Document
      title={`Financial Statement - ${data.title} (${data.periodLabel})`}
      author='Kytbox Cashflow'
    >
      <Page size='A4' style={styles.page}>
        {/* ── Document Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Text style={styles.statementLabel}>FINANCIAL STATEMENT</Text>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyText}>{currency.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.title}>{data.title}</Text>
            <View style={styles.periodRow}>
              <CalendarIcon color={C.mutedFg} size={8} />
              <Text style={styles.periodLabel}>Period:</Text>
              <Text style={styles.periodValue}>{data.periodLabel}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.metaRow}>
              <ClockIcon color={C.mutedFg} size={7.5} />
              <Text style={styles.metaLabel}>Generated:</Text>
              <Text style={styles.metaValue}>{formatAppDate(data.generatedAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <FileSpreadsheetIcon color={C.mutedFg} size={7.5} />
              <Text style={styles.metaValue}>
                {kpi.totalTransactions} transactions
                {kpi.splitItemsCount > 0 ? ` (${kpi.splitItemsCount} split items)` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* ── KPI Summary Cards ── */}
        <View style={styles.kpiContainer}>
          {/* Total Income */}
          <View style={[styles.kpiCard, { backgroundColor: C.emeraldBg, borderColor: '#bbf7d0' }]}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>Total Income</Text>
              <TrendingUpIcon color={C.emerald} size={9} />
            </View>
            <Text style={[styles.kpiValue, { color: C.emerald }]}>
              {formatCurrency(kpi.totalIncome, currency)}
            </Text>
            <Text style={styles.kpiSub}>{kpi.incomeCount} entries</Text>
          </View>

          {/* Total Expense */}
          <View style={[styles.kpiCard, { backgroundColor: C.roseBg, borderColor: '#fecdd3' }]}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>Total Expense</Text>
              <TrendingDownIcon color={C.rose} size={9} />
            </View>
            <Text style={[styles.kpiValue, { color: C.rose }]}>
              {formatCurrency(kpi.totalExpense, currency)}
            </Text>
            <Text style={styles.kpiSub}>{kpi.expenseCount} entries</Text>
          </View>

          {/* Net Cashflow */}
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: isNetPositive ? C.emeraldBg : C.roseBg,
                borderColor: isNetPositive ? '#bbf7d0' : '#fecdd3',
              },
            ]}
          >
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>Net Cashflow</Text>
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: isNetPositive ? '#dcfce7' : '#ffe4e6' },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isNetPositive ? '#166534' : '#9f1239' },
                  ]}
                >
                  {isNetPositive ? 'SURPLUS' : 'DEFICIT'}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.kpiValue,
                { color: isNetPositive ? C.emerald : C.rose },
              ]}
            >
              {isNetPositive ? '+' : ''}
              {formatCurrency(kpi.netSavings, currency)}
            </Text>
            <Text style={styles.kpiSub}>
              {isNetPositive ? 'Net Saved' : 'Net Overspend'}
            </Text>
          </View>

          {/* Savings Rate */}
          <View style={[styles.kpiCard, { backgroundColor: C.muted }]}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>Savings Rate</Text>
              <PercentIcon color={C.mutedFg} size={9} />
            </View>
            <Text style={[styles.kpiValue, { color: C.foreground }]}>
              {kpi.savingsRate}%
            </Text>
            <Text style={styles.kpiSub}>of total income</Text>
          </View>
        </View>

        {/* ── Category Breakdown ── */}
        {(data.expenseCategories.length > 0 || data.incomeCategories.length > 0) && (
          <View style={styles.categorySection}>
            {/* Income Categories (Left) */}
            <View style={styles.categoryBoxIncome}>
              <View style={styles.sectionTitleHeader}>
                <Text style={[styles.sectionTitle, { color: C.emerald }]}>Income Sources</Text>
                <Text style={styles.sectionCount}>
                  {data.incomeCategories.length} sources
                </Text>
              </View>
              {data.incomeCategories.length === 0 ? (
                <Text style={styles.tdMuted}>No income recorded.</Text>
              ) : (
                data.incomeCategories.slice(0, 6).map((cat) => (
                  <View key={cat.category} style={styles.categoryItem}>
                    <View style={styles.categoryRow}>
                      <Text style={styles.categoryName}>
                        {formatCategoryName(cat.category)}
                      </Text>
                      <View style={styles.categoryAmountBox}>
                        <Text style={styles.categoryAmount}>{formatCurrency(cat.total, currency)}</Text>
                        <Text style={styles.categoryPct}>({cat.percentage}%)</Text>
                      </View>
                    </View>
                    <View style={styles.progressBarTrackIncome}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            backgroundColor: C.emerald,
                            width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Expense Categories (Right) */}
            <View style={styles.categoryBoxExpense}>
              <View style={styles.sectionTitleHeader}>
                <Text style={[styles.sectionTitle, { color: C.rose }]}>Top Expense Categories</Text>
                <Text style={styles.sectionCount}>
                  {data.expenseCategories.length} categories
                </Text>
              </View>
              {data.expenseCategories.length === 0 ? (
                <Text style={styles.tdMuted}>No expenses recorded.</Text>
              ) : (
                data.expenseCategories.slice(0, 6).map((cat) => (
                  <View key={cat.category} style={styles.categoryItem}>
                    <View style={styles.categoryRow}>
                      <Text style={styles.categoryName}>
                        {formatCategoryName(cat.category)}
                      </Text>
                      <View style={styles.categoryAmountBox}>
                        <Text style={styles.categoryAmount}>{formatCurrency(cat.total, currency)}</Text>
                        <Text style={styles.categoryPct}>({cat.percentage}%)</Text>
                      </View>
                    </View>
                    <View style={styles.progressBarTrackExpense}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            backgroundColor: C.rose,
                            width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ── Top Expenses Spotlight Table ── */}
        {data.topExpenses.length > 0 && (
          <View style={styles.spotlightSection} wrap={false}>
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
              Largest Expenses Spotlight
            </Text>
            <View style={styles.spotlightTable}>
              <View style={styles.spotlightHeader}>
                <Text style={[styles.thText, styles.colDate]}>Date</Text>
                <Text style={[styles.thText, styles.colDesc]}>Description</Text>
                <Text style={[styles.thText, styles.colCatWide]}>Category</Text>
                <Text style={[styles.thText, styles.colAmount]}>Amount</Text>
              </View>
              {data.topExpenses.slice(0, 5).map((exp) => (
                <View key={exp.id} style={styles.spotlightTableRow}>
                  <Text style={[styles.tdMuted, styles.colDate]}>{formatAppDate(exp.date)}</Text>
                  <Text style={[styles.tdText, styles.colDesc]}>{exp.description}</Text>
                  <Text style={[styles.tdMuted, styles.colCatWide]}>
                    {formatCategoryName(exp.category || 'uncategorized')}
                  </Text>
                  <Text style={[styles.tdBold, styles.colAmount, { color: C.rose }]}>
                    -{formatCurrency(exp.amount, currency)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Itemized Ledger Table ── */}
        <View style={styles.tableTitleRow}>
          <Text style={styles.sectionTitle}>
            Itemized Transaction Ledger ({data.entries.length})
          </Text>
          <Text style={styles.sectionCount}>Oldest to Newest</Text>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colDate]}>Date</Text>
            <Text style={[styles.thText, styles.colDesc]}>Description</Text>
            <Text style={[styles.thText, styles.colCat]}>Category</Text>
            <Text style={[styles.thText, styles.colType]}>Type</Text>
            <Text style={[styles.thText, styles.colAmount]}>Amount</Text>
          </View>

          {data.entries.map((entry) => {
            const isIncome = entry.type === 'income';
            const hasSplits = Boolean(showSplits && entry.items && entry.items.length > 0);

            return (
              <View key={entry.id} wrap={false}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tdMuted, styles.colDate]}>{formatAppDate(entry.date)}</Text>
                  <View style={styles.colDesc}>
                    <Text style={styles.tdText}>{entry.description}</Text>
                    {entry.tags && entry.tags.length > 0 && (
                      <Text style={styles.tagPill}>
                        {entry.tags.map((t) => `#${t}`).join(' ')}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.tdMuted, styles.colCat]}>
                    {formatCategoryName(entry.category || 'uncategorized')}
                  </Text>
                  <Text
                    style={[
                      styles.tdBold,
                      styles.colType,
                      { color: isIncome ? C.emerald : C.rose },
                    ]}
                  >
                    {entry.type.toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      styles.tdBold,
                      styles.colAmount,
                      { color: isIncome ? C.emerald : C.rose },
                    ]}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(Number(entry.amount), currency)}
                  </Text>
                </View>

                {/* Nested Split Entries */}
                {hasSplits &&
                  entry.items!.map((split, idx) => (
                    <View key={split.id || `${entry.id}-${idx}`} style={styles.splitRow}>
                      <Text style={styles.splitBullet}>↳</Text>
                      <Text style={[styles.splitText, styles.colDesc]}>{split.item_name}</Text>
                      <Text style={[styles.splitText, styles.colCat]}>
                        {formatCategoryName(split.category || entry.category || 'uncategorized')}
                      </Text>
                      <Text style={[styles.splitText, styles.colType]}>split</Text>
                      <Text style={[styles.splitText, styles.colAmount]}>
                        {formatCurrency(Number(split.amount), currency)}
                      </Text>
                    </View>
                  ))}
              </View>
            );
          })}

          {/* Grand Total Footer */}
          <View style={styles.tableFooter} wrap={false}>
            <Text style={styles.footerLabel}>
              Statement Period Totals ({data.entries.length} transactions)
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Text style={styles.tdMuted}>Net Result:</Text>
              <Text
                style={[
                  styles.footerValue,
                  { color: isNetPositive ? C.emerald : C.rose },
                ]}
              >
                {isNetPositive ? '+' : ''}
                {formatCurrency(kpi.netSavings, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Statement Summary Block ── */}
        <View style={styles.docFooterBox} wrap={false}>
          <View>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.foreground }}>
              Kytbox Cashflow
            </Text>
            <Text style={{ fontSize: 6.5, color: C.mutedFg, marginTop: 1 }}>
              Cashflow statement export. For budgeting, tax preparation, and expense tracking.
            </Text>
          </View>
        </View>

        {/* ── Fixed Page Number Footer ── */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.footerBrand}>
            Kytbox Cashflow • Statement: {data.title}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
