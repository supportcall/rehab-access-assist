-- Fix the function search path security issue
DROP FUNCTION IF EXISTS public.create_admin_user(TEXT, TEXT, TEXT, TEXT);

-- Updated function with proper search_path
CREATE OR REPLACE FUNCTION public.create_admin_user(
  admin_email TEXT,
  admin_password TEXT,
  admin_first_name TEXT DEFAULT 'Admin',
  admin_last_name TEXT DEFAULT 'User'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'message', 'Please use the signup form to create admin user',
    'email', admin_email
  );
END;
$$;