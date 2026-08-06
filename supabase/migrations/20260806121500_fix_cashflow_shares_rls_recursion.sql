-- Fix infinite recursion in RLS policy for relation "cashflow_shares" (PostgreSQL error 42P17).
--
-- Root cause:
-- 1. cashflow_shares_insert_owner_or_public_member contained a direct query `EXISTS (SELECT 1 FROM public.cashflows ...)`
--    which triggered public.cashflows RLS policy (cashflows_select_accessible).
-- 2. cashflows_select_accessible contained `EXISTS (SELECT 1 FROM public.cashflow_shares ...)`, triggering public.cashflow_shares RLS evaluation.
-- 3. This cross-table RLS dependency created a circular policy reference loop when inserting/upserting cashflow shares.
-- 4. Additionally, check_cashflow_share_update trigger performed a raw query on public.cashflows without SECURITY DEFINER.
--
-- Fix:
-- 1. Introduce SECURITY DEFINER function private.is_cashflow_public to query public.cashflows without RLS evaluation loop.
-- 2. Update cashflow_shares_insert_owner_or_public_member to use private.is_cashflow_public instead of raw subquery.
-- 3. Update check_cashflow_share_update function to be SECURITY DEFINER and use private.is_cashflow_owner.

CREATE OR REPLACE FUNCTION private.is_cashflow_public(_cashflow_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.cashflows
    WHERE id = _cashflow_id
      AND is_public = true
  );
END;
$function$;

REVOKE ALL ON FUNCTION private.is_cashflow_public(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_cashflow_public(uuid) TO authenticated;

DROP POLICY IF EXISTS cashflow_shares_insert_owner_or_public_member
  ON public.cashflow_shares;

CREATE POLICY cashflow_shares_insert_owner_or_public_member
  ON public.cashflow_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    private.is_cashflow_owner(cashflow_id)
    OR (
      LOWER(email) = LOWER((SELECT auth.jwt()) ->> 'email')
      AND role = 'read'
      AND created_via_public_access = true
      AND private.is_cashflow_public(cashflow_id)
    )
  );

CREATE OR REPLACE FUNCTION public.check_cashflow_share_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role)
     OR (NEW.created_via_public_access IS DISTINCT FROM OLD.created_via_public_access)
     OR (NEW.cashflow_id IS DISTINCT FROM OLD.cashflow_id)
     OR (NEW.email IS DISTINCT FROM OLD.email) THEN
    IF NOT private.is_cashflow_owner(NEW.cashflow_id) THEN
      RAISE EXCEPTION
        'Access Denied: Only the cashflow owner can modify role, email, or access flags.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
