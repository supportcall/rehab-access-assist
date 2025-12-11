export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assessment_tokens: {
        Row: {
          assessment_id: string
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_tokens_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_date: string | null
          assigned_ot_id: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          difficulty_showering: number | null
          difficulty_steps: number | null
          difficulty_toileting: number | null
          difficulty_transfers: number | null
          fall_history: string | null
          id: string
          near_miss_locations: string | null
          primary_goal: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_date?: string | null
          assigned_ot_id?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_showering?: number | null
          difficulty_steps?: number | null
          difficulty_toileting?: number | null
          difficulty_transfers?: number | null
          fall_history?: string | null
          id?: string
          near_miss_locations?: string | null
          primary_goal?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_date?: string | null
          assigned_ot_id?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_showering?: number | null
          difficulty_steps?: number | null
          difficulty_toileting?: number | null
          difficulty_transfers?: number | null
          fall_history?: string | null
          id?: string
          near_miss_locations?: string | null
          primary_goal?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_assigned_ot_id_fkey"
            columns: ["assigned_ot_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      at_audit: {
        Row: {
          assessment_id: string
          at_compliance: boolean | null
          at_condition: string | null
          at_maintenance: string | null
          charging_requirements: string | null
          created_at: string | null
          current_at_type: string | null
          id: string
          maneuvering_envelopes: string | null
          photo_urls: Json | null
          power_requirements: string | null
          storage_requirements: string | null
          structural_works_justification: string | null
          structural_works_still_required: boolean | null
          trial_outcomes: string | null
          trials_conducted: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          at_compliance?: boolean | null
          at_condition?: string | null
          at_maintenance?: string | null
          charging_requirements?: string | null
          created_at?: string | null
          current_at_type?: string | null
          id?: string
          maneuvering_envelopes?: string | null
          photo_urls?: Json | null
          power_requirements?: string | null
          storage_requirements?: string | null
          structural_works_justification?: string | null
          structural_works_still_required?: boolean | null
          trial_outcomes?: string | null
          trials_conducted?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          at_compliance?: boolean | null
          at_condition?: string | null
          at_maintenance?: string | null
          charging_requirements?: string | null
          created_at?: string | null
          current_at_type?: string | null
          id?: string
          maneuvering_envelopes?: string | null
          photo_urls?: Json | null
          power_requirements?: string | null
          storage_requirements?: string | null
          structural_works_justification?: string | null
          structural_works_still_required?: boolean | null
          trial_outcomes?: string | null
          trials_conducted?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "at_audit_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_collaboration: {
        Row: {
          assessment_id: string
          bcp_engaged_early: boolean | null
          bcp_license_number: string | null
          bcp_name: string | null
          construction_sequence: string | null
          created_at: string | null
          decant_plan: string | null
          disability_specific_scope: string | null
          general_finishes_scope: string | null
          id: string
          quote_1_amount: number | null
          quote_1_breakdown: string | null
          quote_1_document_url: string | null
          quote_1_fixtures: string | null
          quote_1_gst_inclusive: boolean | null
          quote_1_provider: string | null
          quote_2_amount: number | null
          quote_2_breakdown: string | null
          quote_2_document_url: string | null
          quote_2_fixtures: string | null
          quote_2_gst_inclusive: boolean | null
          quote_2_provider: string | null
          scope_of_works: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          bcp_engaged_early?: boolean | null
          bcp_license_number?: string | null
          bcp_name?: string | null
          construction_sequence?: string | null
          created_at?: string | null
          decant_plan?: string | null
          disability_specific_scope?: string | null
          general_finishes_scope?: string | null
          id?: string
          quote_1_amount?: number | null
          quote_1_breakdown?: string | null
          quote_1_document_url?: string | null
          quote_1_fixtures?: string | null
          quote_1_gst_inclusive?: boolean | null
          quote_1_provider?: string | null
          quote_2_amount?: number | null
          quote_2_breakdown?: string | null
          quote_2_document_url?: string | null
          quote_2_fixtures?: string | null
          quote_2_gst_inclusive?: boolean | null
          quote_2_provider?: string | null
          scope_of_works?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          bcp_engaged_early?: boolean | null
          bcp_license_number?: string | null
          bcp_name?: string | null
          construction_sequence?: string | null
          created_at?: string | null
          decant_plan?: string | null
          disability_specific_scope?: string | null
          general_finishes_scope?: string | null
          id?: string
          quote_1_amount?: number | null
          quote_1_breakdown?: string | null
          quote_1_document_url?: string | null
          quote_1_fixtures?: string | null
          quote_1_gst_inclusive?: boolean | null
          quote_1_provider?: string | null
          quote_2_amount?: number | null
          quote_2_breakdown?: string | null
          quote_2_document_url?: string | null
          quote_2_fixtures?: string | null
          quote_2_gst_inclusive?: boolean | null
          quote_2_provider?: string | null
          scope_of_works?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "builder_collaboration_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          assigned_ot_id: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          diagnosis: string | null
          first_name: string
          funding_body: Database["public"]["Enums"]["funding_body"] | null
          id: string
          last_name: string
          mobile_number: string | null
          notes: string | null
          postal_code: string | null
          primary_mobility_aid:
            | Database["public"]["Enums"]["mobility_aid"]
            | null
          state: string | null
          suburb: string | null
          system_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_ot_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          first_name: string
          funding_body?: Database["public"]["Enums"]["funding_body"] | null
          id?: string
          last_name: string
          mobile_number?: string | null
          notes?: string | null
          postal_code?: string | null
          primary_mobility_aid?:
            | Database["public"]["Enums"]["mobility_aid"]
            | null
          state?: string | null
          suburb?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_ot_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          first_name?: string
          funding_body?: Database["public"]["Enums"]["funding_body"] | null
          id?: string
          last_name?: string
          mobile_number?: string | null
          notes?: string | null
          postal_code?: string | null
          primary_mobility_aid?:
            | Database["public"]["Enums"]["mobility_aid"]
            | null
          state?: string | null
          suburb?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_ot_id_fkey"
            columns: ["assigned_ot_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_assessment: {
        Row: {
          adl_bathing: string | null
          adl_community_access: string | null
          adl_dressing: string | null
          adl_entry_egress: string | null
          adl_kitchen: string | null
          adl_laundry: string | null
          adl_toileting: string | null
          adl_vehicle_transfers: string | null
          assessment_id: string
          carer_capacity: string | null
          cognition_status: string | null
          communication_needs: string | null
          continence: string | null
          copm_score: string | null
          created_at: string | null
          fatigue_pain: string | null
          gait_endurance: string | null
          hoist_needed: boolean | null
          home_fast_score: string | null
          id: string
          knee_clearance: number | null
          manual_handling_risk: string | null
          mobility_status: string | null
          perception_status: string | null
          pressure_care_needed: boolean | null
          reach_measurement: number | null
          safer_home_score: string | null
          sensory_sensitivities: string | null
          shoulder_height: number | null
          single_carer: boolean | null
          sitting_height: number | null
          skin_integrity: string | null
          special_considerations: string | null
          special_population: string | null
          standing_height: number | null
          thermoregulation: string | null
          toe_clearance: number | null
          transfer_methods: string | null
          two_carer_needed: boolean | null
          updated_at: string | null
          vision_status: string | null
          westmead_score: string | null
          wheelchair_height: number | null
          wheelchair_length: number | null
          wheelchair_turning_radius: number | null
          wheelchair_type: string | null
          wheelchair_width: number | null
        }
        Insert: {
          adl_bathing?: string | null
          adl_community_access?: string | null
          adl_dressing?: string | null
          adl_entry_egress?: string | null
          adl_kitchen?: string | null
          adl_laundry?: string | null
          adl_toileting?: string | null
          adl_vehicle_transfers?: string | null
          assessment_id: string
          carer_capacity?: string | null
          cognition_status?: string | null
          communication_needs?: string | null
          continence?: string | null
          copm_score?: string | null
          created_at?: string | null
          fatigue_pain?: string | null
          gait_endurance?: string | null
          hoist_needed?: boolean | null
          home_fast_score?: string | null
          id?: string
          knee_clearance?: number | null
          manual_handling_risk?: string | null
          mobility_status?: string | null
          perception_status?: string | null
          pressure_care_needed?: boolean | null
          reach_measurement?: number | null
          safer_home_score?: string | null
          sensory_sensitivities?: string | null
          shoulder_height?: number | null
          single_carer?: boolean | null
          sitting_height?: number | null
          skin_integrity?: string | null
          special_considerations?: string | null
          special_population?: string | null
          standing_height?: number | null
          thermoregulation?: string | null
          toe_clearance?: number | null
          transfer_methods?: string | null
          two_carer_needed?: boolean | null
          updated_at?: string | null
          vision_status?: string | null
          westmead_score?: string | null
          wheelchair_height?: number | null
          wheelchair_length?: number | null
          wheelchair_turning_radius?: number | null
          wheelchair_type?: string | null
          wheelchair_width?: number | null
        }
        Update: {
          adl_bathing?: string | null
          adl_community_access?: string | null
          adl_dressing?: string | null
          adl_entry_egress?: string | null
          adl_kitchen?: string | null
          adl_laundry?: string | null
          adl_toileting?: string | null
          adl_vehicle_transfers?: string | null
          assessment_id?: string
          carer_capacity?: string | null
          cognition_status?: string | null
          communication_needs?: string | null
          continence?: string | null
          copm_score?: string | null
          created_at?: string | null
          fatigue_pain?: string | null
          gait_endurance?: string | null
          hoist_needed?: boolean | null
          home_fast_score?: string | null
          id?: string
          knee_clearance?: number | null
          manual_handling_risk?: string | null
          mobility_status?: string | null
          perception_status?: string | null
          pressure_care_needed?: boolean | null
          reach_measurement?: number | null
          safer_home_score?: string | null
          sensory_sensitivities?: string | null
          shoulder_height?: number | null
          single_carer?: boolean | null
          sitting_height?: number | null
          skin_integrity?: string | null
          special_considerations?: string | null
          special_population?: string | null
          standing_height?: number | null
          thermoregulation?: string | null
          toe_clearance?: number | null
          transfer_methods?: string | null
          two_carer_needed?: boolean | null
          updated_at?: string | null
          vision_status?: string | null
          westmead_score?: string | null
          wheelchair_height?: number | null
          wheelchair_length?: number | null
          wheelchair_turning_radius?: number | null
          wheelchair_type?: string | null
          wheelchair_width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_assessment_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_checklist: {
        Row: {
          assessment_id: string
          compliant: boolean | null
          created_at: string | null
          id: string
          non_compliance_notes: string | null
          provision_number: string | null
          remediation_required: string | null
          requirement_description: string | null
          standard_reference: string
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          compliant?: boolean | null
          created_at?: string | null
          id?: string
          non_compliance_notes?: string | null
          provision_number?: string | null
          remediation_required?: string | null
          requirement_description?: string | null
          standard_reference: string
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          compliant?: boolean | null
          created_at?: string | null
          id?: string
          non_compliance_notes?: string | null
          provision_number?: string | null
          remediation_required?: string | null
          requirement_description?: string | null
          standard_reference?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_checklist_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          assessment_id: string
          at_refit_plan: string | null
          client_carer_training_plan: string | null
          clinical_findings: string | null
          compliance_statement: string | null
          consent_signed: boolean | null
          construction_sequencing: string | null
          created_at: string | null
          executive_summary: string | null
          handover_plan: string | null
          id: string
          maintenance_notes: string | null
          measured_drawings_completed: boolean | null
          ndia_template_completed: boolean | null
          outcome_measures_results: string | null
          photos_annotated: boolean | null
          post_build_fit_check: string | null
          post_occupancy_measurement_plan: string | null
          quotes_analysis: string | null
          risk_register_completed: boolean | null
          scope_of_works_completed: boolean | null
          updated_at: string | null
          vfm_justification: string | null
        }
        Insert: {
          assessment_id: string
          at_refit_plan?: string | null
          client_carer_training_plan?: string | null
          clinical_findings?: string | null
          compliance_statement?: string | null
          consent_signed?: boolean | null
          construction_sequencing?: string | null
          created_at?: string | null
          executive_summary?: string | null
          handover_plan?: string | null
          id?: string
          maintenance_notes?: string | null
          measured_drawings_completed?: boolean | null
          ndia_template_completed?: boolean | null
          outcome_measures_results?: string | null
          photos_annotated?: boolean | null
          post_build_fit_check?: string | null
          post_occupancy_measurement_plan?: string | null
          quotes_analysis?: string | null
          risk_register_completed?: boolean | null
          scope_of_works_completed?: boolean | null
          updated_at?: string | null
          vfm_justification?: string | null
        }
        Update: {
          assessment_id?: string
          at_refit_plan?: string | null
          client_carer_training_plan?: string | null
          clinical_findings?: string | null
          compliance_statement?: string | null
          consent_signed?: boolean | null
          construction_sequencing?: string | null
          created_at?: string | null
          executive_summary?: string | null
          handover_plan?: string | null
          id?: string
          maintenance_notes?: string | null
          measured_drawings_completed?: boolean | null
          ndia_template_completed?: boolean | null
          outcome_measures_results?: string | null
          photos_annotated?: boolean | null
          post_build_fit_check?: string | null
          post_occupancy_measurement_plan?: string | null
          quotes_analysis?: string | null
          risk_register_completed?: boolean | null
          scope_of_works_completed?: boolean | null
          updated_at?: string | null
          vfm_justification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      environmental_areas: {
        Row: {
          area_location: Database["public"]["Enums"]["area_location"]
          area_name: string | null
          assessment_id: string
          barriers: string | null
          created_at: string | null
          door_clear_width: number | null
          id: string
          notes: string | null
          photo_urls: Json | null
          ramp_gradient_going: number | null
          ramp_gradient_riser: number | null
          threshold_height: number | null
          toilet_centerline_left: number | null
          toilet_centerline_right: number | null
          updated_at: string | null
          wall_construction:
            | Database["public"]["Enums"]["wall_construction"]
            | null
        }
        Insert: {
          area_location: Database["public"]["Enums"]["area_location"]
          area_name?: string | null
          assessment_id: string
          barriers?: string | null
          created_at?: string | null
          door_clear_width?: number | null
          id?: string
          notes?: string | null
          photo_urls?: Json | null
          ramp_gradient_going?: number | null
          ramp_gradient_riser?: number | null
          threshold_height?: number | null
          toilet_centerline_left?: number | null
          toilet_centerline_right?: number | null
          updated_at?: string | null
          wall_construction?:
            | Database["public"]["Enums"]["wall_construction"]
            | null
        }
        Update: {
          area_location?: Database["public"]["Enums"]["area_location"]
          area_name?: string | null
          assessment_id?: string
          barriers?: string | null
          created_at?: string | null
          door_clear_width?: number | null
          id?: string
          notes?: string | null
          photo_urls?: Json | null
          ramp_gradient_going?: number | null
          ramp_gradient_riser?: number | null
          threshold_height?: number | null
          toilet_centerline_left?: number | null
          toilet_centerline_right?: number | null
          updated_at?: string | null
          wall_construction?:
            | Database["public"]["Enums"]["wall_construction"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "environmental_areas_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_pathway: {
        Row: {
          assessment_id: string
          category: string | null
          classification: string | null
          created_at: string | null
          estimated_cost: number | null
          id: string
          multi_area_works: boolean | null
          ndia_criteria_alternatives: string | null
          ndia_criteria_effectiveness: string | null
          ndia_criteria_goals: string | null
          ndia_criteria_safety: string | null
          ndia_criteria_value: string | null
          permits_required: boolean | null
          quotes_required: number | null
          structural_works: boolean | null
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          category?: string | null
          classification?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          multi_area_works?: boolean | null
          ndia_criteria_alternatives?: string | null
          ndia_criteria_effectiveness?: string | null
          ndia_criteria_goals?: string | null
          ndia_criteria_safety?: string | null
          ndia_criteria_value?: string | null
          permits_required?: boolean | null
          quotes_required?: number | null
          structural_works?: boolean | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          category?: string | null
          classification?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          multi_area_works?: boolean | null
          ndia_criteria_alternatives?: string | null
          ndia_criteria_effectiveness?: string | null
          ndia_criteria_goals?: string | null
          ndia_criteria_safety?: string | null
          ndia_criteria_value?: string | null
          permits_required?: boolean | null
          quotes_required?: number | null
          structural_works?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funding_pathway_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          assessment_id: string
          compliant: boolean | null
          created_at: string | null
          id: string
          location: string
          measurement_type: string
          notes: string | null
          photo_urls: Json | null
          required_value_mm: number | null
          standard_reference: string | null
          updated_at: string | null
          value_mm: number | null
        }
        Insert: {
          assessment_id: string
          compliant?: boolean | null
          created_at?: string | null
          id?: string
          location: string
          measurement_type: string
          notes?: string | null
          photo_urls?: Json | null
          required_value_mm?: number | null
          standard_reference?: string | null
          updated_at?: string | null
          value_mm?: number | null
        }
        Update: {
          assessment_id?: string
          compliant?: boolean | null
          created_at?: string | null
          id?: string
          location?: string
          measurement_type?: string
          notes?: string | null
          photo_urls?: Json | null
          required_value_mm?: number | null
          standard_reference?: string | null
          updated_at?: string | null
          value_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      options_analysis: {
        Row: {
          assessment_id: string
          buildability: string | null
          clinical_impact: string | null
          compliance_notes: string | null
          created_at: string | null
          estimated_cost: number | null
          goal_area: string
          id: string
          ndia_alignment: string | null
          option_description: string | null
          option_type: string
          program_estimate: string | null
          recommended: boolean | null
          risks: string | null
          updated_at: string | null
          value_for_money_justification: string | null
        }
        Insert: {
          assessment_id: string
          buildability?: string | null
          clinical_impact?: string | null
          compliance_notes?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          goal_area: string
          id?: string
          ndia_alignment?: string | null
          option_description?: string | null
          option_type: string
          program_estimate?: string | null
          recommended?: boolean | null
          risks?: string | null
          updated_at?: string | null
          value_for_money_justification?: string | null
        }
        Update: {
          assessment_id?: string
          buildability?: string | null
          clinical_impact?: string | null
          compliance_notes?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          goal_area?: string
          id?: string
          ndia_alignment?: string | null
          option_description?: string | null
          option_type?: string
          program_estimate?: string | null
          recommended?: boolean | null
          risks?: string | null
          updated_at?: string | null
          value_for_money_justification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "options_analysis_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_signup_requests: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          rejection_reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pre_visit_details: {
        Row: {
          approval_pathway: string | null
          assessment_id: string
          consent_obtained: boolean | null
          created_at: string | null
          current_at_list: string | null
          diagnoses_prognosis: string | null
          floor_plans_available: boolean | null
          id: string
          landlord_strata_contacts: string | null
          ndia_template_used: string | null
          participant_goals: string | null
          previous_modifications: string | null
          prior_falls_incidents: string | null
          referral_reason: string | null
          tenancy_ownership_details: string | null
          updated_at: string | null
        }
        Insert: {
          approval_pathway?: string | null
          assessment_id: string
          consent_obtained?: boolean | null
          created_at?: string | null
          current_at_list?: string | null
          diagnoses_prognosis?: string | null
          floor_plans_available?: boolean | null
          id?: string
          landlord_strata_contacts?: string | null
          ndia_template_used?: string | null
          participant_goals?: string | null
          previous_modifications?: string | null
          prior_falls_incidents?: string | null
          referral_reason?: string | null
          tenancy_ownership_details?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_pathway?: string | null
          assessment_id?: string
          consent_obtained?: boolean | null
          created_at?: string | null
          current_at_list?: string | null
          diagnoses_prognosis?: string | null
          floor_plans_available?: boolean | null
          id?: string
          landlord_strata_contacts?: string | null
          ndia_template_used?: string | null
          participant_goals?: string | null
          previous_modifications?: string | null
          prior_falls_incidents?: string | null
          referral_reason?: string | null
          tenancy_ownership_details?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_visit_details_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aphra_registration_number: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          mobile_number: string | null
          phone: string | null
          postal_code: string | null
          service_area_type: string | null
          service_area_value: string | null
          service_radius_km: number | null
          state: string | null
          suburb: string | null
          system_id: string | null
          updated_at: string | null
        }
        Insert: {
          aphra_registration_number?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          mobile_number?: string | null
          phone?: string | null
          postal_code?: string | null
          service_area_type?: string | null
          service_area_value?: string | null
          service_radius_km?: number | null
          state?: string | null
          suburb?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aphra_registration_number?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile_number?: string | null
          phone?: string | null
          postal_code?: string | null
          service_area_type?: string | null
          service_area_value?: string | null
          service_radius_km?: number | null
          state?: string | null
          suburb?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          notes: string | null
          referred_to_ot_id: string | null
          requesting_ot_id: string | null
          status: string
          target_ot_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          referred_to_ot_id?: string | null
          requesting_ot_id?: string | null
          status?: string
          target_ot_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          referred_to_ot_id?: string | null
          requesting_ot_id?: string | null
          status?: string
          target_ot_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_to_ot_id_fkey"
            columns: ["referred_to_ot_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_requesting_ot_id_fkey"
            columns: ["requesting_ot_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_target_ot_id_fkey"
            columns: ["target_ot_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risks_controls: {
        Row: {
          assessment_id: string
          construction_phase_risks: string | null
          control_measure: string | null
          created_at: string | null
          decanting_plan: string | null
          home_fast_item: string | null
          id: string
          infection_control: string | null
          lighting_contrast: string | null
          photo_urls: Json | null
          risk_description: string | null
          risk_type: string
          safer_home_item: string | null
          severity: string | null
          site_security: string | null
          updated_at: string | null
          wehsa_item: string | null
        }
        Insert: {
          assessment_id: string
          construction_phase_risks?: string | null
          control_measure?: string | null
          created_at?: string | null
          decanting_plan?: string | null
          home_fast_item?: string | null
          id?: string
          infection_control?: string | null
          lighting_contrast?: string | null
          photo_urls?: Json | null
          risk_description?: string | null
          risk_type: string
          safer_home_item?: string | null
          severity?: string | null
          site_security?: string | null
          updated_at?: string | null
          wehsa_item?: string | null
        }
        Update: {
          assessment_id?: string
          construction_phase_risks?: string | null
          control_measure?: string | null
          created_at?: string | null
          decanting_plan?: string | null
          home_fast_item?: string | null
          id?: string
          infection_control?: string | null
          lighting_contrast?: string | null
          photo_urls?: Json | null
          risk_description?: string | null
          risk_type?: string
          safer_home_item?: string | null
          severity?: string | null
          site_security?: string | null
          updated_at?: string | null
          wehsa_item?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risks_controls_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      site_survey: {
        Row: {
          asbestos_likelihood: string | null
          asbestos_locations: string | null
          asbestos_testing_required: boolean | null
          assessment_id: string
          bathroom_basin_approach: string | null
          bathroom_falls_to_waste: string | null
          bathroom_hobless_shower_feasible: boolean | null
          bathroom_ip_ratings: string | null
          bathroom_photo_urls: Json | null
          bathroom_screen_type: string | null
          bathroom_slip_resistance: string | null
          bathroom_toilet_height: number | null
          bathroom_toilet_setout: string | null
          bathroom_ventilation: string | null
          bathroom_wall_reinforcement: boolean | null
          bedroom_bed_height: number | null
          bedroom_commode_space: boolean | null
          bedroom_emergency_egress: boolean | null
          bedroom_hoist_space: boolean | null
          bedroom_photo_urls: Json | null
          bedroom_transfer_sides: string | null
          bedroom_wardrobe_reach: string | null
          board_capacity: string | null
          comms_intercom: string | null
          corridors_width: number | null
          created_at: string | null
          doors_compliant: boolean | null
          drainage_adequate: boolean | null
          entrance_door_clear_opening: number | null
          entrance_landing_area: string | null
          entrance_threshold_height: number | null
          gate_clear_opening: number | null
          heating_cooling_controls: string | null
          hot_water_temp_compliant: boolean | null
          id: string
          kerb_driveway_gradients: string | null
          kitchen_aisle_widths: number | null
          kitchen_bench_heights: number | null
          kitchen_hob_access: string | null
          kitchen_knee_clearances: number | null
          kitchen_oven_access: string | null
          kitchen_photo_urls: Json | null
          kitchen_scald_risk: string | null
          kitchen_sink_access: string | null
          kitchen_storage_access: string | null
          kitchen_task_lighting: string | null
          laundry_circulation: string | null
          laundry_drainage: string | null
          laundry_machine_access: string | null
          laundry_photo_urls: Json | null
          lead_paint_risk: string | null
          living_control_reaches: string | null
          living_furniture_layout: string | null
          living_photo_urls: Json | null
          living_seating_heights: string | null
          living_trip_risks: string | null
          outdoor_bin_access: string | null
          outdoor_clothesline_access: string | null
          outdoor_hardstand: boolean | null
          outdoor_patio_levels: string | null
          outdoor_photo_urls: Json | null
          outdoor_thresholds: string | null
          outdoor_weather_drainage: string | null
          parking_bay_dimensions: string | null
          path_crossfall: string | null
          path_gradient: string | null
          path_width: number | null
          rcds_present: boolean | null
          set_down_area: boolean | null
          site_lighting: string | null
          smoke_alarms_compliant: boolean | null
          smoke_alarms_interconnected: boolean | null
          stairs_handrail_config: string | null
          stairs_headroom: number | null
          stairs_landings: string | null
          stairs_lighting: string | null
          stairs_nosings: string | null
          stairs_photo_urls: Json | null
          stairs_treads_risers: string | null
          step_ramp_feasible: boolean | null
          stormwater_impacts: string | null
          switches_gpos_heights: string | null
          tmv_present: boolean | null
          turning_spaces_adequate: boolean | null
          updated_at: string | null
          ventilation_wet_areas: string | null
          weather_protection: boolean | null
        }
        Insert: {
          asbestos_likelihood?: string | null
          asbestos_locations?: string | null
          asbestos_testing_required?: boolean | null
          assessment_id: string
          bathroom_basin_approach?: string | null
          bathroom_falls_to_waste?: string | null
          bathroom_hobless_shower_feasible?: boolean | null
          bathroom_ip_ratings?: string | null
          bathroom_photo_urls?: Json | null
          bathroom_screen_type?: string | null
          bathroom_slip_resistance?: string | null
          bathroom_toilet_height?: number | null
          bathroom_toilet_setout?: string | null
          bathroom_ventilation?: string | null
          bathroom_wall_reinforcement?: boolean | null
          bedroom_bed_height?: number | null
          bedroom_commode_space?: boolean | null
          bedroom_emergency_egress?: boolean | null
          bedroom_hoist_space?: boolean | null
          bedroom_photo_urls?: Json | null
          bedroom_transfer_sides?: string | null
          bedroom_wardrobe_reach?: string | null
          board_capacity?: string | null
          comms_intercom?: string | null
          corridors_width?: number | null
          created_at?: string | null
          doors_compliant?: boolean | null
          drainage_adequate?: boolean | null
          entrance_door_clear_opening?: number | null
          entrance_landing_area?: string | null
          entrance_threshold_height?: number | null
          gate_clear_opening?: number | null
          heating_cooling_controls?: string | null
          hot_water_temp_compliant?: boolean | null
          id?: string
          kerb_driveway_gradients?: string | null
          kitchen_aisle_widths?: number | null
          kitchen_bench_heights?: number | null
          kitchen_hob_access?: string | null
          kitchen_knee_clearances?: number | null
          kitchen_oven_access?: string | null
          kitchen_photo_urls?: Json | null
          kitchen_scald_risk?: string | null
          kitchen_sink_access?: string | null
          kitchen_storage_access?: string | null
          kitchen_task_lighting?: string | null
          laundry_circulation?: string | null
          laundry_drainage?: string | null
          laundry_machine_access?: string | null
          laundry_photo_urls?: Json | null
          lead_paint_risk?: string | null
          living_control_reaches?: string | null
          living_furniture_layout?: string | null
          living_photo_urls?: Json | null
          living_seating_heights?: string | null
          living_trip_risks?: string | null
          outdoor_bin_access?: string | null
          outdoor_clothesline_access?: string | null
          outdoor_hardstand?: boolean | null
          outdoor_patio_levels?: string | null
          outdoor_photo_urls?: Json | null
          outdoor_thresholds?: string | null
          outdoor_weather_drainage?: string | null
          parking_bay_dimensions?: string | null
          path_crossfall?: string | null
          path_gradient?: string | null
          path_width?: number | null
          rcds_present?: boolean | null
          set_down_area?: boolean | null
          site_lighting?: string | null
          smoke_alarms_compliant?: boolean | null
          smoke_alarms_interconnected?: boolean | null
          stairs_handrail_config?: string | null
          stairs_headroom?: number | null
          stairs_landings?: string | null
          stairs_lighting?: string | null
          stairs_nosings?: string | null
          stairs_photo_urls?: Json | null
          stairs_treads_risers?: string | null
          step_ramp_feasible?: boolean | null
          stormwater_impacts?: string | null
          switches_gpos_heights?: string | null
          tmv_present?: boolean | null
          turning_spaces_adequate?: boolean | null
          updated_at?: string | null
          ventilation_wet_areas?: string | null
          weather_protection?: boolean | null
        }
        Update: {
          asbestos_likelihood?: string | null
          asbestos_locations?: string | null
          asbestos_testing_required?: boolean | null
          assessment_id?: string
          bathroom_basin_approach?: string | null
          bathroom_falls_to_waste?: string | null
          bathroom_hobless_shower_feasible?: boolean | null
          bathroom_ip_ratings?: string | null
          bathroom_photo_urls?: Json | null
          bathroom_screen_type?: string | null
          bathroom_slip_resistance?: string | null
          bathroom_toilet_height?: number | null
          bathroom_toilet_setout?: string | null
          bathroom_ventilation?: string | null
          bathroom_wall_reinforcement?: boolean | null
          bedroom_bed_height?: number | null
          bedroom_commode_space?: boolean | null
          bedroom_emergency_egress?: boolean | null
          bedroom_hoist_space?: boolean | null
          bedroom_photo_urls?: Json | null
          bedroom_transfer_sides?: string | null
          bedroom_wardrobe_reach?: string | null
          board_capacity?: string | null
          comms_intercom?: string | null
          corridors_width?: number | null
          created_at?: string | null
          doors_compliant?: boolean | null
          drainage_adequate?: boolean | null
          entrance_door_clear_opening?: number | null
          entrance_landing_area?: string | null
          entrance_threshold_height?: number | null
          gate_clear_opening?: number | null
          heating_cooling_controls?: string | null
          hot_water_temp_compliant?: boolean | null
          id?: string
          kerb_driveway_gradients?: string | null
          kitchen_aisle_widths?: number | null
          kitchen_bench_heights?: number | null
          kitchen_hob_access?: string | null
          kitchen_knee_clearances?: number | null
          kitchen_oven_access?: string | null
          kitchen_photo_urls?: Json | null
          kitchen_scald_risk?: string | null
          kitchen_sink_access?: string | null
          kitchen_storage_access?: string | null
          kitchen_task_lighting?: string | null
          laundry_circulation?: string | null
          laundry_drainage?: string | null
          laundry_machine_access?: string | null
          laundry_photo_urls?: Json | null
          lead_paint_risk?: string | null
          living_control_reaches?: string | null
          living_furniture_layout?: string | null
          living_photo_urls?: Json | null
          living_seating_heights?: string | null
          living_trip_risks?: string | null
          outdoor_bin_access?: string | null
          outdoor_clothesline_access?: string | null
          outdoor_hardstand?: boolean | null
          outdoor_patio_levels?: string | null
          outdoor_photo_urls?: Json | null
          outdoor_thresholds?: string | null
          outdoor_weather_drainage?: string | null
          parking_bay_dimensions?: string | null
          path_crossfall?: string | null
          path_gradient?: string | null
          path_width?: number | null
          rcds_present?: boolean | null
          set_down_area?: boolean | null
          site_lighting?: string | null
          smoke_alarms_compliant?: boolean | null
          smoke_alarms_interconnected?: boolean | null
          stairs_handrail_config?: string | null
          stairs_headroom?: number | null
          stairs_landings?: string | null
          stairs_lighting?: string | null
          stairs_nosings?: string | null
          stairs_photo_urls?: Json | null
          stairs_treads_risers?: string | null
          step_ramp_feasible?: boolean | null
          stormwater_impacts?: string | null
          switches_gpos_heights?: string | null
          tmv_present?: boolean | null
          turning_spaces_adequate?: boolean | null
          updated_at?: string | null
          ventilation_wet_areas?: string | null
          weather_protection?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "site_survey_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholders: {
        Row: {
          assessment_id: string
          builder_bcp: string | null
          created_at: string | null
          decision_makers: string | null
          id: string
          informal_carers: string | null
          ot_assessor: string | null
          participant_name: string | null
          plan_manager: string | null
          project_manager: string | null
          support_coordinator: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          builder_bcp?: string | null
          created_at?: string | null
          decision_makers?: string | null
          id?: string
          informal_carers?: string | null
          ot_assessor?: string | null
          participant_name?: string | null
          plan_manager?: string | null
          project_manager?: string | null
          support_coordinator?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          builder_bcp?: string | null
          created_at?: string | null
          decision_makers?: string | null
          id?: string
          informal_carers?: string | null
          ot_assessor?: string | null
          participant_name?: string | null
          plan_manager?: string | null
          project_manager?: string | null
          support_coordinator?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      structural_reconnaissance: {
        Row: {
          assessment_id: string
          ceiling_roof_framing: string | null
          created_at: string | null
          deflection_tolerances: string | null
          engineer_notes: string | null
          engineer_required: boolean | null
          hoist_load_paths: string | null
          id: string
          photo_urls: Json | null
          slab_joist_details: string | null
          stud_layout: string | null
          updated_at: string | null
          wall_construction: string | null
        }
        Insert: {
          assessment_id: string
          ceiling_roof_framing?: string | null
          created_at?: string | null
          deflection_tolerances?: string | null
          engineer_notes?: string | null
          engineer_required?: boolean | null
          hoist_load_paths?: string | null
          id?: string
          photo_urls?: Json | null
          slab_joist_details?: string | null
          stud_layout?: string | null
          updated_at?: string | null
          wall_construction?: string | null
        }
        Update: {
          assessment_id?: string
          ceiling_roof_framing?: string | null
          created_at?: string | null
          deflection_tolerances?: string | null
          engineer_notes?: string | null
          engineer_required?: boolean | null
          hoist_load_paths?: string | null
          id?: string
          photo_urls?: Json | null
          slab_joist_details?: string | null
          stud_layout?: string | null
          updated_at?: string | null
          wall_construction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structural_reconnaissance_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      technical_drawings: {
        Row: {
          ai_generated: boolean | null
          annotations: Json | null
          assessment_id: string
          created_at: string
          description: string | null
          drawing_type: string
          id: string
          measurements_used: Json | null
          photo_references: Json | null
          room_area: string | null
          svg_content: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          annotations?: Json | null
          assessment_id: string
          created_at?: string
          description?: string | null
          drawing_type: string
          id?: string
          measurements_used?: Json | null
          photo_references?: Json | null
          room_area?: string | null
          svg_content?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          annotations?: Json | null
          assessment_id?: string
          created_at?: string
          description?: string | null
          drawing_type?: string
          id?: string
          measurements_used?: Json | null
          photo_references?: Json | null
          room_area?: string | null
          svg_content?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_drawings_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_ot_signup: { Args: { request_id: string }; Returns: undefined }
      create_admin_user: {
        Args: {
          admin_email: string
          admin_first_name?: string
          admin_last_name?: string
          admin_password: string
        }
        Returns: Json
      }
      generate_system_id: { Args: { prefix: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_ot_by_system_id: { Args: { p_system_id: string }; Returns: string }
      reject_ot_signup: {
        Args: { reason: string; request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "ot_admin" | "client_carer" | "system_admin" | "pending_ot"
      area_location:
        | "bathroom_toilet"
        | "bathroom_shower"
        | "bedroom"
        | "kitchen"
        | "front_entry"
        | "rear_entry"
        | "stairs_internal"
        | "stairs_external"
        | "living_room"
        | "hallway"
        | "ramp"
        | "other"
      funding_body: "ndis" | "my_aged_care" | "private" | "other"
      mobility_aid: "wheelchair" | "walker" | "cane" | "none" | "other"
      wall_construction:
        | "plaster"
        | "brick"
        | "tile_over_plaster"
        | "concrete"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ot_admin", "client_carer", "system_admin", "pending_ot"],
      area_location: [
        "bathroom_toilet",
        "bathroom_shower",
        "bedroom",
        "kitchen",
        "front_entry",
        "rear_entry",
        "stairs_internal",
        "stairs_external",
        "living_room",
        "hallway",
        "ramp",
        "other",
      ],
      funding_body: ["ndis", "my_aged_care", "private", "other"],
      mobility_aid: ["wheelchair", "walker", "cane", "none", "other"],
      wall_construction: [
        "plaster",
        "brick",
        "tile_over_plaster",
        "concrete",
        "other",
      ],
    },
  },
} as const
