-- ============================================================
-- OT & Physio Assessment Portal - Complete MySQL Schema
-- Version: 1.0.0
-- Generated: 2024
-- ============================================================

-- Create database (run this separately if needed)
-- CREATE DATABASE IF NOT EXISTS ot_assessment_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE ot_assessment_portal;

-- ============================================================
-- ENUM TYPES (MySQL uses ENUM inline)
-- ============================================================

-- app_role: 'system_admin', 'ot_admin', 'pending_ot'
-- funding_body: 'ndis', 'my_aged_care', 'private', 'other'
-- mobility_aid: 'wheelchair', 'walker', 'cane', 'none', 'other'
-- area_location: 'bathroom', 'bedroom', 'kitchen', 'living', 'entry', 'laundry', 'outdoor', 'stairs', 'hallway', 'other'
-- wall_construction: 'brick', 'timber_frame', 'steel_frame', 'concrete', 'other'

-- ============================================================
-- TABLE: users (Authentication - replaces Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    remember_token VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: user_roles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    role ENUM('system_admin', 'ot_admin', 'pending_ot') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_role (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_roles_user (user_id),
    INDEX idx_user_roles_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(255) DEFAULT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    mobile_number VARCHAR(50) DEFAULT NULL,
    system_id VARCHAR(20) DEFAULT NULL UNIQUE,
    aphra_registration_number VARCHAR(50) DEFAULT NULL,
    postal_code VARCHAR(20) DEFAULT NULL,
    suburb VARCHAR(100) DEFAULT NULL,
    state VARCHAR(50) DEFAULT NULL,
    country VARCHAR(100) DEFAULT 'Australia',
    service_area_type ENUM('postal_code', 'suburb', 'state', 'country') DEFAULT 'postal_code',
    service_area_value VARCHAR(255) DEFAULT NULL,
    service_radius_km INT DEFAULT 50,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_profiles_system_id (system_id),
    INDEX idx_profiles_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: ot_signup_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_signup_requests (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    rejection_reason TEXT DEFAULT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    reviewed_by CHAR(36) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_signup_requests_status (status),
    INDEX idx_signup_requests_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: system_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value JSON DEFAULT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: clients
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    created_by CHAR(36) DEFAULT NULL,
    assigned_ot_id CHAR(36) DEFAULT NULL,
    system_id VARCHAR(20) DEFAULT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE DEFAULT NULL,
    mobile_number VARCHAR(50) DEFAULT NULL,
    diagnosis TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    funding_body ENUM('ndis', 'my_aged_care', 'private', 'other') DEFAULT NULL,
    primary_mobility_aid ENUM('wheelchair', 'walker', 'cane', 'none', 'other') DEFAULT NULL,
    postal_code VARCHAR(20) DEFAULT NULL,
    suburb VARCHAR(100) DEFAULT NULL,
    state VARCHAR(50) DEFAULT NULL,
    country VARCHAR(100) DEFAULT 'Australia',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_ot_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_clients_system_id (system_id),
    INDEX idx_clients_created_by (created_by),
    INDEX idx_clients_assigned_ot (assigned_ot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: assessments
-- ============================================================
CREATE TABLE IF NOT EXISTS assessments (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    client_id CHAR(36) NOT NULL,
    created_by CHAR(36) DEFAULT NULL,
    assigned_ot_id CHAR(36) DEFAULT NULL,
    assessment_date DATE DEFAULT (CURRENT_DATE),
    status ENUM('draft', 'in_progress', 'completed') DEFAULT 'draft',
    primary_goal TEXT DEFAULT NULL,
    difficulty_toileting INT DEFAULT NULL,
    difficulty_showering INT DEFAULT NULL,
    difficulty_transfers INT DEFAULT NULL,
    difficulty_steps INT DEFAULT NULL,
    fall_history TEXT DEFAULT NULL,
    near_miss_locations TEXT DEFAULT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_ot_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_assessments_client (client_id),
    INDEX idx_assessments_created_by (created_by),
    INDEX idx_assessments_assigned_ot (assigned_ot_id),
    INDEX idx_assessments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: assessment_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_tokens (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    INDEX idx_tokens_assessment (assessment_id),
    INDEX idx_tokens_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: environmental_areas
-- ============================================================
CREATE TABLE IF NOT EXISTS environmental_areas (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL,
    area_location ENUM('bathroom', 'bedroom', 'kitchen', 'living', 'entry', 'laundry', 'outdoor', 'stairs', 'hallway', 'other') NOT NULL,
    area_name VARCHAR(255) DEFAULT NULL,
    door_clear_width DECIMAL(10,2) DEFAULT NULL,
    threshold_height DECIMAL(10,2) DEFAULT NULL,
    toilet_centerline_left DECIMAL(10,2) DEFAULT NULL,
    toilet_centerline_right DECIMAL(10,2) DEFAULT NULL,
    ramp_gradient_riser DECIMAL(10,2) DEFAULT NULL,
    ramp_gradient_going DECIMAL(10,2) DEFAULT NULL,
    wall_construction ENUM('brick', 'timber_frame', 'steel_frame', 'concrete', 'other') DEFAULT NULL,
    barriers TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    photo_urls JSON DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    INDEX idx_env_areas_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: clinical_assessment
-- ============================================================
CREATE TABLE IF NOT EXISTS clinical_assessment (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL UNIQUE,
    mobility_status TEXT DEFAULT NULL,
    wheelchair_type TEXT DEFAULT NULL,
    wheelchair_length DECIMAL(10,2) DEFAULT NULL,
    wheelchair_width DECIMAL(10,2) DEFAULT NULL,
    wheelchair_height DECIMAL(10,2) DEFAULT NULL,
    wheelchair_turning_radius DECIMAL(10,2) DEFAULT NULL,
    gait_endurance TEXT DEFAULT NULL,
    transfer_methods TEXT DEFAULT NULL,
    hoist_needed BOOLEAN DEFAULT FALSE,
    standing_height DECIMAL(10,2) DEFAULT NULL,
    sitting_height DECIMAL(10,2) DEFAULT NULL,
    shoulder_height DECIMAL(10,2) DEFAULT NULL,
    reach_measurement DECIMAL(10,2) DEFAULT NULL,
    knee_clearance DECIMAL(10,2) DEFAULT NULL,
    toe_clearance DECIMAL(10,2) DEFAULT NULL,
    adl_bathing TEXT DEFAULT NULL,
    adl_toileting TEXT DEFAULT NULL,
    adl_dressing TEXT DEFAULT NULL,
    adl_kitchen TEXT DEFAULT NULL,
    adl_laundry TEXT DEFAULT NULL,
    adl_entry_egress TEXT DEFAULT NULL,
    adl_community_access TEXT DEFAULT NULL,
    adl_vehicle_transfers TEXT DEFAULT NULL,
    cognition_status TEXT DEFAULT NULL,
    vision_status TEXT DEFAULT NULL,
    perception_status TEXT DEFAULT NULL,
    communication_needs TEXT DEFAULT NULL,
    sensory_sensitivities TEXT DEFAULT NULL,
    fatigue_pain TEXT DEFAULT NULL,
    thermoregulation TEXT DEFAULT NULL,
    continence TEXT DEFAULT NULL,
    skin_integrity TEXT DEFAULT NULL,
    pressure_care_needed BOOLEAN DEFAULT FALSE,
    single_carer BOOLEAN DEFAULT NULL,
    two_carer_needed BOOLEAN DEFAULT FALSE,
    carer_capacity TEXT DEFAULT NULL,
    manual_handling_risk TEXT DEFAULT NULL,
    copm_score TEXT DEFAULT NULL,
    home_fast_score TEXT DEFAULT NULL,
    safer_home_score TEXT DEFAULT NULL,
    westmead_score TEXT DEFAULT NULL,
    special_population TEXT DEFAULT NULL,
    special_considerations TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: pre_visit_details
-- ============================================================
CREATE TABLE IF NOT EXISTS pre_visit_details (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL UNIQUE,
    referral_reason TEXT DEFAULT NULL,
    approval_pathway TEXT DEFAULT NULL,
    ndia_template_used TEXT DEFAULT NULL,
    diagnoses_prognosis TEXT DEFAULT NULL,
    participant_goals TEXT DEFAULT NULL,
    prior_falls_incidents TEXT DEFAULT NULL,
    current_at_list TEXT DEFAULT NULL,
    tenancy_ownership_details TEXT DEFAULT NULL,
    landlord_strata_contacts TEXT DEFAULT NULL,
    previous_modifications TEXT DEFAULT NULL,
    floor_plans_available BOOLEAN DEFAULT FALSE,
    consent_obtained BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: funding_pathway
-- ============================================================
CREATE TABLE IF NOT EXISTS funding_pathway (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL UNIQUE,
    classification TEXT DEFAULT NULL,
    category TEXT DEFAULT NULL,
    estimated_cost DECIMAL(12,2) DEFAULT NULL,
    quotes_required INT DEFAULT NULL,
    structural_works BOOLEAN DEFAULT FALSE,
    multi_area_works BOOLEAN DEFAULT FALSE,
    permits_required BOOLEAN DEFAULT FALSE,
    ndia_criteria_effectiveness TEXT DEFAULT NULL,
    ndia_criteria_safety TEXT DEFAULT NULL,
    ndia_criteria_goals TEXT DEFAULT NULL,
    ndia_criteria_alternatives TEXT DEFAULT NULL,
    ndia_criteria_value TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: at_audit (Assistive Technology Audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS at_audit (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL UNIQUE,
    current_at_type TEXT DEFAULT NULL,
    at_condition TEXT DEFAULT NULL,
    at_compliance BOOLEAN DEFAULT NULL,
    at_maintenance TEXT DEFAULT NULL,
    trials_conducted TEXT DEFAULT NULL,
    trial_outcomes TEXT DEFAULT NULL,
    structural_works_still_required BOOLEAN DEFAULT NULL,
    structural_works_justification TEXT DEFAULT NULL,
    charging_requirements TEXT DEFAULT NULL,
    storage_requirements TEXT DEFAULT NULL,
    power_requirements TEXT DEFAULT NULL,
    maneuvering_envelopes TEXT DEFAULT NULL,
    photo_urls JSON DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: site_survey
-- ============================================================
CREATE TABLE IF NOT EXISTS site_survey (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL UNIQUE,
    -- External/Entry
    set_down_area BOOLEAN DEFAULT NULL,
    weather_protection BOOLEAN DEFAULT NULL,
    path_width DECIMAL(10,2) DEFAULT NULL,
    path_gradient TEXT DEFAULT NULL,
    path_crossfall TEXT DEFAULT NULL,
    step_ramp_feasible BOOLEAN DEFAULT NULL,
    gate_clear_opening DECIMAL(10,2) DEFAULT NULL,
    drainage_adequate BOOLEAN DEFAULT NULL,
    stormwater_impacts TEXT DEFAULT NULL,
    entrance_door_clear_opening DECIMAL(10,2) DEFAULT NULL,
    entrance_threshold_height DECIMAL(10,2) DEFAULT NULL,
    entrance_landing_area TEXT DEFAULT NULL,
    -- Internal Circulation
    doors_compliant BOOLEAN DEFAULT NULL,
    corridors_width DECIMAL(10,2) DEFAULT NULL,
    turning_spaces_adequate BOOLEAN DEFAULT NULL,
    -- Living Areas
    living_furniture_layout TEXT DEFAULT NULL,
    living_control_reaches TEXT DEFAULT NULL,
    living_trip_risks TEXT DEFAULT NULL,
    living_seating_heights TEXT DEFAULT NULL,
    living_photo_urls JSON DEFAULT '[]',
    -- Kitchen
    kitchen_bench_heights DECIMAL(10,2) DEFAULT NULL,
    kitchen_aisle_widths DECIMAL(10,2) DEFAULT NULL,
    kitchen_knee_clearances DECIMAL(10,2) DEFAULT NULL,
    kitchen_hob_access TEXT DEFAULT NULL,
    kitchen_sink_access TEXT DEFAULT NULL,
    kitchen_oven_access TEXT DEFAULT NULL,
    kitchen_storage_access TEXT DEFAULT NULL,
    kitchen_task_lighting TEXT DEFAULT NULL,
    kitchen_scald_risk TEXT DEFAULT NULL,
    kitchen_photo_urls JSON DEFAULT '[]',
    -- Bedroom
    bedroom_bed_height DECIMAL(10,2) DEFAULT NULL,
    bedroom_commode_space BOOLEAN DEFAULT NULL,
    bedroom_hoist_space BOOLEAN DEFAULT NULL,
    bedroom_emergency_egress BOOLEAN DEFAULT NULL,
    bedroom_transfer_sides TEXT DEFAULT NULL,
    bedroom_wardrobe_reach TEXT DEFAULT NULL,
    bedroom_photo_urls JSON DEFAULT '[]',
    -- Bathroom
    bathroom_hobless_shower_feasible BOOLEAN DEFAULT NULL,
    bathroom_wall_reinforcement BOOLEAN DEFAULT NULL,
    bathroom_toilet_height DECIMAL(10,2) DEFAULT NULL,
    bathroom_screen_type TEXT DEFAULT NULL,
    bathroom_falls_to_waste TEXT DEFAULT NULL,
    bathroom_slip_resistance TEXT DEFAULT NULL,
    bathroom_toilet_setout TEXT DEFAULT NULL,
    bathroom_basin_approach TEXT DEFAULT NULL,
    bathroom_ventilation TEXT DEFAULT NULL,
    bathroom_ip_ratings TEXT DEFAULT NULL,
    bathroom_photo_urls JSON DEFAULT '[]',
    -- Laundry
    laundry_machine_access TEXT DEFAULT NULL,
    laundry_circulation TEXT DEFAULT NULL,
    laundry_drainage TEXT DEFAULT NULL,
    laundry_photo_urls JSON DEFAULT '[]',
    -- Stairs
    stairs_headroom DECIMAL(10,2) DEFAULT NULL,
    stairs_treads_risers TEXT DEFAULT NULL,
    stairs_nosings TEXT DEFAULT NULL,
    stairs_handrail_config TEXT DEFAULT NULL,
    stairs_landings TEXT DEFAULT NULL,
    stairs_lighting TEXT DEFAULT NULL,
    stairs_photo_urls JSON DEFAULT '[]',
    -- Outdoor
    outdoor_hardstand BOOLEAN DEFAULT NULL,
    outdoor_thresholds TEXT DEFAULT NULL,
    outdoor_patio_levels TEXT DEFAULT NULL,
    outdoor_bin_access TEXT DEFAULT NULL,
    outdoor_clothesline_access TEXT DEFAULT NULL,
    outdoor_weather_drainage TEXT DEFAULT NULL,
    outdoor_photo_urls JSON DEFAULT '[]',
    -- Electrical & Safety
    rcds_present BOOLEAN DEFAULT NULL,
    smoke_alarms_compliant BOOLEAN DEFAULT NULL,
    smoke_alarms_interconnected BOOLEAN DEFAULT NULL,
    hot_water_temp_compliant BOOLEAN DEFAULT NULL,
    tmv_present BOOLEAN DEFAULT NULL,
    switches_gpos_heights TEXT DEFAULT NULL,
    board_capacity TEXT DEFAULT NULL,
    heating_cooling_controls TEXT DEFAULT NULL,
    comms_intercom TEXT DEFAULT NULL,
    ventilation_wet_areas TEXT DEFAULT NULL,
    -- Hazmat
    asbestos_testing_required BOOLEAN DEFAULT NULL,
    asbestos_likelihood TEXT DEFAULT NULL,
    asbestos_locations TEXT DEFAULT NULL,
    lead_paint_risk TEXT DEFAULT NULL,
    -- Parking
    parking_bay_dimensions TEXT DEFAULT NULL,
    kerb_driveway_gradients TEXT DEFAULT NULL,
    site_lighting TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: structural_reconnaissance
-- ============================================================
CREATE TABLE IF NOT EXISTS structural_reconnaissance (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL UNIQUE,
    wall_construction TEXT DEFAULT NULL,
    stud_layout TEXT DEFAULT NULL,
    ceiling_roof_framing TEXT DEFAULT NULL,
    slab_joist_details TEXT DEFAULT NULL,
    hoist_load_paths TEXT DEFAULT NULL,
    engineer_required BOOLEAN DEFAULT FALSE,
    photo_urls JSON DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: measurements
-- ============================================================
CREATE TABLE IF NOT EXISTS measurements (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL,
    location VARCHAR(255) NOT NULL,
    measurement_type VARCHAR(255) NOT NULL,
    value_mm DECIMAL(10,2) DEFAULT NULL,
    required_value_mm DECIMAL(10,2) DEFAULT NULL,
    compliant BOOLEAN DEFAULT NULL,
    standard_reference TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    photo_urls JSON DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    INDEX idx_measurements_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: risks_controls
-- ============================================================
CREATE TABLE IF NOT EXISTS risks_controls (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL,
    risk_type VARCHAR(255) NOT NULL,
    risk_description TEXT DEFAULT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT NULL,
    control_measure TEXT DEFAULT NULL,
    home_fast_item TEXT DEFAULT NULL,
    safer_home_item TEXT DEFAULT NULL,
    wehsa_item TEXT DEFAULT NULL,
    lighting_contrast TEXT DEFAULT NULL,
    construction_phase_risks TEXT DEFAULT NULL,
    decanting_plan TEXT DEFAULT NULL,
    site_security TEXT DEFAULT NULL,
    infection_control TEXT DEFAULT NULL,
    photo_urls JSON DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    INDEX idx_risks_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: options_analysis
-- ============================================================
CREATE TABLE IF NOT EXISTS options_analysis (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL,
    goal_area VARCHAR(255) NOT NULL,
    option_type VARCHAR(255) NOT NULL,
    option_description TEXT DEFAULT NULL,
    clinical_impact TEXT DEFAULT NULL,
    compliance_notes TEXT DEFAULT NULL,
    risks TEXT DEFAULT NULL,
    buildability TEXT DEFAULT NULL,
    program_estimate TEXT DEFAULT NULL,
    estimated_cost DECIMAL(12,2) DEFAULT NULL,
    value_for_money_justification TEXT DEFAULT NULL,
    ndia_alignment TEXT DEFAULT NULL,
    recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    INDEX idx_options_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: compliance_checklist
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_checklist (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL,
    standard_reference VARCHAR(255) NOT NULL,
    provision_number TEXT DEFAULT NULL,
    requirement_description TEXT DEFAULT NULL,
    compliant BOOLEAN DEFAULT NULL,
    non_compliance_notes TEXT DEFAULT NULL,
    remediation_required TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    INDEX idx_compliance_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: builder_collaboration
-- ============================================================
CREATE TABLE IF NOT EXISTS builder_collaboration (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL UNIQUE,
    bcp_name VARCHAR(255) DEFAULT NULL,
    bcp_license_number VARCHAR(100) DEFAULT NULL,
    bcp_engaged_early BOOLEAN DEFAULT FALSE,
    -- Quote 1
    quote_1_provider VARCHAR(255) DEFAULT NULL,
    quote_1_amount DECIMAL(12,2) DEFAULT NULL,
    quote_1_breakdown TEXT DEFAULT NULL,
    quote_1_fixtures TEXT DEFAULT NULL,
    quote_1_gst_inclusive BOOLEAN DEFAULT TRUE,
    quote_1_document_url TEXT DEFAULT NULL,
    -- Quote 2
    quote_2_provider VARCHAR(255) DEFAULT NULL,
    quote_2_amount DECIMAL(12,2) DEFAULT NULL,
    quote_2_breakdown TEXT DEFAULT NULL,
    quote_2_fixtures TEXT DEFAULT NULL,
    quote_2_gst_inclusive BOOLEAN DEFAULT TRUE,
    quote_2_document_url TEXT DEFAULT NULL,
    -- Scope
    scope_of_works TEXT DEFAULT NULL,
    disability_specific_scope TEXT DEFAULT NULL,
    general_finishes_scope TEXT DEFAULT NULL,
    construction_sequence TEXT DEFAULT NULL,
    decant_plan TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: deliverables
-- ============================================================
CREATE TABLE IF NOT EXISTS deliverables (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL UNIQUE,
    -- NDIA Package
    executive_summary TEXT DEFAULT NULL,
    clinical_findings TEXT DEFAULT NULL,
    outcome_measures_results TEXT DEFAULT NULL,
    ndia_template_completed BOOLEAN DEFAULT FALSE,
    -- Evidence Pack
    consent_signed BOOLEAN DEFAULT FALSE,
    photos_annotated BOOLEAN DEFAULT FALSE,
    measured_drawings_completed BOOLEAN DEFAULT FALSE,
    risk_register_completed BOOLEAN DEFAULT FALSE,
    scope_of_works_completed BOOLEAN DEFAULT FALSE,
    -- Compliance & Value
    compliance_statement TEXT DEFAULT NULL,
    quotes_analysis TEXT DEFAULT NULL,
    vfm_justification TEXT DEFAULT NULL,
    -- Handover
    construction_sequencing TEXT DEFAULT NULL,
    handover_plan TEXT DEFAULT NULL,
    post_build_fit_check TEXT DEFAULT NULL,
    at_refit_plan TEXT DEFAULT NULL,
    client_carer_training_plan TEXT DEFAULT NULL,
    maintenance_notes TEXT DEFAULT NULL,
    post_occupancy_measurement_plan TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: technical_drawings
-- ============================================================
CREATE TABLE IF NOT EXISTS technical_drawings (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    drawing_type VARCHAR(100) NOT NULL,
    room_area VARCHAR(100) DEFAULT NULL,
    svg_content LONGTEXT DEFAULT NULL,
    ai_generated BOOLEAN DEFAULT FALSE,
    photo_references JSON DEFAULT '[]',
    measurements_used JSON DEFAULT '[]',
    annotations JSON DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    INDEX idx_drawings_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: referrals
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    client_id CHAR(36) NOT NULL,
    requesting_ot_id CHAR(36) DEFAULT NULL,
    target_ot_id CHAR(36) NOT NULL,
    referred_to_ot_id CHAR(36) DEFAULT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'referred') NOT NULL DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (requesting_ot_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (target_ot_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_to_ot_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_referrals_client (client_id),
    INDEX idx_referrals_target (target_ot_id),
    INDEX idx_referrals_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: uploaded_files (for file storage tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS uploaded_files (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    user_id CHAR(36) DEFAULT NULL,
    assessment_id CHAR(36) DEFAULT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) DEFAULT NULL,
    file_size INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    INDEX idx_files_assessment (assessment_id),
    INDEX idx_files_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: sessions (for JWT token management)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_token (token_hash),
    INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TRIGGERS: Auto-generate system IDs
-- ============================================================

DELIMITER //

-- Generate system ID for profiles
CREATE TRIGGER IF NOT EXISTS before_insert_profile
BEFORE INSERT ON profiles
FOR EACH ROW
BEGIN
    IF NEW.system_id IS NULL THEN
        SET NEW.system_id = CONCAT('OT-', LPAD(FLOOR(RAND() * 1000000), 6, '0'));
        -- Ensure uniqueness (simple approach - in production use a function)
        WHILE EXISTS (SELECT 1 FROM profiles WHERE system_id = NEW.system_id) DO
            SET NEW.system_id = CONCAT('OT-', LPAD(FLOOR(RAND() * 1000000), 6, '0'));
        END WHILE;
    END IF;
END//

-- Generate system ID for clients
CREATE TRIGGER IF NOT EXISTS before_insert_client
BEFORE INSERT ON clients
FOR EACH ROW
BEGIN
    IF NEW.system_id IS NULL THEN
        SET NEW.system_id = CONCAT('PT-', LPAD(FLOOR(RAND() * 1000000), 6, '0'));
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM clients WHERE system_id = NEW.system_id) DO
            SET NEW.system_id = CONCAT('PT-', LPAD(FLOOR(RAND() * 1000000), 6, '0'));
        END WHILE;
    END IF;
END//

DELIMITER ;

-- ============================================================
-- INITIAL DATA: First admin user setup instruction
-- ============================================================
-- To create the first admin user, run:
-- 1. INSERT INTO users (id, email, password_hash, first_name, last_name) 
--    VALUES (UUID(), 'admin@example.com', '$2y$10$...', 'Admin', 'User');
-- 2. INSERT INTO user_roles (user_id, role) 
--    VALUES ((SELECT id FROM users WHERE email = 'admin@example.com'), 'system_admin');
-- 3. INSERT INTO profiles (id, email, first_name, last_name) 
--    VALUES ((SELECT id FROM users WHERE email = 'admin@example.com'), 'admin@example.com', 'Admin', 'User');

-- ============================================================
-- END OF SCHEMA
-- ============================================================
