-- Step 2: Create OT signup requests and settings tables with approval functions

-- Create OT signup requests table
CREATE TABLE IF NOT EXISTS public.ot_signup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ot_signup_requests
ALTER TABLE public.ot_signup_requests ENABLE ROW LEVEL SECURITY;

-- Update the handle_new_user_role trigger to assign pending_ot instead of ot_admin
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if this is the first user (system admin)
  -- First user becomes system_admin, all others become pending_ot
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    -- First user becomes system admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'system_admin');
  ELSE
    -- All other users start as pending_ot
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'pending_ot');
    
    -- Create a signup request record
    INSERT INTO public.ot_signup_requests (user_id, email, first_name, last_name, status)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to approve OT signup (changes role from pending_ot to ot_admin)
CREATE OR REPLACE FUNCTION public.approve_ot_signup(request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id from the request
  SELECT user_id INTO v_user_id
  FROM public.ot_signup_requests
  WHERE id = request_id AND status = 'pending';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Signup request not found or already processed';
  END IF;
  
  -- Update the user's role from pending_ot to ot_admin
  UPDATE public.user_roles
  SET role = 'ot_admin'
  WHERE user_id = v_user_id AND role = 'pending_ot';
  
  -- Update the request status
  UPDATE public.ot_signup_requests
  SET 
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = auth.uid()
  WHERE id = request_id;
END;
$$;

-- Create function to reject OT signup
CREATE OR REPLACE FUNCTION public.reject_ot_signup(request_id UUID, reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update the request status
  UPDATE public.ot_signup_requests
  SET 
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    rejection_reason = reason
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Signup request not found or already processed';
  END IF;
END;
$$;

-- RLS Policies for ot_signup_requests

-- System admins can view all requests
CREATE POLICY "System admins can view all signup requests"
  ON public.ot_signup_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'system_admin'));

-- Users can view their own signup request
CREATE POLICY "Users can view their own signup request"
  ON public.ot_signup_requests FOR SELECT
  USING (user_id = auth.uid());

-- System admins can update requests (for approval/rejection)
CREATE POLICY "System admins can update signup requests"
  ON public.ot_signup_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'system_admin'));

-- Add updated_at trigger for ot_signup_requests
CREATE TRIGGER update_ot_signup_requests_updated_at
  BEFORE UPDATE ON public.ot_signup_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create system settings table for future configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only system admins can manage settings
CREATE POLICY "System admins can manage settings"
  ON public.system_settings FOR ALL
  USING (public.has_role(auth.uid(), 'system_admin'));

-- Add updated_at trigger for system_settings
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('ot_monthly_fee', '{"enabled": false, "amount": 0, "currency": "AUD"}', 'Monthly subscription fee for OT users'),
  ('require_approval', '{"enabled": true}', 'Require admin approval for new OT signups')
ON CONFLICT (setting_key) DO NOTHING;