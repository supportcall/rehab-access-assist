-- Add SELECT policies for system_admin on all relevant tables

-- Clients table
CREATE POLICY "System admins can view all clients"
ON public.clients
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Assessments table
CREATE POLICY "System admins can view all assessments"
ON public.assessments
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Profiles table
CREATE POLICY "System admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Clinical assessment table
CREATE POLICY "System admins can view all clinical_assessment"
ON public.clinical_assessment
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Environmental areas table
CREATE POLICY "System admins can view all environmental_areas"
ON public.environmental_areas
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Measurements table
CREATE POLICY "System admins can view all measurements"
ON public.measurements
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Site survey table
CREATE POLICY "System admins can view all site_survey"
ON public.site_survey
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- AT audit table
CREATE POLICY "System admins can view all at_audit"
ON public.at_audit
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Structural reconnaissance table
CREATE POLICY "System admins can view all structural_reconnaissance"
ON public.structural_reconnaissance
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Builder collaboration table
CREATE POLICY "System admins can view all builder_collaboration"
ON public.builder_collaboration
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Options analysis table
CREATE POLICY "System admins can view all options_analysis"
ON public.options_analysis
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Risks controls table
CREATE POLICY "System admins can view all risks_controls"
ON public.risks_controls
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Compliance checklist table
CREATE POLICY "System admins can view all compliance_checklist"
ON public.compliance_checklist
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Deliverables table
CREATE POLICY "System admins can view all deliverables"
ON public.deliverables
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Funding pathway table
CREATE POLICY "System admins can view all funding_pathway"
ON public.funding_pathway
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Pre visit details table
CREATE POLICY "System admins can view all pre_visit_details"
ON public.pre_visit_details
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Stakeholders table
CREATE POLICY "System admins can view all stakeholders"
ON public.stakeholders
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Technical drawings table
CREATE POLICY "System admins can view all technical_drawings"
ON public.technical_drawings
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Referrals table
CREATE POLICY "System admins can view all referrals"
ON public.referrals
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Assessment tokens table
CREATE POLICY "System admins can view all assessment_tokens"
ON public.assessment_tokens
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- User roles table - allow admins to view all roles
CREATE POLICY "System admins can view all user_roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));