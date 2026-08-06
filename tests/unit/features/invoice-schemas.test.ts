import { describe, it, expect } from 'vitest';
import { invoiceFormSchema } from '@/features/invoice/schemas.server';
import { mapInvoiceToDTO } from '@/features/invoice/mapper';

describe('Invoice Server Schemas & DB Mappers', () => {
  describe('invoiceFormSchema', () => {
    it('validates a complete valid invoice payload', () => {
      const result = invoiceFormSchema.safeParse({
        invoice_number: 'INV-2026-001',
        client_name: 'Acme Corp',
        client_email: 'client@acme.com',
        client_address: '123 Main St',
        sender_name: 'My Business LLC',
        sender_email: 'billing@mybusiness.com',
        sender_address: '456 Business Ave',
        issue_date: '2026-08-06',
        due_date: '2026-08-20',
        status: 'pending',
        currency: 'USD',
        tax_rate: 10,
        discount_amount: 50,
        notes: 'Payment due in 14 days',
        payment_info: 'Bank: Tech Bank, Acc: 12345',
        include_signature: true,
        signatory_name: 'Alex Rivera',
        signed_date: '2026-08-06',
        items: [
          {
            description: 'UI Design Service',
            quantity: 2,
            unit_price: 500,
            amount: 1000,
          },
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invoice_number).toBe('INV-2026-001');
        expect(result.data.tax_rate).toBe(10);
        expect(result.data.items).toHaveLength(1);
      }
    });

    it('rejects invoice payload without items', () => {
      const result = invoiceFormSchema.safeParse({
        invoice_number: 'INV-2026-002',
        client_name: 'Acme Corp',
        issue_date: '2026-08-06',
        due_date: '2026-08-20',
        status: 'pending',
        items: [],
      });

      expect(result.success).toBe(false);
    });

    it('rejects invalid email formats', () => {
      const result = invoiceFormSchema.safeParse({
        invoice_number: 'INV-2026-003',
        client_name: 'Acme Corp',
        client_email: 'not-an-email',
        issue_date: '2026-08-06',
        due_date: '2026-08-20',
        status: 'pending',
        items: [
          {
            description: 'Web Dev',
            quantity: 1,
            unit_price: 100,
            amount: 100,
          },
        ],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('mapInvoiceToDTO', () => {
    it('maps raw database row correctly to InvoiceDTO', () => {
      const rawInvoice = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-1',
        invoice_number: 'INV-100',
        client_name: 'Test Client',
        client_email: 'test@client.com',
        issue_date: '2026-08-01',
        due_date: '2026-08-15',
        status: 'paid',
        currency: 'USD',
        tax_rate: 5,
        discount_amount: 10,
        subtotal: 500,
        tax_amount: 25,
        total_amount: 515,
        include_signature: false,
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-01T00:00:00Z',
      };

      const rawItems = [
        {
          id: 'item-1',
          invoice_id: '123e4567-e89b-12d3-a456-426614174000',
          description: 'Consulting',
          quantity: 5,
          unit_price: 100,
          amount: 500,
          sort_order: 0,
          created_at: '2026-08-01T00:00:00Z',
        },
      ];

      const dto = mapInvoiceToDTO(rawInvoice, rawItems);

      expect(dto.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(dto.invoice_number).toBe('INV-100');
      expect(dto.status).toBe('paid');
      expect(dto.total_amount).toBe(515);
      expect(dto.items).toHaveLength(1);
      expect(dto.items[0].description).toBe('Consulting');
    });
  });
});
