-- ============================================================================
-- COMPREHENSIVE OT HOME MODIFICATIONS ASSESSMENT DATABASE EXPANSION
-- Based on Australian NDIS/NDIA standards and NCC/LHDS requirements
-- ============================================================================

-- 1. PRE-VISIT DETAILS (Section 1 of checklist)
CREATE TABLE IF NOT EXISTS public.pre_visit_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  referral_reason text,
  approval_pathway text, -- 'minor' or 'complex'
  ndia_template_used text,
  diagnoses_prognosis text,
  participant_goals text,
  prior_falls_incidents text,
  current_at_list text,
  floor_plans_available boolean DEFAULT false,
  tenancy_ownership_details text,
  landlord_strata_contacts text,
  previous_modifications text,
  consent_obtained boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.pre_visit_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage pre_visit_details"
  ON public.pre_visit_details
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 2. STAKEHOLDERS (Section 2 of checklist)
CREATE TABLE IF NOT EXISTS public.stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  participant_name text,
  decision_makers text,
  informal_carers text,
  support_coordinator text,
  plan_manager text,
  builder_bcp text,
  project_manager text,
  ot_assessor text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage stakeholders"
  ON public.stakeholders
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 3. FUNDING PATHWAY (Section 3 - NDIS specifics)
CREATE TABLE IF NOT EXISTS public.funding_pathway (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  classification text, -- 'minor' or 'complex'
  category text, -- 'A' (< $10k) or 'B' ($10-20k) for minor
  estimated_cost numeric(10,2),
  quotes_required integer, -- 0 for minor, 2 for complex
  ndia_criteria_effectiveness text,
  ndia_criteria_safety text,
  ndia_criteria_goals text,
  ndia_criteria_alternatives text,
  ndia_criteria_value text,
  structural_works boolean DEFAULT false,
  multi_area_works boolean DEFAULT false,
  permits_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.funding_pathway ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage funding_pathway"
  ON public.funding_pathway
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 4. CLINICAL ASSESSMENT (Section 4 - detailed person-level assessment)
CREATE TABLE IF NOT EXISTS public.clinical_assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Mobility
  mobility_status text, -- 'ambulant' or 'wheelchair'
  wheelchair_type text, -- 'manual', 'power', or null
  gait_endurance text,
  transfer_methods text,
  hoist_needed boolean DEFAULT false,
  
  -- ADLs/IADLs
  adl_bathing text,
  adl_toileting text,
  adl_dressing text,
  adl_kitchen text,
  adl_laundry text,
  adl_entry_egress text,
  adl_community_access text,
  adl_vehicle_transfers text,
  
  -- Anthropometrics (in mm)
  standing_height numeric(6,1),
  sitting_height numeric(6,1),
  shoulder_height numeric(6,1),
  reach_measurement numeric(6,1),
  knee_clearance numeric(6,1),
  toe_clearance numeric(6,1),
  wheelchair_length numeric(6,1),
  wheelchair_width numeric(6,1),
  wheelchair_height numeric(6,1),
  wheelchair_turning_radius numeric(6,1),
  
  -- Clinical factors
  cognition_status text,
  vision_status text,
  perception_status text,
  communication_needs text,
  sensory_sensitivities text,
  fatigue_pain text,
  thermoregulation text,
  continence text,
  skin_integrity text,
  pressure_care_needed boolean DEFAULT false,
  
  -- Carer capacity
  carer_capacity text,
  manual_handling_risk text,
  single_carer boolean,
  two_carer_needed boolean DEFAULT false,
  
  -- Outcome measures
  copm_score text,
  home_fast_score text,
  safer_home_score text,
  westmead_score text,
  
  -- Special populations
  special_population text, -- 'paediatric', 'bariatric', 'dementia', 'mental_health', 'sensory'
  special_considerations text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.clinical_assessment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage clinical_assessment"
  ON public.clinical_assessment
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 5. AT AUDIT (Section 5 - Assistive Technology)
CREATE TABLE IF NOT EXISTS public.at_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_at_type text,
  at_condition text,
  at_compliance boolean,
  at_maintenance text,
  trials_conducted text,
  trial_outcomes text,
  structural_works_still_required boolean,
  structural_works_justification text,
  charging_requirements text,
  storage_requirements text,
  power_requirements text,
  maneuvering_envelopes text,
  photo_urls text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.at_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage at_audit"
  ON public.at_audit
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 6. SITE SURVEY (Section 6 - comprehensive environmental survey)
CREATE TABLE IF NOT EXISTS public.site_survey (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Site access / parking / egress
  parking_bay_dimensions text,
  kerb_driveway_gradients text,
  set_down_area boolean,
  weather_protection boolean,
  site_lighting text,
  path_width numeric(6,1), -- mm
  path_gradient text, -- ratio e.g. '1:14'
  path_crossfall text, -- ratio e.g. '1:40'
  step_ramp_feasible boolean,
  gate_clear_opening numeric(6,1), -- mm, should be ≥820
  drainage_adequate boolean,
  stormwater_impacts text,
  
  -- Entry
  entrance_door_clear_opening numeric(6,1), -- mm, should be ≥820
  entrance_threshold_height numeric(6,1), -- mm, should be ≤5
  entrance_landing_area text,
  
  -- Internal circulation
  doors_compliant boolean, -- ≥820mm clear
  corridors_width numeric(6,1), -- mm, should be ≥1000
  turning_spaces_adequate boolean, -- 1500x1500 for 60-90° turns
  
  -- Living/dining
  living_furniture_layout text,
  living_control_reaches text,
  living_trip_risks text,
  living_seating_heights text,
  living_photo_urls text[],
  
  -- Kitchen
  kitchen_bench_heights numeric(6,1), -- mm
  kitchen_aisle_widths numeric(6,1), -- mm
  kitchen_knee_clearances numeric(6,1), -- mm
  kitchen_hob_access text,
  kitchen_sink_access text,
  kitchen_oven_access text,
  kitchen_storage_access text,
  kitchen_task_lighting text,
  kitchen_scald_risk text,
  kitchen_photo_urls text[],
  
  -- Bedroom
  bedroom_bed_height numeric(6,1), -- mm
  bedroom_transfer_sides text,
  bedroom_commode_space boolean,
  bedroom_hoist_space boolean,
  bedroom_wardrobe_reach text,
  bedroom_emergency_egress boolean,
  bedroom_photo_urls text[],
  
  -- Bathroom/toilet
  bathroom_hobless_shower_feasible boolean,
  bathroom_screen_type text,
  bathroom_falls_to_waste text,
  bathroom_slip_resistance text,
  bathroom_wall_reinforcement boolean, -- LHDS Part 6
  bathroom_toilet_height numeric(6,1), -- mm
  bathroom_toilet_setout text,
  bathroom_basin_approach text,
  bathroom_ventilation text,
  bathroom_ip_ratings text,
  bathroom_photo_urls text[],
  
  -- Laundry
  laundry_machine_access text, -- front loader access
  laundry_circulation text,
  laundry_drainage text,
  laundry_photo_urls text[],
  
  -- Stairs/ramps
  stairs_treads_risers text,
  stairs_nosings text,
  stairs_handrail_config text,
  stairs_landings text,
  stairs_headroom numeric(6,1), -- mm
  stairs_lighting text,
  stairs_photo_urls text[],
  
  -- Outdoor areas
  outdoor_thresholds text,
  outdoor_patio_levels text,
  outdoor_hardstand boolean,
  outdoor_bin_access text,
  outdoor_clothesline_access text,
  outdoor_weather_drainage text,
  outdoor_photo_urls text[],
  
  -- Services & building systems
  switches_gpos_heights text,
  board_capacity text,
  rcds_present boolean,
  smoke_alarms_compliant boolean, -- AS 3786:2023
  smoke_alarms_interconnected boolean,
  heating_cooling_controls text,
  comms_intercom text,
  hot_water_temp_compliant boolean, -- ≤50°C at outlets
  tmv_present boolean,
  ventilation_wet_areas text,
  
  -- Materials & hazardous substances
  asbestos_likelihood text,
  asbestos_locations text,
  asbestos_testing_required boolean,
  lead_paint_risk text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_survey ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage site_survey"
  ON public.site_survey
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 7. STRUCTURAL RECONNAISSANCE (Section 7)
CREATE TABLE IF NOT EXISTS public.structural_reconnaissance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  wall_construction text,
  stud_layout text,
  ceiling_roof_framing text,
  slab_joist_details text,
  hoist_load_paths text,
  deflection_tolerances text,
  engineer_required boolean DEFAULT false,
  engineer_notes text,
  photo_urls text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.structural_reconnaissance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage structural_reconnaissance"
  ON public.structural_reconnaissance
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 8. DETAILED MEASUREMENTS (Section 8)
CREATE TABLE IF NOT EXISTS public.measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  location text NOT NULL, -- 'external', 'door', 'corridor', 'bathroom', 'kitchen', 'bedroom', 'laundry'
  measurement_type text NOT NULL,
  value_mm numeric(8,1),
  required_value_mm numeric(8,1), -- for compliance checking
  compliant boolean,
  standard_reference text, -- e.g., 'LHDS', 'NCC', 'AS 1428.1'
  notes text,
  photo_urls text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage measurements"
  ON public.measurements
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 9. RISKS & CONTROLS (Section 9)
CREATE TABLE IF NOT EXISTS public.risks_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  risk_type text NOT NULL, -- 'falls', 'trip', 'slip', 'scald', 'electrical', 'fire', 'wandering', 'construction'
  risk_description text,
  severity text, -- 'low', 'medium', 'high', 'critical'
  control_measure text,
  home_fast_item text,
  safer_home_item text,
  wehsa_item text,
  lighting_contrast text,
  construction_phase_risks text,
  decanting_plan text,
  site_security text,
  infection_control text,
  photo_urls text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.risks_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage risks_controls"
  ON public.risks_controls
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 10. OPTIONS ANALYSIS (Section 10)
CREATE TABLE IF NOT EXISTS public.options_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  goal_area text NOT NULL,
  option_type text NOT NULL, -- 'non_structural_at', 'minor_works', 'complex_works', 'relocate'
  option_description text,
  clinical_impact text,
  compliance_notes text, -- NCC/LHDS/AS compliance
  risks text,
  buildability text,
  program_estimate text,
  estimated_cost numeric(10,2),
  value_for_money_justification text,
  ndia_alignment text,
  recommended boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.options_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage options_analysis"
  ON public.options_analysis
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 11. COMPLIANCE CHECKLIST (Section 11)
CREATE TABLE IF NOT EXISTS public.compliance_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  standard_reference text NOT NULL, -- 'NCC', 'LHDS', 'AS 1428.1', 'AS 3740', 'AS/NZS 3000', 'AS 3786', 'AS 1288', 'AS/NZS 3500.4'
  provision_number text,
  requirement_description text,
  compliant boolean,
  non_compliance_notes text,
  remediation_required text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.compliance_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage compliance_checklist"
  ON public.compliance_checklist
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 12. BUILDER COLLABORATION (Section 12)
CREATE TABLE IF NOT EXISTS public.builder_collaboration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bcp_engaged_early boolean DEFAULT false,
  bcp_name text,
  bcp_license_number text,
  
  -- Quote 1
  quote_1_provider text,
  quote_1_amount numeric(10,2),
  quote_1_breakdown text,
  quote_1_fixtures text,
  quote_1_gst_inclusive boolean DEFAULT true,
  quote_1_document_url text,
  
  -- Quote 2 (for complex works)
  quote_2_provider text,
  quote_2_amount numeric(10,2),
  quote_2_breakdown text,
  quote_2_fixtures text,
  quote_2_gst_inclusive boolean DEFAULT true,
  quote_2_document_url text,
  
  scope_of_works text,
  disability_specific_scope text,
  general_finishes_scope text,
  construction_sequence text,
  decant_plan text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.builder_collaboration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage builder_collaboration"
  ON public.builder_collaboration
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- 13. DELIVERABLES (Section 13)
CREATE TABLE IF NOT EXISTS public.deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  ndia_template_completed boolean DEFAULT false,
  consent_signed boolean DEFAULT false,
  executive_summary text,
  clinical_findings text,
  outcome_measures_results text,
  photos_annotated boolean DEFAULT false,
  measured_drawings_completed boolean DEFAULT false,
  risk_register_completed boolean DEFAULT false,
  scope_of_works_completed boolean DEFAULT false,
  compliance_statement text,
  quotes_analysis text,
  vfm_justification text,
  construction_sequencing text,
  handover_plan text,
  post_build_fit_check text,
  at_refit_plan text,
  client_carer_training_plan text,
  maintenance_notes text,
  post_occupancy_measurement_plan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OT admins can manage deliverables"
  ON public.deliverables
  FOR ALL
  USING (has_role(auth.uid(), 'ot_admin'));

-- Add triggers for updated_at on all new tables
CREATE TRIGGER update_pre_visit_details_updated_at BEFORE UPDATE ON public.pre_visit_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stakeholders_updated_at BEFORE UPDATE ON public.stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_funding_pathway_updated_at BEFORE UPDATE ON public.funding_pathway
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinical_assessment_updated_at BEFORE UPDATE ON public.clinical_assessment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_at_audit_updated_at BEFORE UPDATE ON public.at_audit
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_survey_updated_at BEFORE UPDATE ON public.site_survey
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_structural_reconnaissance_updated_at BEFORE UPDATE ON public.structural_reconnaissance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON public.measurements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risks_controls_updated_at BEFORE UPDATE ON public.risks_controls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_options_analysis_updated_at BEFORE UPDATE ON public.options_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_checklist_updated_at BEFORE UPDATE ON public.compliance_checklist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_builder_collaboration_updated_at BEFORE UPDATE ON public.builder_collaboration
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON public.deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();