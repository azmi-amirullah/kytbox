import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'
import type { InvoiceDTO } from '../types'
import { ZERO_DECIMAL_CURRENCIES } from '@/lib/currency'

// ─── Colour tokens (mirroring the Shadcn light theme) ────────────────────────
const C = {
  foreground: '#0a0a0a',
  mutedFg: '#71717a',
  primary: '#10b981',   // emerald-500
  border: '#e4e4e7',
  muted: '#f4f4f5',
  rose: '#f43f5e',
  white: '#ffffff',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.foreground,
    backgroundColor: C.white,
    padding: 40,
  },
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 16,
  },
  senderName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.foreground, marginBottom: 3 },
  senderMeta: { fontSize: 8, color: C.mutedFg, marginTop: 1 },
  invoiceMeta: { alignItems: 'flex-end' },
  invoiceLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, color: C.primary, marginBottom: 2 },
  invoiceNumber: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.foreground, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 4, marginTop: 1 },
  metaLabel: { fontSize: 8, color: C.mutedFg },
  metaValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.foreground },
  // ── Status badge ────────────────────────────────────────────────────────────
  badge: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-end' },
  badgeText: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  // ── Billed To ───────────────────────────────────────────────────────────────
  billedToBox: {
    backgroundColor: C.muted,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 1.2, color: C.mutedFg, marginBottom: 3, textTransform: 'uppercase' },
  clientName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.foreground, marginBottom: 2 },
  clientMeta: { fontSize: 8, color: C.mutedFg, marginTop: 1 },
  // ── Table ───────────────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 5,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
  },
  colDesc: { flex: 1 },
  colQty: { width: 36, textAlign: 'right' },
  colPrice: { width: 72, textAlign: 'right' },
  colAmount: { width: 72, textAlign: 'right' },
  thText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.mutedFg, textTransform: 'uppercase', letterSpacing: 0.5 },
  tdText: { fontSize: 8.5, color: C.foreground },
  tdMuted: { fontSize: 8.5, color: C.mutedFg },
  tdBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.foreground },
  // ── Totals ──────────────────────────────────────────────────────────────────
  totalsContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  totalsInner: { width: 200 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  totalLabel: { fontSize: 8, color: C.mutedFg },
  totalValue: { fontSize: 8, color: C.foreground, fontFamily: 'Helvetica-Bold' },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
    marginTop: 4,
  },
  grandLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.foreground },
  grandValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.primary },
  // ── Notes / Payment ─────────────────────────────────────────────────────────
  notesGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    backgroundColor: C.muted,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 12,
  },
  notesCol: { flex: 1 },
  notesText: { fontSize: 8, color: C.foreground, lineHeight: 1.4, marginTop: 3 },
  // ── Signature ───────────────────────────────────────────────────────────────
  sigContainer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    gap: 24,
  },
  sigCol: { flex: 1 },
  sigNameBox: { height: 44, justifyContent: 'flex-end', paddingBottom: 2 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 3 },
  sigName: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.foreground },
  sigMeta: { fontSize: 7, color: C.mutedFg, marginTop: 1 },
  sigPlaceholder: { fontSize: 7, color: C.mutedFg },
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string): string {
  const decimals = ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

function fmtDate(dateString: string): string {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft:     { bg: '#f4f4f5', text: '#71717a' },
  pending:   { bg: '#fefce8', text: '#ca8a04' },
  paid:      { bg: '#dcfce7', text: '#16a34a' },
  overdue:   { bg: '#ffe4e6', text: '#e11d48' },
  cancelled: { bg: '#f4f4f5', text: '#71717a' },
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

interface InvoiceDocumentProps {
  invoice: InvoiceDTO
}

export function InvoiceDocument({ invoice }: InvoiceDocumentProps) {
  const badge = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.draft
  const cur = invoice.currency || 'USD'

  return (
    <Document title={`Invoice ${invoice.invoice_number}`} author={invoice.sender_name ?? undefined}>
      <Page size='A4' style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.senderName}>{invoice.sender_name || 'INVOICE'}</Text>
            {invoice.sender_email && <Text style={styles.senderMeta}>{invoice.sender_email}</Text>}
            {invoice.sender_address && (
              <Text style={styles.senderMeta}>{invoice.sender_address}</Text>
            )}
          </View>

          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Issue Date:</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.issue_date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due Date:</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.due_date)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>
                {invoice.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Billed To ── */}
        <View style={styles.billedToBox}>
          <Text style={styles.sectionLabel}>Billed To:</Text>
          <Text style={styles.clientName}>{invoice.client_name}</Text>
          {invoice.client_email && <Text style={styles.clientMeta}>{invoice.client_email}</Text>}
          {invoice.client_address && <Text style={styles.clientMeta}>{invoice.client_address}</Text>}
        </View>

        {/* ── Line Items Table ── */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colDesc]}>Description</Text>
          <Text style={[styles.thText, styles.colQty]}>Qty</Text>
          <Text style={[styles.thText, styles.colPrice]}>Unit Price</Text>
          <Text style={[styles.thText, styles.colAmount]}>Amount</Text>
        </View>
        {invoice.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tdText, styles.colDesc]}>{item.description}</Text>
            <Text style={[styles.tdMuted, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.tdMuted, styles.colPrice]}>{fmt(item.unit_price, cur)}</Text>
            <Text style={[styles.tdBold, styles.colAmount]}>{fmt(item.amount, cur)}</Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsInner}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{fmt(invoice.subtotal, cur)}</Text>
            </View>
            {invoice.tax_rate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({invoice.tax_rate}%):</Text>
                <Text style={styles.totalValue}>{fmt(invoice.tax_amount, cur)}</Text>
              </View>
            )}
            {invoice.discount_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={[styles.totalValue, { color: C.rose }]}>
                  -{fmt(invoice.discount_amount, cur)}
                </Text>
              </View>
            )}
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>Total Amount Due:</Text>
              <Text style={styles.grandValue}>{fmt(invoice.total_amount, cur)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes & Payment Info ── */}
        {(invoice.payment_info || invoice.notes) && (
          <View style={styles.notesGrid}>
            {invoice.payment_info && (
              <View style={styles.notesCol}>
                <Text style={styles.sectionLabel}>Payment Instructions</Text>
                <Text style={styles.notesText}>{invoice.payment_info}</Text>
              </View>
            )}
            {invoice.notes && (
              <View style={styles.notesCol}>
                <Text style={styles.sectionLabel}>Notes &amp; Terms</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Signature Block ── */}
        {(invoice.include_issuer_signature || invoice.include_client_signature) && (
          <View
            style={[
              styles.sigContainer,
              !(invoice.include_issuer_signature && invoice.include_client_signature)
                ? { justifyContent: 'flex-end' }
                : {},
            ]}
          >
            {invoice.include_issuer_signature && (
              <View
                style={[
                  styles.sigCol,
                  !(invoice.include_issuer_signature && invoice.include_client_signature)
                    ? { flex: 0.5 }
                    : {},
                ]}
              >
                <Text style={styles.sectionLabel}>Authorized By</Text>
                <View style={styles.sigNameBox}>
                  <Text style={styles.sigName}>
                    {invoice.signatory_name || invoice.sender_name || 'Authorized Signatory'}
                  </Text>
                </View>
                <View style={styles.sigLine} />
                <Text style={styles.sigMeta}>
                  Date Signed: {fmtDate(invoice.signed_date || invoice.issue_date)}
                </Text>
              </View>
            )}
            {invoice.include_client_signature && (
              <View
                style={[
                  styles.sigCol,
                  !(invoice.include_issuer_signature && invoice.include_client_signature)
                    ? { flex: 0.5 }
                    : {},
                ]}
              >
                <Text style={styles.sectionLabel}>Client Acknowledgement</Text>
                <View style={styles.sigNameBox} />
                <View style={styles.sigLine} />
                <Text style={styles.sigMeta}>Date Signed: ____ / ____ / ________</Text>
              </View>
            )}
          </View>
        )}

      </Page>
    </Document>
  )
}
