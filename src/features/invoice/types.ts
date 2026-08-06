export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItemDTO {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
  created_at: string;
}

export interface InvoiceDTO {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  client_address: string | null;
  sender_name: string | null;
  sender_email: string | null;
  sender_address: string | null;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  currency: string;
  tax_rate: number;
  discount_amount: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  payment_info: string | null;
  include_signature: boolean;
  signatory_name: string | null;
  signed_date: string | null;
  created_at: string;
  updated_at: string;
  items: InvoiceItemDTO[];
}

export interface InvoiceFormItemInput {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface InvoiceFormInput {
  invoice_number: string;
  client_name: string;
  client_email?: string;
  client_address?: string;
  sender_name?: string;
  sender_email?: string;
  sender_address?: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  currency: string;
  tax_rate: number;
  discount_amount: number;
  notes?: string;
  payment_info?: string;
  include_signature: boolean;
  signatory_name?: string;
  signed_date?: string;
  items: InvoiceFormItemInput[];
}

export interface InvoiceStatsDTO {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueCount: number;
  draftCount: number;
}
