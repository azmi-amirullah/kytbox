-- Add receipt_url column to cashflow_entries
ALTER TABLE public.cashflow_entries
ADD COLUMN IF NOT EXISTS receipt_url text DEFAULT NULL;

-- Create private bucket for cashflow receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cashflow-receipts',
  'cashflow-receipts',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage policies for cashflow-receipts bucket
CREATE POLICY "Users can upload receipts to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cashflow-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'cashflow-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'cashflow-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'cashflow-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'cashflow-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
