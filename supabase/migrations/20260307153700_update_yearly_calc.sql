-- Revert yearly_calc_type and add yearly_calculation  
ALTER TABLE public.cashflow_entries DROP COLUMN IF EXISTS yearly_calc_type;  
ALTER TABLE public.cashflow_entries ADD COLUMN IF NOT EXISTS yearly_calculation text DEFAULT 'prorated' CHECK (yearly_calculation IN ('prorated', 'exact')); 
