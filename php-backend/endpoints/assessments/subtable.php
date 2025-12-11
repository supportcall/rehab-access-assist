<?php
/**
 * Generic Assessment Sub-Table Handler
 * Handles: pre_visit_details, stakeholders, funding_pathway, clinical_assessment,
 *          at_audit, site_survey, structural_reconnaissance, builder_collaboration, deliverables
 * 
 * GET /api/v1/assessments/{assessment_id}/{table}
 * POST /api/v1/assessments/{assessment_id}/{table}
 * PUT /api/v1/assessments/{assessment_id}/{table}
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

$assessmentId = $routeParams['assessment_id'] ?? null;
$tableName = $routeParams['table'] ?? null;

// Whitelist of allowed tables
$allowedTables = [
    'pre_visit_details', 'stakeholders', 'funding_pathway', 'clinical_assessment',
    'at_audit', 'site_survey', 'structural_reconnaissance', 'builder_collaboration', 'deliverables'
];

if (!in_array($tableName, $allowedTables)) {
    Response::notFound('Invalid resource');
}

if (!$assessmentId || !Validator::isUUID($assessmentId)) {
    Response::badRequest('Invalid assessment ID');
}

// Verify assessment access
$assessment = Database::queryOne(
    "SELECT * FROM assessments WHERE id = ?",
    [$assessmentId]
);

if (!$assessment) {
    Response::notFound('Assessment not found');
}

if (!in_array('system_admin', $roles)) {
    if ($assessment['assigned_ot_id'] !== $userId && $assessment['created_by'] !== $userId) {
        Response::forbidden('Access denied');
    }
}

// Define allowed fields per table
$tableFields = [
    'pre_visit_details' => [
        'referral_reason', 'approval_pathway', 'ndia_template_used', 'diagnoses_prognosis',
        'participant_goals', 'prior_falls_incidents', 'current_at_list', 'tenancy_ownership_details',
        'landlord_strata_contacts', 'previous_modifications', 'floor_plans_available', 'consent_obtained'
    ],
    'stakeholders' => [
        'participant_name', 'ot_assessor', 'support_coordinator', 'plan_manager',
        'builder_bcp', 'project_manager', 'informal_carers', 'decision_makers'
    ],
    'funding_pathway' => [
        'classification', 'category', 'estimated_cost', 'quotes_required', 'structural_works',
        'multi_area_works', 'permits_required', 'ndia_criteria_effectiveness', 'ndia_criteria_safety',
        'ndia_criteria_goals', 'ndia_criteria_alternatives', 'ndia_criteria_value'
    ],
    'clinical_assessment' => [
        'mobility_status', 'wheelchair_type', 'gait_endurance', 'transfer_methods', 'hoist_needed',
        'standing_height', 'sitting_height', 'shoulder_height', 'reach_measurement', 'knee_clearance',
        'toe_clearance', 'wheelchair_length', 'wheelchair_width', 'wheelchair_height', 'wheelchair_turning_radius',
        'adl_bathing', 'adl_toileting', 'adl_dressing', 'adl_kitchen', 'adl_laundry', 'adl_entry_egress',
        'adl_community_access', 'adl_vehicle_transfers', 'cognition_status', 'vision_status', 'perception_status',
        'communication_needs', 'sensory_sensitivities', 'fatigue_pain', 'thermoregulation', 'continence',
        'skin_integrity', 'pressure_care_needed', 'carer_capacity', 'manual_handling_risk', 'single_carer',
        'two_carer_needed', 'copm_score', 'home_fast_score', 'safer_home_score', 'westmead_score',
        'special_population', 'special_considerations'
    ],
    'at_audit' => [
        'current_at_type', 'at_condition', 'at_maintenance', 'at_compliance', 'trials_conducted',
        'trial_outcomes', 'structural_works_still_required', 'structural_works_justification',
        'charging_requirements', 'storage_requirements', 'power_requirements', 'maneuvering_envelopes', 'photo_urls'
    ],
    'site_survey' => [
        'set_down_area', 'weather_protection', 'path_width', 'path_gradient', 'path_crossfall',
        'step_ramp_feasible', 'gate_clear_opening', 'stormwater_impacts', 'drainage_adequate',
        'entrance_door_clear_opening', 'entrance_threshold_height', 'entrance_landing_area',
        'doors_compliant', 'corridors_width', 'turning_spaces_adequate',
        'living_furniture_layout', 'living_control_reaches', 'living_trip_risks', 'living_seating_heights', 'living_photo_urls',
        'kitchen_bench_heights', 'kitchen_aisle_widths', 'kitchen_knee_clearances', 'kitchen_hob_access',
        'kitchen_sink_access', 'kitchen_oven_access', 'kitchen_storage_access', 'kitchen_task_lighting',
        'kitchen_scald_risk', 'kitchen_photo_urls',
        'bedroom_bed_height', 'bedroom_transfer_sides', 'bedroom_wardrobe_reach', 'bedroom_commode_space',
        'bedroom_hoist_space', 'bedroom_emergency_egress', 'bedroom_photo_urls',
        'bathroom_hobless_shower_feasible', 'bathroom_screen_type', 'bathroom_wall_reinforcement',
        'bathroom_falls_to_waste', 'bathroom_slip_resistance', 'bathroom_toilet_height', 'bathroom_toilet_setout',
        'bathroom_basin_approach', 'bathroom_ventilation', 'bathroom_ip_ratings', 'bathroom_photo_urls',
        'laundry_machine_access', 'laundry_circulation', 'laundry_drainage', 'laundry_photo_urls',
        'stairs_treads_risers', 'stairs_nosings', 'stairs_handrail_config', 'stairs_landings',
        'stairs_lighting', 'stairs_headroom', 'stairs_photo_urls',
        'outdoor_thresholds', 'outdoor_patio_levels', 'outdoor_bin_access', 'outdoor_clothesline_access',
        'outdoor_weather_drainage', 'outdoor_hardstand', 'outdoor_photo_urls',
        'switches_gpos_heights', 'board_capacity', 'rcds_present', 'heating_cooling_controls',
        'comms_intercom', 'smoke_alarms_compliant', 'smoke_alarms_interconnected', 'ventilation_wet_areas',
        'hot_water_temp_compliant', 'tmv_present', 'asbestos_likelihood', 'asbestos_locations',
        'asbestos_testing_required', 'lead_paint_risk', 'parking_bay_dimensions', 'kerb_driveway_gradients', 'site_lighting'
    ],
    'structural_reconnaissance' => [
        'wall_construction', 'stud_layout', 'ceiling_roof_framing', 'slab_joist_details',
        'hoist_load_paths', 'deflection_tolerances', 'engineer_required', 'engineer_notes', 'photo_urls'
    ],
    'builder_collaboration' => [
        'bcp_name', 'bcp_license_number', 'bcp_engaged_early',
        'quote_1_provider', 'quote_1_amount', 'quote_1_gst_inclusive', 'quote_1_breakdown', 'quote_1_fixtures', 'quote_1_document_url',
        'quote_2_provider', 'quote_2_amount', 'quote_2_gst_inclusive', 'quote_2_breakdown', 'quote_2_fixtures', 'quote_2_document_url',
        'scope_of_works', 'disability_specific_scope', 'general_finishes_scope', 'construction_sequence', 'decant_plan'
    ],
    'deliverables' => [
        'executive_summary', 'clinical_findings', 'outcome_measures_results', 'compliance_statement',
        'quotes_analysis', 'vfm_justification', 'construction_sequencing', 'handover_plan',
        'post_build_fit_check', 'at_refit_plan', 'client_carer_training_plan', 'maintenance_notes',
        'post_occupancy_measurement_plan', 'ndia_template_completed', 'consent_signed', 'photos_annotated',
        'measured_drawings_completed', 'risk_register_completed', 'scope_of_works_completed'
    ]
];

if ($method === 'GET') {
    $data = Database::queryOne(
        "SELECT * FROM {$tableName} WHERE assessment_id = ?",
        [$assessmentId]
    );

    Response::success($data);

} elseif ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Check if record exists
    $existing = Database::queryOne(
        "SELECT id FROM {$tableName} WHERE assessment_id = ?",
        [$assessmentId]
    );

    $allowedFields = $tableFields[$tableName];
    $fields = [];
    $values = [];
    $params = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $fields[] = $field;
            $value = $input[$field];
            
            // Handle JSON fields
            if (is_array($value)) {
                $value = json_encode($value);
            }
            
            $values[] = $value;
        }
    }

    if (empty($fields)) {
        Response::badRequest('No valid fields provided');
    }

    try {
        if ($existing) {
            // Update
            $setClause = implode(' = ?, ', $fields) . ' = ?';
            $params = array_merge($values, [$assessmentId]);
            
            Database::execute(
                "UPDATE {$tableName} SET {$setClause}, updated_at = NOW() WHERE assessment_id = ?",
                $params
            );
        } else {
            // Insert
            $fields[] = 'id';
            $values[] = Database::generateUUID();
            $fields[] = 'assessment_id';
            $values[] = $assessmentId;
            
            $placeholders = implode(', ', array_fill(0, count($fields), '?'));
            $fieldList = implode(', ', $fields);
            
            Database::execute(
                "INSERT INTO {$tableName} ({$fieldList}, created_at, updated_at) VALUES ({$placeholders}, NOW(), NOW())",
                $values
            );
        }

        $data = Database::queryOne(
            "SELECT * FROM {$tableName} WHERE assessment_id = ?",
            [$assessmentId]
        );

        Logger::info("{$tableName} saved for assessment: {$assessmentId}");

        Response::success($data, ucfirst(str_replace('_', ' ', $tableName)) . ' saved successfully');

    } catch (Exception $e) {
        Logger::exception($e);
        Response::serverError('Failed to save data');
    }

} else {
    Response::methodNotAllowed('GET, POST, PUT, PATCH');
}
