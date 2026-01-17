<?php

declare(strict_types=1);

namespace RehabSource\Controllers;

use RehabSource\Core\Auth;
use RehabSource\Core\Database;
use RehabSource\Core\Response;

/**
 * Template Controller
 * Manages assessment templates and their sections/questions
 */
class TemplateController
{
    /**
     * List all active templates
     */
    public static function index(): void
    {
        $user = Auth::require();

        $templates = Database::query(
            "SELECT t.*, 
                    (SELECT COUNT(*) FROM assessment_sections WHERE template_id = t.id) as section_count,
                    (SELECT COUNT(*) FROM assessment_questions aq 
                     JOIN assessment_sections asec ON aq.section_id = asec.id 
                     WHERE asec.template_id = t.id) as question_count
             FROM assessment_templates t
             WHERE t.is_active = 1
             ORDER BY t.category, t.name"
        );

        Response::success($templates);
    }

    /**
     * Get template with all sections and questions
     */
    public static function show(array $params): void
    {
        $user = Auth::require();
        $templateId = $params['id'] ?? null;

        $template = Database::queryOne(
            "SELECT * FROM assessment_templates WHERE id = ? AND is_active = 1",
            [$templateId]
        );

        if (!$template) {
            Response::notFound('Template not found');
        }

        // Get sections with questions
        $sections = Database::query(
            "SELECT * FROM assessment_sections WHERE template_id = ? ORDER BY order_index",
            [$templateId]
        );

        foreach ($sections as &$section) {
            $section['questions'] = Database::query(
                "SELECT * FROM assessment_questions WHERE section_id = ? ORDER BY order_index",
                [$section['id']]
            );

            // Parse JSON fields
            foreach ($section['questions'] as &$question) {
                if ($question['options']) {
                    $question['options'] = json_decode($question['options'], true);
                }
                if ($question['validation_rules']) {
                    $question['validation_rules'] = json_decode($question['validation_rules'], true);
                }
                if ($question['conditional_logic']) {
                    $question['conditional_logic'] = json_decode($question['conditional_logic'], true);
                }
            }
        }

        $template['sections'] = $sections;

        Response::success($template);
    }

    /**
     * Seed default templates (admin only)
     */
    public static function seedDefaults(): void
    {
        $user = Auth::requireRole(['system_admin']);

        Database::beginTransaction();

        try {
            // Home Modifications Assessment Template
            $homeModId = self::createTemplate(
                'Home Modifications Assessment',
                'home_modifications',
                'Comprehensive NDIS home modifications assessment for OTs',
                '1.0'
            );

            self::seedHomeModificationsSections($homeModId);

            // Functional Assessment Template
            $functionalId = self::createTemplate(
                'OT Functional Assessment',
                'functional',
                'ADL/IADL functional capacity assessment',
                '1.0'
            );

            self::seedFunctionalAssessmentSections($functionalId);

            // Falls Risk Template
            $fallsId = self::createTemplate(
                'Falls Risk & Home Safety',
                'falls_risk',
                'Falls risk assessment and home safety evaluation',
                '1.0'
            );

            self::seedFallsRiskSections($fallsId);

            // Physio MSK Template
            $mskId = self::createTemplate(
                'Physio MSK Assessment',
                'physio_msk',
                'Musculoskeletal assessment and exercise planning',
                '1.0'
            );

            self::seedPhysioMskSections($mskId);

            Database::commit();

            Response::success(null, 'Default templates seeded successfully');

        } catch (\Exception $e) {
            Database::rollback();
            error_log("Template seeding failed: " . $e->getMessage());
            Response::serverError('Failed to seed templates');
        }
    }

