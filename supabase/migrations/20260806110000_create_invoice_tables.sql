-- Create Invoices & Invoice Items Tables
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  sender_name TEXT,
  sender_email TEXT,
  sender_address TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  currency TEXT NOT NULL DEFAULT 'USD',
  tax_rate NUMERIC(5, 2) DEFAULT 0,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  payment_info TEXT,
  include_issuer_signature BOOLEAN NOT NULL DEFAULT FALSE,
  include_client_signature BOOLEAN NOT NULL DEFAULT FALSE,
  signatory_name TEXT,
  signed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for invoice_items
CREATE POLICY "Users can view their invoice items" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their invoice items" ON public.invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their invoice items" ON public.invoice_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their invoice items" ON public.invoice_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );
