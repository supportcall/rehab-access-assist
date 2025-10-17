-- Step 1: Add new roles to app_role enum
-- Must be in separate transaction from usage
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'system_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pending_ot';