-- Allow users to insert their own role during signup
-- This policy allows the initial role assignment after user creation
CREATE POLICY "Users can insert their own role during signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to create admin user programmatically
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
DECLARE
  new_user_id UUID;
BEGIN
  -- Note: This function should only be called from a secure context
  -- In production, you'd want additional security checks here
  
  RETURN json_build_object(
    'message', 'Please use the signup form to create admin user',
    'email', admin_email
  );
END;
$$;