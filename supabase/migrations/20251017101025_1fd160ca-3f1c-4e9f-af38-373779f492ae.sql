-- ==============================================================
-- SECURITY FIX: Remove client-side role assignment vulnerability
-- ==============================================================

-- Drop the insecure policy that allows users to insert their own roles
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;

-- Create a secure trigger to auto-assign ot_admin role on user creation
-- This runs server-side and cannot be manipulated by clients
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically assign ot_admin role to new users
  -- In production, you may want a different default role with an approval workflow
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'ot_admin');
  RETURN NEW;
END;
$$;

-- Create trigger that fires after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Restrict user_roles table to prevent any client-side role manipulation
-- Users can only view their own roles, not insert/update/delete
CREATE POLICY "Service role only can manage user roles"
  ON public.user_roles FOR ALL
  USING (false);

-- Allow users to view their own roles (read-only)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ==============================================================
-- SECURITY FIX: Restrict client data access to assigned OTs only
-- ==============================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "OT admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "OT admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "OT admins can delete clients" ON public.clients;

-- Create restrictive policies that only allow access to assigned/created clients
CREATE POLICY "OTs can view assigned clients"
  ON public.clients FOR SELECT
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    (assigned_ot_id = auth.uid() OR created_by = auth.uid() OR assigned_ot_id IS NULL)
  );

CREATE POLICY "OTs can update assigned clients"
  ON public.clients FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    (assigned_ot_id = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "OTs can delete assigned clients"
  ON public.clients FOR DELETE
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    (assigned_ot_id = auth.uid() OR created_by = auth.uid())
  );

-- Keep INSERT policy unchanged - all OTs can create new clients
-- CREATE POLICY "OT admins can create clients" already exists

-- ==============================================================
-- SECURITY FIX: Add database constraints for input validation
-- ==============================================================

-- Add length constraints on client fields
ALTER TABLE public.clients
  ADD CONSTRAINT check_first_name_length CHECK (char_length(first_name) <= 100),
  ADD CONSTRAINT check_last_name_length CHECK (char_length(last_name) <= 100),
  ADD CONSTRAINT check_diagnosis_length CHECK (char_length(diagnosis) <= 500),
  ADD CONSTRAINT check_notes_length CHECK (char_length(notes) <= 2000);

-- Add constraint to prevent future birth dates
ALTER TABLE public.clients
  ADD CONSTRAINT check_date_of_birth_not_future CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE);

-- Add length constraints on profiles
ALTER TABLE public.profiles
  ADD CONSTRAINT check_profile_first_name_length CHECK (char_length(first_name) <= 100),
  ADD CONSTRAINT check_profile_last_name_length CHECK (char_length(last_name) <= 100),
  ADD CONSTRAINT check_phone_length CHECK (char_length(phone) <= 20);

-- Add length constraints on referrals
ALTER TABLE public.referrals
  ADD CONSTRAINT check_referral_notes_length CHECK (char_length(notes) <= 2000);