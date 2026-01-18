-- Fix Storage Policies: Remove permissive policies, keep ownership-verified policies only
-- This ensures OTs can only access photos from assessments they own (assigned_ot_id or created_by)

-- Drop the overly permissive policies that don't check ownership
DROP POLICY IF EXISTS "OTs can view their assessment photos" ON storage.objects;
DROP POLICY IF EXISTS "OTs can upload assessment photos" ON storage.objects;
DROP POLICY IF EXISTS "OTs can update assessment photos" ON storage.objects;
DROP POLICY IF EXISTS "OTs can delete assessment photos" ON storage.objects;

-- The secure ownership-verified policies remain:
-- - "OTs can view photos from their assessments" (SELECT with ownership check)
-- - "OTs can upload photos to their assessments" (INSERT with ownership check)
-- - "OTs can update photos in their assessments" (UPDATE with ownership check)
-- - "OTs can delete photos from their assessments" (DELETE with ownership check)

-- Also add system_admin bypass policies for administrative access
CREATE POLICY "System admins can view all photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assessment-photos'
  AND has_role(auth.uid(), 'system_admin'::app_role)
);

CREATE POLICY "System admins can manage all photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'assessment-photos'
  AND has_role(auth.uid(), 'system_admin'::app_role)
)
WITH CHECK (
  bucket_id = 'assessment-photos'
  AND has_role(auth.uid(), 'system_admin'::app_role)
);