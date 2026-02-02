-- Security Update: Revoke public insert access to link_events
-- This table should only be written to by the Service Role (via server-side actions)

-- 1. Drop the permissive policy if it exists
DROP POLICY IF EXISTS "Public can insert events" ON "public"."link_events";

-- 2. Create a stricter policy (Optional, but good practice)
-- Since we are using Service Role for inserts, we don't strictly *need* an INSERT policy for authenticated users 
-- if we want to channel ALL writes through the admin client.
-- However, if we wanted logged-in users to track their own events (unlikely for this use case), we would add it here.
-- For now, we rely on the default "deny all" behavior of RLS when no policy matches.

-- 3. Ensure RLS is enabled (it should be already, but safety first)
ALTER TABLE "public"."link_events" ENABLE ROW LEVEL SECURITY;

-- 4. Note: SELECT policies are likely already handled by existing migrations for ownership/analytics.
