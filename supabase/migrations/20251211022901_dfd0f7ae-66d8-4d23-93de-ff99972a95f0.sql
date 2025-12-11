-- Fix 1: Remove the 'assigned_ot_id IS NULL' condition from clients SELECT policy
-- This prevents unauthorized OTs from viewing unassigned clients' PII

DROP POLICY IF EXISTS "OTs can view assigned clients" ON public.clients;

CREATE POLICY "OTs can view assigned clients"
ON public.clients
FOR SELECT
USING (
  has_role(auth.uid(), 'ot_admin'::app_role) 
  AND (
    (assigned_ot_id = auth.uid()) 
    OR (created_by = auth.uid())
  )
);

-- Fix 2: Create a security definer function to safely lookup OT profiles by system_id
-- This enables the referral system to find OTs without exposing full profile data

CREATE OR REPLACE FUNCTION public.lookup_ot_by_system_id(p_system_id text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE system_id = p_system_id LIMIT 1
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.lookup_ot_by_system_id(text) TO authenticated;