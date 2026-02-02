-- Create cashflows table for organizing cashflow categories
CREATE TABLE IF NOT EXISTS public.cashflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create cashflow_entries table for individual transactions
CREATE TABLE IF NOT EXISTS public.cashflow_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashflow_id uuid NOT NULL REFERENCES public.cashflows(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cashflows_user_id ON public.cashflows(user_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_cashflow_id ON public.cashflow_entries(cashflow_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_date ON public.cashflow_entries(date);

-- RLS Policies for cashflows
ALTER TABLE public.cashflows ENABLE ROW LEVEL SECURITY;

-- Owner can read their own cashflows
CREATE POLICY "Users can read own cashflows"
  ON public.cashflows FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can insert their own cashflows
CREATE POLICY "Users can create own cashflows"
  ON public.cashflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their own cashflows
CREATE POLICY "Users can update own cashflows"
  ON public.cashflows FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their own cashflows
CREATE POLICY "Users can delete own cashflows"
  ON public.cashflows FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for cashflow_entries
ALTER TABLE public.cashflow_entries ENABLE ROW LEVEL SECURITY;

-- Owner can read entries (via parent cashflow ownership)
CREATE POLICY "Users can read own cashflow entries"
  ON public.cashflow_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cashflows
      WHERE cashflows.id = cashflow_entries.cashflow_id
      AND cashflows.user_id = auth.uid()
    )
  );

-- Owner can insert entries
CREATE POLICY "Users can create own cashflow entries"
  ON public.cashflow_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cashflows
      WHERE cashflows.id = cashflow_entries.cashflow_id
      AND cashflows.user_id = auth.uid()
    )
  );

-- Owner can update entries
CREATE POLICY "Users can update own cashflow entries"
  ON public.cashflow_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cashflows
      WHERE cashflows.id = cashflow_entries.cashflow_id
      AND cashflows.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cashflows
      WHERE cashflows.id = cashflow_entries.cashflow_id
      AND cashflows.user_id = auth.uid()
    )
  );

-- Owner can delete entries
CREATE POLICY "Users can delete own cashflow entries"
  ON public.cashflow_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cashflows
      WHERE cashflows.id = cashflow_entries.cashflow_id
      AND cashflows.user_id = auth.uid()
    )
  );
