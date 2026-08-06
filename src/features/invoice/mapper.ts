import type { InvoiceDTO, InvoiceItemDTO, InvoiceStatus } from './types';

/**
 * Maps raw Database row to strict InvoiceDTO object
 */
export function mapInvoiceToDTO(
  rawInvoice: Record<string, unknown>,
  rawItems: Record<string, unknown>[] = []
): InvoiceDTO {
  const items: InvoiceItemDTO[] = rawItems.map((item, idx) => ({
    id: String(item.id || ''),
    invoice_id: String(item.invoice_id || ''),
    description: String(item.description || ''),
    quantity: Number(item.quantity || 0),
    unit_price: Number(item.unit_price || 0),
    amount: Number(item.amount || 0),
    sort_order: Number(item.sort_order ?? idx),
    created_at: String(item.created_at || ''),
  }));

  const rawStatus = String(rawInvoice.status || '');
  const status: InvoiceStatus =
    rawStatus === 'paid' ||
    rawStatus === 'pending' ||
    rawStatus === 'overdue' ||
    rawStatus === 'cancelled'
      ? rawStatus
      : 'draft';

  return {
    id: String(rawInvoice.id || ''),
    user_id: String(rawInvoice.user_id || ''),
    invoice_number: String(rawInvoice.invoice_number || ''),
    client_name: String(rawInvoice.client_name || ''),
    client_email: rawInvoice.client_email ? String(rawInvoice.client_email) : null,
    client_address: rawInvoice.client_address ? String(rawInvoice.client_address) : null,
    sender_name: rawInvoice.sender_name ? String(rawInvoice.sender_name) : null,
    sender_email: rawInvoice.sender_email ? String(rawInvoice.sender_email) : null,
    sender_address: rawInvoice.sender_address ? String(rawInvoice.sender_address) : null,
    issue_date: String(rawInvoice.issue_date || ''),
    due_date: String(rawInvoice.due_date || ''),
    status,
    currency: String(rawInvoice.currency || 'USD'),
    tax_rate: Number(rawInvoice.tax_rate || 0),
    discount_amount: Number(rawInvoice.discount_amount || 0),
    subtotal: Number(rawInvoice.subtotal || 0),
    tax_amount: Number(rawInvoice.tax_amount || 0),
    total_amount: Number(rawInvoice.total_amount || 0),
    notes: rawInvoice.notes ? String(rawInvoice.notes) : null,
    payment_info: rawInvoice.payment_info ? String(rawInvoice.payment_info) : null,
    include_issuer_signature: Boolean(rawInvoice.include_issuer_signature),
    include_client_signature: Boolean(rawInvoice.include_client_signature),
    signatory_name: rawInvoice.signatory_name ? String(rawInvoice.signatory_name) : null,
    signed_date: rawInvoice.signed_date ? String(rawInvoice.signed_date) : null,
    created_at: String(rawInvoice.created_at || ''),
    updated_at: String(rawInvoice.updated_at || ''),
    items,
  };
}
