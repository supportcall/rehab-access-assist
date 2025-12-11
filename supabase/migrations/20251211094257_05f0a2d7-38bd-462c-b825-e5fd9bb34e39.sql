-- Add UPDATE, INSERT, DELETE policies for system_admin on all relevant tables

-- Clients table
CREATE POLICY "System admins can update all clients"
ON public.clients
FOR UPDATE
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "System admins can insert clients"
ON public.clients
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "System admins can delete clients"
ON public.clients
FOR DELETE
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Assessments table
CREATE POLICY "System admins can update all assessments"
ON public.assessments
FOR UPDATE
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "System admins can insert assessments"
ON public.assessments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "System admins can delete assessments"
ON public.assessments
FOR DELETE
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Profiles table
CREATE POLICY "System admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Clinical assessment table
CREATE POLICY "System admins can manage all clinical_assessment"
ON public.clinical_assessment
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Environmental areas table
CREATE POLICY "System admins can manage all environmental_areas"
ON public.environmental_areas
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Measurements table
CREATE POLICY "System admins can manage all measurements"
ON public.measurements
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Site survey table
CREATE POLICY "System admins can manage all site_survey"
ON public.site_survey
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- AT audit table
CREATE POLICY "System admins can manage all at_audit"
ON public.at_audit
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Structural reconnaissance table
CREATE POLICY "System admins can manage all structural_reconnaissance"
ON public.structural_reconnaissance
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Builder collaboration table
CREATE POLICY "System admins can manage all builder_collaboration"
ON public.builder_collaboration
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Options analysis table
CREATE POLICY "System admins can manage all options_analysis"
ON public.options_analysis
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Risks controls table
CREATE POLICY "System admins can manage all risks_controls"
ON public.risks_controls
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Compliance checklist table
CREATE POLICY "System admins can manage all compliance_checklist"
ON public.compliance_checklist
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Deliverables table
CREATE POLICY "System admins can manage all deliverables"
ON public.deliverables
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Funding pathway table
CREATE POLICY "System admins can manage all funding_pathway"
ON public.funding_pathway
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Pre visit details table
CREATE POLICY "System admins can manage all pre_visit_details"
ON public.pre_visit_details
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Stakeholders table
CREATE POLICY "System admins can manage all stakeholders"
ON public.stakeholders
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Technical drawings table
CREATE POLICY "System admins can manage all technical_drawings"
ON public.technical_drawings
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Referrals table
CREATE POLICY "System admins can manage all referrals"
ON public.referrals
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Assessment tokens table
CREATE POLICY "System admins can manage all assessment_tokens"
ON public.assessment_tokens
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- User roles table - allow admins to manage all roles
CREATE POLICY "System admins can manage all user_roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- OT signup requests - allow admins to manage
CREATE POLICY "System admins can manage all ot_signup_requests"
ON public.ot_signup_requests
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));