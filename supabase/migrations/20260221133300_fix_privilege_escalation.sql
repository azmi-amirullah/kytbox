-- Fix privilege escalation vulnerability in cashflow_shares
-- Currently, the "Users can update their own shares" RLS policy allows users to update ANY column on their own share row.
-- This means a 'read' user can update their own 'role' to 'edit', granting themselves unauthorized write access.

-- Create a trigger function to block unauthorized column updates
CREATE OR REPLACE FUNCTION public.check_cashflow_share_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if restricted columns are being modified
    IF (NEW.role IS DISTINCT FROM OLD.role) OR 
       (NEW.created_via_public_access IS DISTINCT FROM OLD.created_via_public_access) OR
       (NEW.cashflow_id IS DISTINCT FROM OLD.cashflow_id) OR
       (NEW.email IS DISTINCT FROM OLD.email) THEN
        
        -- If so, strictly verify the current user is the actual OWNER of the cashflow
        -- We run this check with SECURITY DEFINER privileges (implied by the function creation if we added it, but here it runs as the user)
        -- Actually, we can just query the cashflows table. Since the user might not have RLS access to see the cashflow if it's private and they aren't invited? 
        -- Wait, if they are the owner, they ALWAYS have access to see it.
        IF NOT EXISTS (
            SELECT 1 FROM public.cashflows
            WHERE id = NEW.cashflow_id AND user_id = auth.uid()
        ) THEN
            RAISE EXCEPTION 'Access Denied: Only the cashflow owner can modify role, email, or access flags.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS enforce_cashflow_share_columns ON public.cashflow_shares;

-- Create the trigger
CREATE TRIGGER enforce_cashflow_share_columns
    BEFORE UPDATE ON public.cashflow_shares
    FOR EACH ROW
    EXECUTE FUNCTION public.check_cashflow_share_update();
