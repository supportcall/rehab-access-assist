-- Add APHRA registration number and mobile number to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS aphra_registration_number TEXT,
ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- Add mobile number to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS mobile_number TEXT;

COMMENT ON COLUMN public.profiles.aphra_registration_number IS 'APHRA (Australian Health Practitioner Regulation Agency) registration number for OTs';
COMMENT ON COLUMN public.profiles.mobile_number IS 'Mobile phone number for OT contact';
COMMENT ON COLUMN public.clients.mobile_number IS 'Mobile phone number for client contact';