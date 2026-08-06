import { createClient } from '@/lib/supabase/server';
import type { InvoiceDTO, InvoiceStatsDTO, InvoiceStatus } from './types';
import type { InvoiceFormSchemaType } from './schemas.server';
import { mapInvoiceToDTO } from './mapper';

export { mapInvoiceToDTO };

/**
 * Fetch all invoices for a given user with items
 */
export async function getInvoicesByUserId(userId: string): Promise<InvoiceDTO[]> {
  const supabase = await createClient();

  const { data: invoicesData, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (invoiceError || !invoicesData) {
    console.error('Error fetching invoices:', invoiceError);
    return [];
  }

  if (invoicesData.length === 0) {
    return [];
  }

  const invoiceIds = invoicesData.map((inv) => inv.id);

  const { data: itemsData, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .in('invoice_id', invoiceIds)
    .order('sort_order', { ascending: true });

  if (itemsError) {
    console.error('Error fetching invoice items:', itemsError);
  }

  const itemsByInvoiceId = new Map<string, Record<string, unknown>[]>();
  (itemsData || []).forEach((item) => {
    const list = itemsByInvoiceId.get(item.invoice_id) || [];
    list.push(item);
    itemsByInvoiceId.set(item.invoice_id, list);
  });

  return invoicesData.map((inv) =>
    mapInvoiceToDTO(inv, itemsByInvoiceId.get(inv.id) || [])
  );
}

/**
 * Compute invoice stats for a user
 */
export async function getInvoiceStatsByUserId(userId: string): Promise<InvoiceStatsDTO> {
  const invoices = await getInvoicesByUserId(userId);

  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let overdueCount = 0;
  let draftCount = 0;

  const today = new Date().toISOString().split('T')[0];

  invoices.forEach((inv) => {
    totalInvoiced += inv.total_amount;

    if (inv.status === 'paid') {
      totalPaid += inv.total_amount;
    } else if (inv.status === 'pending') {
      totalOutstanding += inv.total_amount;
      if (inv.due_date < today) {
        overdueCount++;
      }
    } else if (inv.status === 'overdue') {
      totalOutstanding += inv.total_amount;
      overdueCount++;
    } else if (inv.status === 'draft') {
      draftCount++;
    }
  });

  return {
    totalInvoiced,
    totalPaid,
    totalOutstanding,
    overdueCount,
    draftCount,
  };
}

/**
 * Create a new invoice with items
 */
export async function createInvoiceInDb(
  userId: string,
  input: InvoiceFormSchemaType
): Promise<InvoiceDTO> {
  const supabase = await createClient();

  const subtotal = input.items.reduce(
    (acc, item) => acc + item.quantity * item.unit_price,
    0
  );
  const taxAmount = (subtotal * input.tax_rate) / 100;
  const totalAmount = Math.max(0, subtotal + taxAmount - input.discount_amount);

  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      invoice_number: input.invoice_number,
      client_name: input.client_name,
      client_email: input.client_email || null,
      client_address: input.client_address || null,
      sender_name: input.sender_name || null,
      sender_email: input.sender_email || null,
      sender_address: input.sender_address || null,
      issue_date: input.issue_date,
      due_date: input.due_date,
      status: input.status,
      currency: input.currency,
      tax_rate: input.tax_rate,
      discount_amount: input.discount_amount,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      notes: input.notes || null,
      payment_info: input.payment_info || null,
      include_issuer_signature: input.include_issuer_signature,
      include_client_signature: input.include_client_signature,
      signatory_name: input.signatory_name || null,
      signed_date: input.signed_date || null,
    })
    .select()
    .single();

  if (invoiceError || !invoiceData) {
    throw new Error(`Failed to create invoice: ${invoiceError?.message || 'Unknown error'}`);
  }

  const itemsToInsert = input.items.map((item, index) => ({
    invoice_id: invoiceData.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.quantity * item.unit_price,
    sort_order: index,
  }));

  const { data: itemsData, error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsToInsert)
    .select();

  if (itemsError) {
    console.error('Error inserting invoice items:', itemsError);
  }

  return mapInvoiceToDTO(invoiceData, itemsData || []);
}

/**
 * Update an existing invoice
 */
export async function updateInvoiceInDb(
  userId: string,
  invoiceId: string,
  input: InvoiceFormSchemaType
): Promise<InvoiceDTO> {
  const supabase = await createClient();

  const subtotal = input.items.reduce(
    (acc, item) => acc + item.quantity * item.unit_price,
    0
  );
  const taxAmount = (subtotal * input.tax_rate) / 100;
  const totalAmount = Math.max(0, subtotal + taxAmount - input.discount_amount);

  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .update({
      invoice_number: input.invoice_number,
      client_name: input.client_name,
      client_email: input.client_email || null,
      client_address: input.client_address || null,
      sender_name: input.sender_name || null,
      sender_email: input.sender_email || null,
      sender_address: input.sender_address || null,
      issue_date: input.issue_date,
      due_date: input.due_date,
      status: input.status,
      currency: input.currency,
      tax_rate: input.tax_rate,
      discount_amount: input.discount_amount,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      notes: input.notes || null,
      payment_info: input.payment_info || null,
      include_issuer_signature: input.include_issuer_signature,
      include_client_signature: input.include_client_signature,
      signatory_name: input.signatory_name || null,
      signed_date: input.signed_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .select()
    .single();

  if (invoiceError || !invoiceData) {
    throw new Error(`Failed to update invoice: ${invoiceError?.message || 'Unknown error'}`);
  }

  // Replace invoice items
  await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);

  const itemsToInsert = input.items.map((item, index) => ({
    invoice_id: invoiceId,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.quantity * item.unit_price,
    sort_order: index,
  }));

  const { data: itemsData, error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsToInsert)
    .select();

  if (itemsError) {
    console.error('Error updating invoice items:', itemsError);
  }

  return mapInvoiceToDTO(invoiceData, itemsData || []);
}

/**
 * Update invoice status only
 */
export async function updateInvoiceStatusInDb(
  userId: string,
  invoiceId: string,
  status: InvoiceStatus
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }
}

/**
 * Delete an invoice by ID
 */
export async function deleteInvoiceInDb(
  userId: string,
  invoiceId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete invoice: ${error.message}`);
  }
}
