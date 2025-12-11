-- Create table for storing technical drawings
CREATE TABLE public.technical_drawings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  drawing_type TEXT NOT NULL CHECK (drawing_type IN ('floor_plan', 'elevation', 'detail', 'site_plan')),
  room_area TEXT,
  title TEXT NOT NULL,
  description TEXT,
  svg_content TEXT,
  ai_generated BOOLEAN DEFAULT false,
  photo_references JSONB DEFAULT '[]'::jsonb,
  measurements_used JSONB DEFAULT '[]'::jsonb,
  annotations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technical_drawings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "OTs can manage their technical_drawings"
ON public.technical_drawings
FOR ALL
USING (
  has_role(auth.uid(), 'ot_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM assessments a
    WHERE a.id = technical_drawings.assessment_id
    AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_technical_drawings_updated_at
BEFORE UPDATE ON public.technical_drawings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_technical_drawings_assessment_id ON public.technical_drawings(assessment_id);