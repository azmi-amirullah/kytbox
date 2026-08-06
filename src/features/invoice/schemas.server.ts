import { z } from 'zod';

export const invoiceStatusSchema = z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']);

export const invoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, 'Item description is required').max(255),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.coerce.number().min(0, 'Unit price cannot be negative'),
  amount: z.coerce.number().min(0, 'Amount cannot be negative'),
});

export const invoiceFormSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required').max(50),
  client_name: z.string().min(1, 'Client name is required').max(100),
  client_email: z.string().email('Invalid email').or(z.literal('')).optional(),
  client_address: z.string().max(500).optional(),
  sender_name: z.string().max(100).optional(),
  sender_email: z.string().email('Invalid email').or(z.literal('')).optional(),
  sender_address: z.string().max(500).optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  status: invoiceStatusSchema,
  currency: z.string().min(1).max(10).default('USD'),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  discount_amount: z.coerce.number().min(0).default(0),
  notes: z.string().max(1000).optional(),
  payment_info: z.string().max(1000).optional(),
  include_issuer_signature: z.boolean().default(false),
  include_client_signature: z.boolean().default(false),
  signatory_name: z.string().max(100).optional(),
  signed_date: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
});

export type InvoiceFormSchemaType = z.infer<typeof invoiceFormSchema>;
