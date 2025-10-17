-- Comprehensive Security Fix: Restrict Assessment and Referral Access to Owners Only
-- This migration fixes 3 critical security vulnerabilities by adding ownership verification

-- ============================================================================
-- 1. FIX ASSESSMENT-RELATED TABLES (15 tables)
-- Replace role-only policies with ownership-verified policies
-- ============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "OT admins can view all assessments" ON public.assessments;
DROP POLICY IF EXISTS "OT admins can create assessments" ON public.assessments;
DROP POLICY IF EXISTS "OT admins can update assessments" ON public.assessments;
DROP POLICY IF EXISTS "OT admins can delete assessments" ON public.assessments;

DROP POLICY IF EXISTS "OT admins can manage clinical_assessment" ON public.clinical_assessment;
DROP POLICY IF EXISTS "OT admins can manage at_audit" ON public.at_audit;
DROP POLICY IF EXISTS "OT admins can manage site_survey" ON public.site_survey;
DROP POLICY IF EXISTS "OT admins can manage measurements" ON public.measurements;
DROP POLICY IF EXISTS "OT admins can manage risks_controls" ON public.risks_controls;
DROP POLICY IF EXISTS "OT admins can manage options_analysis" ON public.options_analysis;
DROP POLICY IF EXISTS "OT admins can manage compliance_checklist" ON public.compliance_checklist;
DROP POLICY IF EXISTS "OT admins can manage builder_collaboration" ON public.builder_collaboration;
DROP POLICY IF EXISTS "OT admins can manage deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "OT admins can manage structural_reconnaissance" ON public.structural_reconnaissance;
DROP POLICY IF EXISTS "OT admins can manage funding_pathway" ON public.funding_pathway;
DROP POLICY IF EXISTS "OT admins can manage stakeholders" ON public.stakeholders;
DROP POLICY IF EXISTS "OT admins can manage pre_visit_details" ON public.pre_visit_details;

DROP POLICY IF EXISTS "OT admins can view all areas" ON public.environmental_areas;
DROP POLICY IF EXISTS "OT admins can create areas" ON public.environmental_areas;
DROP POLICY IF EXISTS "OT admins can update areas" ON public.environmental_areas;
DROP POLICY IF EXISTS "OT admins can delete areas" ON public.environmental_areas;

-- Create new ownership-verified policies for assessments table
CREATE POLICY "OTs can view their own assessments"
  ON public.assessments FOR SELECT
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    (assigned_ot_id = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "OTs can create assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'ot_admin') AND
    created_by = auth.uid()
  );

CREATE POLICY "OTs can update their own assessments"
  ON public.assessments FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    (assigned_ot_id = auth.uid() OR created_by = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'ot_admin') AND
    (assigned_ot_id = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "OTs can delete their own assessments"
  ON public.assessments FOR DELETE
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    created_by = auth.uid()
  );

-- Create ownership-verified policies for clinical_assessment
CREATE POLICY "OTs can manage their clinical assessments"
  ON public.clinical_assessment FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = clinical_assessment.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for at_audit
CREATE POLICY "OTs can manage their at_audit records"
  ON public.at_audit FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = at_audit.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for site_survey
CREATE POLICY "OTs can manage their site_survey records"
  ON public.site_survey FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = site_survey.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for measurements
CREATE POLICY "OTs can manage their measurements"
  ON public.measurements FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = measurements.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for risks_controls
CREATE POLICY "OTs can manage their risks_controls"
  ON public.risks_controls FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = risks_controls.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for options_analysis
CREATE POLICY "OTs can manage their options_analysis"
  ON public.options_analysis FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = options_analysis.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for compliance_checklist
CREATE POLICY "OTs can manage their compliance_checklist"
  ON public.compliance_checklist FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = compliance_checklist.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for builder_collaboration
CREATE POLICY "OTs can manage their builder_collaboration"
  ON public.builder_collaboration FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = builder_collaboration.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for deliverables
CREATE POLICY "OTs can manage their deliverables"
  ON public.deliverables FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = deliverables.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for structural_reconnaissance
CREATE POLICY "OTs can manage their structural_reconnaissance"
  ON public.structural_reconnaissance FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = structural_reconnaissance.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for funding_pathway
CREATE POLICY "OTs can manage their funding_pathway"
  ON public.funding_pathway FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = funding_pathway.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for stakeholders
CREATE POLICY "OTs can manage their stakeholders"
  ON public.stakeholders FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = stakeholders.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for pre_visit_details
CREATE POLICY "OTs can manage their pre_visit_details"
  ON public.pre_visit_details FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = pre_visit_details.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- Create ownership-verified policies for environmental_areas
CREATE POLICY "OTs can view their environmental_areas"
  ON public.environmental_areas FOR SELECT
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = environmental_areas.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

CREATE POLICY "OTs can create environmental_areas"
  ON public.environmental_areas FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = environmental_areas.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

CREATE POLICY "OTs can update their environmental_areas"
  ON public.environmental_areas FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = environmental_areas.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

CREATE POLICY "OTs can delete their environmental_areas"
  ON public.environmental_areas FOR DELETE
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = environmental_areas.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- ============================================================================
-- 2. FIX ASSESSMENT_TOKENS TABLE
-- Restrict token access to assessment owners only
-- ============================================================================

DROP POLICY IF EXISTS "OT admins can manage tokens" ON public.assessment_tokens;

CREATE POLICY "OTs can manage tokens for their assessments"
  ON public.assessment_tokens FOR ALL
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = assessment_tokens.assessment_id
      AND (a.assigned_ot_id = auth.uid() OR a.created_by = auth.uid())
    )
  );

-- ============================================================================
-- 3. FIX REFERRALS TABLE
-- Separate policies for requesting OT vs target OT
-- ============================================================================

DROP POLICY IF EXISTS "OT admins can manage referrals" ON public.referrals;

-- Requesting OT and target OT can view referrals
CREATE POLICY "OTs can view their sent and received referrals"
  ON public.referrals FOR SELECT
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    (requesting_ot_id = auth.uid() OR target_ot_id = auth.uid())
  );

-- All OTs can create referrals
CREATE POLICY "OTs can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'ot_admin') AND
    requesting_ot_id = auth.uid()
  );

-- Only target OT can update referrals (accept/reject)
CREATE POLICY "Target OTs can update their pending referrals"
  ON public.referrals FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    target_ot_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'ot_admin') AND
    target_ot_id = auth.uid()
  );

-- Only requesting OT can delete their referrals (if pending)
CREATE POLICY "Requesting OTs can delete their pending referrals"
  ON public.referrals FOR DELETE
  USING (
    public.has_role(auth.uid(), 'ot_admin') AND
    requesting_ot_id = auth.uid() AND
    status = 'pending'
  );