    /**
     * Create a template
     */
    private static function createTemplate(string $name, string $category, string $description, string $version): string
    {
        $id = Database::generateUUID();

        Database::execute(
            "INSERT INTO assessment_templates (id, name, category, description, version, is_active)
             VALUES (?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE description = VALUES(description), version = VALUES(version)",
            [$id, $name, $category, $description, $version]
        );

        return $id;
    }

    /**
     * Seed Home Modifications sections
     */
    private static function seedHomeModificationsSections(string $templateId): void
    {
        $sections = [
            [
                'key' => 'pre_visit',
                'title' => 'Pre-Visit Information',
                'description' => 'Information gathered before the home visit',
                'questions' => [
                    ['key' => 'referral_reason', 'text' => 'Reason for Referral', 'type' => 'textarea', 'required' => true],
                    ['key' => 'diagnoses', 'text' => 'Diagnoses and Prognosis', 'type' => 'textarea', 'required' => true],
                    ['key' => 'current_at', 'text' => 'Current Assistive Technology', 'type' => 'textarea'],
                    ['key' => 'participant_goals', 'text' => 'Participant Goals', 'type' => 'textarea', 'required' => true],
                    ['key' => 'prior_falls', 'text' => 'Prior Falls/Incidents', 'type' => 'textarea'],
                    ['key' => 'consent_obtained', 'text' => 'Consent Obtained', 'type' => 'boolean', 'required' => true],
                    ['key' => 'floor_plans_available', 'text' => 'Floor Plans Available', 'type' => 'boolean'],
                    ['key' => 'tenancy_details', 'text' => 'Tenancy/Ownership Details', 'type' => 'textarea'],
                    ['key' => 'landlord_contacts', 'text' => 'Landlord/Strata Contacts', 'type' => 'textarea']
                ]
            ],
            [
                'key' => 'clinical',
                'title' => 'Clinical Assessment',
                'description' => 'Clinical evaluation of participant',
                'questions' => [
                    ['key' => 'mobility_status', 'text' => 'Mobility Status', 'type' => 'select', 'options' => ['Independent', 'Supervision', 'Minimal Assist', 'Moderate Assist', 'Maximum Assist', 'Dependent']],
                    ['key' => 'transfer_methods', 'text' => 'Transfer Methods', 'type' => 'multiselect', 'options' => ['Stand Pivot', 'Sliding Board', 'Hoist', 'Independent', 'Other']],
                    ['key' => 'wheelchair_type', 'text' => 'Wheelchair Type', 'type' => 'select', 'options' => ['Manual', 'Power', 'Both', 'None']],
                    ['key' => 'wheelchair_width', 'text' => 'Wheelchair Width (mm)', 'type' => 'number'],
                    ['key' => 'wheelchair_length', 'text' => 'Wheelchair Length (mm)', 'type' => 'number'],
                    ['key' => 'wheelchair_turning', 'text' => 'Turning Circle Radius (mm)', 'type' => 'number'],
                    ['key' => 'standing_height', 'text' => 'Standing Reach Height (mm)', 'type' => 'number'],
                    ['key' => 'sitting_height', 'text' => 'Sitting Reach Height (mm)', 'type' => 'number'],
                    ['key' => 'cognition', 'text' => 'Cognition Status', 'type' => 'textarea'],
                    ['key' => 'vision', 'text' => 'Vision Status', 'type' => 'textarea'],
                    ['key' => 'hoist_needed', 'text' => 'Ceiling Hoist Needed', 'type' => 'boolean'],
                    ['key' => 'carer_support', 'text' => 'Carer Support Level', 'type' => 'select', 'options' => ['No Carer', 'Single Carer', 'Two Carers']]
                ]
            ],
            [
                'key' => 'bathroom',
                'title' => 'Bathroom Assessment',
                'description' => 'Bathroom and wet area evaluation',
                'questions' => [
                    ['key' => 'shower_type', 'text' => 'Current Shower Type', 'type' => 'select', 'options' => ['Over Bath', 'Step-in Recess', 'Hobless', 'Wet Room']],
                    ['key' => 'shower_width', 'text' => 'Shower Width (mm)', 'type' => 'number'],
                    ['key' => 'shower_depth', 'text' => 'Shower Depth (mm)', 'type' => 'number'],
                    ['key' => 'hobless_feasible', 'text' => 'Hobless Conversion Feasible', 'type' => 'boolean'],
                    ['key' => 'toilet_height', 'text' => 'Toilet Height (mm)', 'type' => 'number'],
                    ['key' => 'toilet_setout', 'text' => 'Toilet Setout from Wall (mm)', 'type' => 'number'],
                    ['key' => 'grab_rail_walls', 'text' => 'Wall Construction for Rails', 'type' => 'select', 'options' => ['Plaster', 'Brick', 'Tile over Plaster', 'Concrete']],
                    ['key' => 'drainage', 'text' => 'Drainage Condition', 'type' => 'select', 'options' => ['Adequate', 'Needs Improvement', 'Major Works Required']],
                    ['key' => 'ventilation', 'text' => 'Ventilation', 'type' => 'select', 'options' => ['Window', 'Exhaust Fan', 'Both', 'None']],
                    ['key' => 'slip_resistance', 'text' => 'Floor Slip Resistance', 'type' => 'select', 'options' => ['Adequate', 'Needs Treatment', 'Replacement Required']],
                    ['key' => 'bathroom_photos', 'text' => 'Bathroom Photos', 'type' => 'photo_upload', 'options' => ['multiple' => true]]
                ]
            ],
            [
                'key' => 'bedroom',
                'title' => 'Bedroom Assessment',
                'description' => 'Bedroom accessibility evaluation',
                'questions' => [
                    ['key' => 'bed_height', 'text' => 'Bed Height (mm)', 'type' => 'number'],
                    ['key' => 'transfer_space', 'text' => 'Transfer Space Available', 'type' => 'select', 'options' => ['Both Sides', 'One Side', 'Limited']],
                    ['key' => 'hoist_clearance', 'text' => 'Ceiling Hoist Clearance', 'type' => 'boolean'],
                    ['key' => 'wardrobe_access', 'text' => 'Wardrobe Accessibility', 'type' => 'select', 'options' => ['Accessible', 'Partially Accessible', 'Not Accessible']],
                    ['key' => 'emergency_egress', 'text' => 'Emergency Egress Available', 'type' => 'boolean'],
                    ['key' => 'bedroom_photos', 'text' => 'Bedroom Photos', 'type' => 'photo_upload', 'options' => ['multiple' => true]]
                ]
            ],
            [
                'key' => 'kitchen',
                'title' => 'Kitchen Assessment',
                'description' => 'Kitchen accessibility evaluation',
                'questions' => [
                    ['key' => 'bench_height', 'text' => 'Bench Height (mm)', 'type' => 'number'],
                    ['key' => 'knee_clearance', 'text' => 'Knee Clearance Available (mm)', 'type' => 'number'],
                    ['key' => 'sink_access', 'text' => 'Sink Accessibility', 'type' => 'select', 'options' => ['Accessible', 'Needs Modification', 'Not Accessible']],
                    ['key' => 'cooktop_access', 'text' => 'Cooktop Accessibility', 'type' => 'select', 'options' => ['Accessible', 'Needs Modification', 'Not Accessible']],
                    ['key' => 'storage_access', 'text' => 'Storage Accessibility', 'type' => 'select', 'options' => ['Accessible', 'Partially', 'Not Accessible']],
                    ['key' => 'scald_risk', 'text' => 'Scald Risk Present', 'type' => 'boolean'],
                    ['key' => 'kitchen_photos', 'text' => 'Kitchen Photos', 'type' => 'photo_upload', 'options' => ['multiple' => true]]
                ]
            ],
            [
                'key' => 'external',
                'title' => 'External Access',
                'description' => 'External pathways and entry assessment',
                'questions' => [
                    ['key' => 'parking_type', 'text' => 'Parking Type', 'type' => 'select', 'options' => ['Garage', 'Carport', 'Driveway', 'Street']],
                    ['key' => 'path_width', 'text' => 'Path Width (mm)', 'type' => 'number'],
                    ['key' => 'path_gradient', 'text' => 'Path Gradient', 'type' => 'text'],
                    ['key' => 'step_count', 'text' => 'Number of Steps', 'type' => 'number'],
                    ['key' => 'ramp_feasible', 'text' => 'Ramp Installation Feasible', 'type' => 'boolean'],
                    ['key' => 'door_width', 'text' => 'Entry Door Width (mm)', 'type' => 'number'],
                    ['key' => 'threshold_height', 'text' => 'Threshold Height (mm)', 'type' => 'number'],
                    ['key' => 'landing_size', 'text' => 'Landing Size Adequate', 'type' => 'boolean'],
                    ['key' => 'external_photos', 'text' => 'External Photos', 'type' => 'photo_upload', 'options' => ['multiple' => true]]
                ]
            ],
            [
                'key' => 'recommendations',
                'title' => 'Recommendations',
                'description' => 'Proposed modifications and options',
                'questions' => [
                    ['key' => 'bathroom_recs', 'text' => 'Bathroom Recommendations', 'type' => 'recommendations_grid'],
                    ['key' => 'bedroom_recs', 'text' => 'Bedroom Recommendations', 'type' => 'recommendations_grid'],
                    ['key' => 'kitchen_recs', 'text' => 'Kitchen Recommendations', 'type' => 'recommendations_grid'],
                    ['key' => 'external_recs', 'text' => 'External Access Recommendations', 'type' => 'recommendations_grid'],
                    ['key' => 'other_recs', 'text' => 'Other Recommendations', 'type' => 'recommendations_grid'],
                    ['key' => 'priority_order', 'text' => 'Priority Order', 'type' => 'textarea'],
                    ['key' => 'staged_approach', 'text' => 'Staged Approach Recommended', 'type' => 'boolean']
                ]
            ],
            [
                'key' => 'compliance',
                'title' => 'Compliance & Standards',
                'description' => 'Building code and accessibility standards compliance',
                'questions' => [
                    ['key' => 'as1428_compliance', 'text' => 'AS1428.1 Compliance Check', 'type' => 'compliance_grid'],
                    ['key' => 'bca_compliance', 'text' => 'BCA Compliance Check', 'type' => 'compliance_grid'],
                    ['key' => 'livable_housing', 'text' => 'Livable Housing Guidelines', 'type' => 'compliance_grid'],
                    ['key' => 'permits_required', 'text' => 'Building Permits Required', 'type' => 'boolean'],
                    ['key' => 'engineer_required', 'text' => 'Structural Engineer Required', 'type' => 'boolean']
                ]
            ],
            [
                'key' => 'quotes',
                'title' => 'Quotes & Costings',
                'description' => 'Builder quotes and cost analysis',
                'questions' => [
                    ['key' => 'quote_1', 'text' => 'Quote 1', 'type' => 'quote_entry'],
                    ['key' => 'quote_2', 'text' => 'Quote 2', 'type' => 'quote_entry'],
                    ['key' => 'quote_comparison', 'text' => 'Quote Comparison Notes', 'type' => 'textarea'],
                    ['key' => 'recommended_quote', 'text' => 'Recommended Quote', 'type' => 'select', 'options' => ['Quote 1', 'Quote 2', 'Neither - Resubmit']],
                    ['key' => 'vfm_justification', 'text' => 'Value for Money Justification', 'type' => 'textarea', 'required' => true]
                ]
            ],
            [
                'key' => 'summary',
                'title' => 'Executive Summary',
                'description' => 'Report summary and sign-off',
                'questions' => [
                    ['key' => 'executive_summary', 'text' => 'Executive Summary', 'type' => 'textarea', 'required' => true],
                    ['key' => 'clinical_findings', 'text' => 'Key Clinical Findings', 'type' => 'textarea'],
                    ['key' => 'ndia_criteria', 'text' => 'NDIA Funding Criteria Justification', 'type' => 'textarea', 'required' => true],
                    ['key' => 'therapist_declaration', 'text' => 'Therapist Declaration', 'type' => 'boolean', 'required' => true]
                ]
            ]
        ];

        self::insertSections($templateId, $sections);
    }

    /**
     * Seed Functional Assessment sections
     */
    private static function seedFunctionalAssessmentSections(string $templateId): void
    {
        $sections = [
            [
                'key' => 'self_care',
                'title' => 'Self-Care ADLs',
                'description' => 'Basic activities of daily living',
                'questions' => [
                    ['key' => 'bathing', 'text' => 'Bathing/Showering', 'type' => 'fim_scale', 'required' => true],
                    ['key' => 'dressing_upper', 'text' => 'Dressing - Upper Body', 'type' => 'fim_scale', 'required' => true],
                    ['key' => 'dressing_lower', 'text' => 'Dressing - Lower Body', 'type' => 'fim_scale', 'required' => true],
                    ['key' => 'grooming', 'text' => 'Grooming', 'type' => 'fim_scale', 'required' => true],
                    ['key' => 'toileting', 'text' => 'Toileting', 'type' => 'fim_scale', 'required' => true],
                    ['key' => 'eating', 'text' => 'Eating', 'type' => 'fim_scale', 'required' => true]
                ]
            ],
            [
                'key' => 'mobility',
                'title' => 'Mobility',
                'description' => 'Transfer and locomotion abilities',
                'questions' => [
                    ['key' => 'bed_mobility', 'text' => 'Bed Mobility', 'type' => 'fim_scale', 'required' => true],
                    ['key' => 'transfer_bed', 'text' => 'Transfer - Bed/Chair', 'type' => 'fim_scale', 'required' => true],
                    ['key' => 'transfer_toilet', 'text' => 'Transfer - Toilet', 'type' => 'fim_scale', 'required' => true],
                    ['key' => 'transfer_shower', 'text' => 'Transfer - Shower/Bath', 'type' => 'fim_scale', 'required' => true],
                    ['key' => 'ambulation', 'text' => 'Ambulation/Wheelchair', 'type' => 'fim_scale', 'required' => true],
                    ['key' => 'stairs', 'text' => 'Stairs', 'type' => 'fim_scale', 'required' => true]
                ]
            ],
            [
                'key' => 'iadl',
                'title' => 'Instrumental ADLs',
                'description' => 'Complex daily living activities',
                'questions' => [
                    ['key' => 'meal_prep', 'text' => 'Meal Preparation', 'type' => 'fim_scale'],
                    ['key' => 'housework', 'text' => 'Housework', 'type' => 'fim_scale'],
                    ['key' => 'laundry', 'text' => 'Laundry', 'type' => 'fim_scale'],
                    ['key' => 'shopping', 'text' => 'Shopping', 'type' => 'fim_scale'],
                    ['key' => 'transport', 'text' => 'Transport/Community Access', 'type' => 'fim_scale'],
                    ['key' => 'medication', 'text' => 'Medication Management', 'type' => 'fim_scale'],
                    ['key' => 'finances', 'text' => 'Financial Management', 'type' => 'fim_scale']
                ]
            ]
        ];

        self::insertSections($templateId, $sections);
    }

    /**
     * Seed Falls Risk sections
     */
    private static function seedFallsRiskSections(string $templateId): void
    {
        $sections = [
            [
                'key' => 'fall_history',
                'title' => 'Fall History',
                'description' => 'Previous falls and near misses',
                'questions' => [
                    ['key' => 'falls_12m', 'text' => 'Falls in past 12 months', 'type' => 'number', 'required' => true],
                    ['key' => 'fall_locations', 'text' => 'Fall Locations', 'type' => 'multiselect', 'options' => ['Bathroom', 'Bedroom', 'Kitchen', 'Living Area', 'Stairs', 'Outside', 'Other']],
                    ['key' => 'fall_injuries', 'text' => 'Injuries from Falls', 'type' => 'textarea'],
                    ['key' => 'near_misses', 'text' => 'Near Misses/Stumbles', 'type' => 'textarea'],
                    ['key' => 'fear_of_falling', 'text' => 'Fear of Falling', 'type' => 'scale_1_10']
                ]
            ],
            [
                'key' => 'home_safety',
                'title' => 'Home Safety Checklist',
                'description' => 'Environmental hazard assessment',
                'questions' => [
                    ['key' => 'lighting', 'text' => 'Adequate Lighting', 'type' => 'safety_check'],
                    ['key' => 'floor_surfaces', 'text' => 'Floor Surfaces Safe', 'type' => 'safety_check'],
                    ['key' => 'rugs_mats', 'text' => 'Rugs/Mats Secured', 'type' => 'safety_check'],
                    ['key' => 'clutter', 'text' => 'Pathways Clear', 'type' => 'safety_check'],
                    ['key' => 'handrails', 'text' => 'Handrails Present', 'type' => 'safety_check'],
                    ['key' => 'bathroom_safety', 'text' => 'Bathroom Safety Features', 'type' => 'safety_check'],
                    ['key' => 'step_edges', 'text' => 'Step Edges Visible', 'type' => 'safety_check'],
                    ['key' => 'outdoor_paths', 'text' => 'Outdoor Paths Safe', 'type' => 'safety_check']
                ]
            ]
        ];

        self::insertSections($templateId, $sections);
    }

    /**
     * Seed Physio MSK sections
     */
    private static function seedPhysioMskSections(string $templateId): void
    {
        $sections = [
            [
                'key' => 'subjective',
                'title' => 'Subjective Assessment',
                'description' => 'Patient history and symptoms',
                'questions' => [
                    ['key' => 'chief_complaint', 'text' => 'Chief Complaint', 'type' => 'textarea', 'required' => true],
                    ['key' => 'pain_location', 'text' => 'Pain Location', 'type' => 'body_chart'],
                    ['key' => 'pain_severity', 'text' => 'Pain Severity (0-10)', 'type' => 'scale_0_10'],
                    ['key' => 'pain_nature', 'text' => 'Nature of Pain', 'type' => 'multiselect', 'options' => ['Aching', 'Sharp', 'Burning', 'Throbbing', 'Stabbing', 'Dull']],
                    ['key' => 'aggravating', 'text' => 'Aggravating Factors', 'type' => 'textarea'],
                    ['key' => 'easing', 'text' => 'Easing Factors', 'type' => 'textarea'],
                    ['key' => '24hr_pattern', 'text' => '24-Hour Pattern', 'type' => 'textarea'],
                    ['key' => 'medical_history', 'text' => 'Relevant Medical History', 'type' => 'textarea']
                ]
            ],
            [
                'key' => 'objective',
                'title' => 'Objective Assessment',
                'description' => 'Physical examination findings',
                'questions' => [
                    ['key' => 'observation', 'text' => 'Observation/Posture', 'type' => 'textarea'],
                    ['key' => 'arom', 'text' => 'Active ROM', 'type' => 'rom_grid'],
                    ['key' => 'prom', 'text' => 'Passive ROM', 'type' => 'rom_grid'],
                    ['key' => 'strength', 'text' => 'Muscle Strength (MMT)', 'type' => 'mmt_grid'],
                    ['key' => 'palpation', 'text' => 'Palpation Findings', 'type' => 'textarea'],
                    ['key' => 'special_tests', 'text' => 'Special Tests', 'type' => 'special_tests_grid'],
                    ['key' => 'neurological', 'text' => 'Neurological Screen', 'type' => 'textarea']
                ]
            ],
            [
                'key' => 'treatment',
                'title' => 'Treatment Plan',
                'description' => 'Exercise prescription and treatment',
                'questions' => [
                    ['key' => 'diagnosis', 'text' => 'Working Diagnosis', 'type' => 'textarea', 'required' => true],
                    ['key' => 'goals_short', 'text' => 'Short-term Goals', 'type' => 'textarea', 'required' => true],
                    ['key' => 'goals_long', 'text' => 'Long-term Goals', 'type' => 'textarea', 'required' => true],
                    ['key' => 'exercises', 'text' => 'Exercise Prescription', 'type' => 'exercise_grid'],
                    ['key' => 'treatment_techniques', 'text' => 'Treatment Techniques', 'type' => 'multiselect', 'options' => ['Manual Therapy', 'Dry Needling', 'Taping', 'Electrotherapy', 'Heat/Ice', 'Education']],
                    ['key' => 'frequency', 'text' => 'Treatment Frequency', 'type' => 'text'],
                    ['key' => 'review_date', 'text' => 'Review Date', 'type' => 'date']
                ]
            ]
        ];

        self::insertSections($templateId, $sections);
    }

    /**
     * Insert sections and questions
     */
    private static function insertSections(string $templateId, array $sections): void
    {
        $sectionOrder = 0;

        foreach ($sections as $section) {
            $sectionId = Database::generateUUID();
            $sectionOrder++;

            Database::execute(
                "INSERT INTO assessment_sections (id, template_id, section_key, section_title, description, order_index)
                 VALUES (?, ?, ?, ?, ?, ?)",
                [$sectionId, $templateId, $section['key'], $section['title'], $section['description'] ?? '', $sectionOrder]
            );

            $questionOrder = 0;
            foreach ($section['questions'] as $question) {
                $questionId = Database::generateUUID();
                $questionOrder++;

                Database::execute(
                    "INSERT INTO assessment_questions (id, section_id, question_key, question_text, question_type, 
                     is_required, options, order_index)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        $questionId,
                        $sectionId,
                        $question['key'],
                        $question['text'],
                        $question['type'],
                        $question['required'] ?? false,
                        isset($question['options']) ? json_encode($question['options']) : null,
                        $questionOrder
                    ]
                );
            }
        }
    }
}
