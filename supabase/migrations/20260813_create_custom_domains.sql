-- Create custom_domains table for mapping custom domains to Bio profiles
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified')),
  verification_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique index on domain
CREATE UNIQUE INDEX IF NOT EXISTS custom_domains_domain_lower_idx ON public.custom_domains (LOWER(domain));
CREATE INDEX IF NOT EXISTS custom_domains_user_id_idx ON public.custom_domains (user_id);
CREATE INDEX IF NOT EXISTS custom_domains_profile_id_idx ON public.custom_domains (profile_id);

-- Enable RLS
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own custom domain entries
CREATE POLICY "Users can manage their custom domains"
  ON public.custom_domains
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow public/anon read access for verified custom domains (required for proxy routing)
CREATE POLICY "Public read for verified custom domains"
  ON public.custom_domains
  FOR SELECT
  TO anon, authenticated
  USING (status = 'verified');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_domains TO authenticated;
GRANT SELECT ON public.custom_domains TO anon, service_role;
