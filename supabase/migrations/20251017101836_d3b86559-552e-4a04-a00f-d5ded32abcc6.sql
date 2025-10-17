-- Fix storage policies to verify assessment ownership

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "OT admins can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "OT admins can view photos" ON storage.objects;
DROP POLICY IF EXISTS "OT admins can delete photos" ON storage.objects;

-- Create new policies that verify assessment ownership
-- Path format expected: {assessment_id}/{filename}

-- Policy for uploading photos (INSERT)
CREATE POLICY "OTs can upload photos to their assessments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assessment-photos' AND
    public.has_role(auth.uid(), 'ot_admin') AND
    -- Extract assessment_id from path (first segment) and verify ownership
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE id::text = (string_to_array(name, '/'))[1]
      AND (assigned_ot_id = auth.uid() OR created_by = auth.uid())
    )
  );

-- Policy for viewing photos (SELECT)
CREATE POLICY "OTs can view photos from their assessments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assessment-photos' AND
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE id::text = (string_to_array(name, '/'))[1]
      AND (assigned_ot_id = auth.uid() OR created_by = auth.uid())
    )
  );

-- Policy for updating photos (UPDATE)
CREATE POLICY "OTs can update photos in their assessments"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'assessment-photos' AND
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE id::text = (string_to_array(name, '/'))[1]
      AND (assigned_ot_id = auth.uid() OR created_by = auth.uid())
    )
  );

-- Policy for deleting photos (DELETE)
CREATE POLICY "OTs can delete photos from their assessments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assessment-photos' AND
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE id::text = (string_to_array(name, '/'))[1]
      AND (assigned_ot_id = auth.uid() OR created_by = auth.uid())
    )
  );