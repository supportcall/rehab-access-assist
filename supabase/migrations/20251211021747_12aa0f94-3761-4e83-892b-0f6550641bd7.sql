-- Add location fields to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS suburb text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Australia';

-- Add location and service area fields to profiles table (therapists)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS suburb text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Australia',
ADD COLUMN IF NOT EXISTS service_area_type text DEFAULT 'postal_code',
ADD COLUMN IF NOT EXISTS service_area_value text,
ADD COLUMN IF NOT EXISTS service_radius_km integer DEFAULT 50;

-- Add index for faster location-based queries
CREATE INDEX IF NOT EXISTS idx_clients_postal_code ON public.clients(postal_code);
CREATE INDEX IF NOT EXISTS idx_clients_state ON public.clients(state);
CREATE INDEX IF NOT EXISTS idx_profiles_postal_code ON public.profiles(postal_code);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state);
CREATE INDEX IF NOT EXISTS idx_profiles_service_area ON public.profiles(service_area_type, service_area_value);

COMMENT ON COLUMN public.profiles.service_area_type IS 'Type of service area: postal_code, suburb, state, or country';
COMMENT ON COLUMN public.profiles.service_area_value IS 'Value for service area matching (e.g., specific postal code, suburb name, state code)';
COMMENT ON COLUMN public.profiles.service_radius_km IS 'Service radius in kilometers from therapist location';