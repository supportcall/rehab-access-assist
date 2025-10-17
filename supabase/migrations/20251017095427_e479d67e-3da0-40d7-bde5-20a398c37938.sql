-- Add system_id columns for OTs and Patients
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS system_id TEXT UNIQUE;

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS system_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS assigned_ot_id UUID REFERENCES public.profiles(id);

ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS assigned_ot_id UUID REFERENCES public.profiles(id);

-- Create referrals table for OT-Patient requests
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  requesting_ot_id UUID REFERENCES public.profiles(id),
  target_ot_id UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  referred_to_ot_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "OT admins can manage referrals"
ON public.referrals
FOR ALL
USING (has_role(auth.uid(), 'ot_admin'));

-- Function to generate unique system IDs
CREATE OR REPLACE FUNCTION public.generate_system_id(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := prefix || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE system_id = new_id
      UNION ALL
      SELECT 1 FROM public.clients WHERE system_id = new_id
    ) INTO id_exists;
    
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_id;
END;
$$;

-- Trigger function to auto-generate system IDs for OT profiles
CREATE OR REPLACE FUNCTION public.auto_generate_profile_system_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.system_id IS NULL THEN
    NEW.system_id := generate_system_id('OT');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function to auto-generate system IDs for patient clients
CREATE OR REPLACE FUNCTION public.auto_generate_client_system_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.system_id IS NULL THEN
    NEW.system_id := generate_system_id('PT');
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers for auto-generating system IDs
DROP TRIGGER IF EXISTS profile_system_id_trigger ON public.profiles;
CREATE TRIGGER profile_system_id_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION auto_generate_profile_system_id();

DROP TRIGGER IF EXISTS client_system_id_trigger ON public.clients;
CREATE TRIGGER client_system_id_trigger
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION auto_generate_client_system_id();

-- Generate system IDs for existing records
UPDATE public.profiles 
SET system_id = generate_system_id('OT')
WHERE system_id IS NULL;

UPDATE public.clients
SET system_id = generate_system_id('PT')
WHERE system_id IS NULL;

-- Add trigger for updated_at on referrals
CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();