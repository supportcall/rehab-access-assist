-- Create RLS policies for assessment-photos storage bucket

-- Policy: OT admins can upload photos to their own assessment paths
CREATE POLICY "OTs can upload assessment photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assessment-photos' 
  AND has_role(auth.uid(), 'ot_admin'::app_role)
);

-- Policy: OT admins can view their assessment photos
CREATE POLICY "OTs can view their assessment photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'assessment-photos'
  AND has_role(auth.uid(), 'ot_admin'::app_role)
);

-- Policy: OT admins can delete their assessment photos
CREATE POLICY "OTs can delete assessment photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assessment-photos'
  AND has_role(auth.uid(), 'ot_admin'::app_role)
);

-- Policy: OT admins can update their assessment photos
CREATE POLICY "OTs can update assessment photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assessment-photos'
  AND has_role(auth.uid(), 'ot_admin'::app_role)
)
WITH CHECK (
  bucket_id = 'assessment-photos'
  AND has_role(auth.uid(), 'ot_admin'::app_role)
);