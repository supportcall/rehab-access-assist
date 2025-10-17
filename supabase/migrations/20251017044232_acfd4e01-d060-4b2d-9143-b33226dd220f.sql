-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('ot_admin', 'client_carer');

-- Create enum for mobility aids
CREATE TYPE public.mobility_aid AS ENUM ('wheelchair', 'walker', 'cane', 'none', 'other');

-- Create enum for funding bodies
CREATE TYPE public.funding_body AS ENUM ('ndis', 'my_aged_care', 'private', 'other');

-- Create enum for wall construction types
CREATE TYPE public.wall_construction AS ENUM ('plaster', 'brick', 'tile_over_plaster', 'concrete', 'other');

-- Create enum for area locations
CREATE TYPE public.area_location AS ENUM (
  'bathroom_toilet', 'bathroom_shower', 'bedroom', 'kitchen', 
  'front_entry', 'rear_entry', 'stairs_internal', 'stairs_external',
  'living_room', 'hallway', 'ramp', 'other'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  diagnosis TEXT,
  funding_body funding_body,
  primary_mobility_aid mobility_aid,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create assessments table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assessment_date DATE DEFAULT CURRENT_DATE,
  
  -- Client/Carer input fields
  primary_goal TEXT,
  difficulty_toileting INTEGER CHECK (difficulty_toileting BETWEEN 1 AND 5),
  difficulty_showering INTEGER CHECK (difficulty_showering BETWEEN 1 AND 5),
  difficulty_transfers INTEGER CHECK (difficulty_transfers BETWEEN 1 AND 5),
  difficulty_steps INTEGER CHECK (difficulty_steps BETWEEN 1 AND 5),
  fall_history TEXT,
  near_miss_locations TEXT,
  
  -- Status and metadata
  status TEXT DEFAULT 'draft',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create environmental_areas table
CREATE TABLE public.environmental_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  area_location area_location NOT NULL,
  area_name TEXT,
  
  -- Measurements (in millimeters)
  door_clear_width DECIMAL(10,2),
  threshold_height DECIMAL(10,2),
  toilet_centerline_left DECIMAL(10,2),
  toilet_centerline_right DECIMAL(10,2),
  ramp_gradient_riser DECIMAL(10,2),
  ramp_gradient_going DECIMAL(10,2),
  
  -- Structural data
  wall_construction wall_construction,
  
  -- Photos stored as array of file paths
  photo_urls TEXT[],
  
  -- Notes and observations
  notes TEXT,
  barriers TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create assessment tokens for client/carer access
CREATE TABLE public.assessment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_tokens ENABLE ROW LEVEL SECURITY;

-- Create function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for clients
CREATE POLICY "OT admins can view all clients"
  ON public.clients FOR SELECT
  USING (public.has_role(auth.uid(), 'ot_admin'));

CREATE POLICY "OT admins can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'ot_admin'));

CREATE POLICY "OT admins can update clients"
  ON public.clients FOR UPDATE
  USING (public.has_role(auth.uid(), 'ot_admin'));

CREATE POLICY "OT admins can delete clients"
  ON public.clients FOR DELETE
  USING (public.has_role(auth.uid(), 'ot_admin'));

-- RLS Policies for assessments
CREATE POLICY "OT admins can view all assessments"
  ON public.assessments FOR SELECT
  USING (public.has_role(auth.uid(), 'ot_admin'));

CREATE POLICY "OT admins can create assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'ot_admin'));

CREATE POLICY "OT admins can update assessments"
  ON public.assessments FOR UPDATE
  USING (public.has_role(auth.uid(), 'ot_admin'));

CREATE POLICY "OT admins can delete assessments"
  ON public.assessments FOR DELETE
  USING (public.has_role(auth.uid(), 'ot_admin'));

-- RLS Policies for environmental_areas
CREATE POLICY "OT admins can view all areas"
  ON public.environmental_areas FOR SELECT
  USING (public.has_role(auth.uid(), 'ot_admin'));

CREATE POLICY "OT admins can create areas"
  ON public.environmental_areas FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'ot_admin'));

CREATE POLICY "OT admins can update areas"
  ON public.environmental_areas FOR UPDATE
  USING (public.has_role(auth.uid(), 'ot_admin'));

CREATE POLICY "OT admins can delete areas"
  ON public.environmental_areas FOR DELETE
  USING (public.has_role(auth.uid(), 'ot_admin'));

-- RLS Policies for assessment_tokens
CREATE POLICY "OT admins can manage tokens"
  ON public.assessment_tokens FOR ALL
  USING (public.has_role(auth.uid(), 'ot_admin'));

-- Create storage bucket for assessment photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assessment-photos', 'assessment-photos', false);

-- Storage policies for assessment photos
CREATE POLICY "OT admins can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assessment-photos' AND
    public.has_role(auth.uid(), 'ot_admin')
  );

CREATE POLICY "OT admins can view photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assessment-photos' AND
    public.has_role(auth.uid(), 'ot_admin')
  );

CREATE POLICY "OT admins can delete photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assessment-photos' AND
    public.has_role(auth.uid(), 'ot_admin')
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_environmental_areas_updated_at
  BEFORE UPDATE ON public.environmental_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();