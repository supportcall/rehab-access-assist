<?php
/**
 * Single Assessment Endpoints
 * GET /api/v1/assessments/{id} - Get assessment with all related data
 * PUT /api/v1/assessments/{id} - Update assessment
 * DELETE /api/v1/assessments/{id} - Delete assessment
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

$assessmentId = $routeParams['id'] ?? null;

if (!$assessmentId || !Validator::isUUID($assessmentId)) {
    Response::badRequest('Invalid assessment ID');
}

// Get assessment
$assessment = Database::queryOne(
    "SELECT a.*, 
            c.first_name as client_first_name, c.last_name as client_last_name, 
            c.system_id as client_system_id, c.date_of_birth as client_dob,
            c.diagnosis as client_diagnosis, c.funding_body, c.primary_mobility_aid
     FROM assessments a
     LEFT JOIN clients c ON c.id = a.client_id
     WHERE a.id = ?",
    [$assessmentId]
);

if (!$assessment) {
    Response::notFound('Assessment not found');
}

// Check ownership
if (!in_array('system_admin', $roles)) {
    if ($assessment['assigned_ot_id'] !== $userId && $assessment['created_by'] !== $userId) {
        Response::forbidden('Access denied to this assessment');
    }
}

if ($method === 'GET') {
    // Get all related data
    $relatedTables = [
        'pre_visit_details',
        'stakeholders',
        'funding_pathway',
        'clinical_assessment',
        'at_audit',
        'site_survey',
        'structural_reconnaissance',
        'builder_collaboration',
        'deliverables'
    ];

    $relatedData = [];
    foreach ($relatedTables as $table) {
        $data = Database::queryOne(
            "SELECT * FROM {$table} WHERE assessment_id = ?",
            [$assessmentId]
        );
        $relatedData[$table] = $data;
    }

    // Get array data
    $relatedData['environmental_areas'] = Database::query(
        "SELECT * FROM environmental_areas WHERE assessment_id = ? ORDER BY area_location",
        [$assessmentId]
    );

    $relatedData['measurements'] = Database::query(
        "SELECT * FROM measurements WHERE assessment_id = ? ORDER BY location, measurement_type",
        [$assessmentId]
    );

    $relatedData['risks_controls'] = Database::query(
        "SELECT * FROM risks_controls WHERE assessment_id = ? ORDER BY risk_type",
        [$assessmentId]
    );

    $relatedData['options_analysis'] = Database::query(
        "SELECT * FROM options_analysis WHERE assessment_id = ? ORDER BY goal_area",
        [$assessmentId]
    );

    $relatedData['compliance_checklist'] = Database::query(
        "SELECT * FROM compliance_checklist WHERE assessment_id = ? ORDER BY standard_reference",
        [$assessmentId]
    );

    $relatedData['technical_drawings'] = Database::query(
        "SELECT * FROM technical_drawings WHERE assessment_id = ? ORDER BY created_at",
        [$assessmentId]
    );

    Response::success([
        'assessment' => $assessment,
        'related' => $relatedData
    ]);

} elseif ($method === 'PUT' || $method === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true);

    $allowedFields = [
        'assessment_date', 'status', 'primary_goal', 'fall_history', 'near_miss_locations',
        'difficulty_toileting', 'difficulty_showering', 'difficulty_transfers', 'difficulty_steps',
        'assigned_ot_id', 'completed_at'
    ];

    $updates = [];
    $params = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $updates[] = "{$field} = ?";
            $params[] = $input[$field];
        }
    }

    if (empty($updates)) {
        Response::badRequest('No valid fields to update');
    }

    $params[] = $assessmentId;

    Database::execute(
        "UPDATE assessments SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?",
        $params
    );

    $updated = Database::queryOne("SELECT * FROM assessments WHERE id = ?", [$assessmentId]);

    Logger::info("Assessment updated: {$assessmentId} by user: {$userId}");

    Response::success($updated, 'Assessment updated successfully');

} elseif ($method === 'DELETE') {
    // Only allow deletion of draft assessments
    if ($assessment['status'] !== 'draft') {
        Response::badRequest('Only draft assessments can be deleted');
    }

    Database::beginTransaction();

    try {
        // Delete related data first
        $relatedTables = [
            'pre_visit_details', 'stakeholders', 'funding_pathway', 'clinical_assessment',
            'at_audit', 'site_survey', 'structural_reconnaissance', 'builder_collaboration',
            'deliverables', 'environmental_areas', 'measurements', 'risks_controls',
            'options_analysis', 'compliance_checklist', 'technical_drawings', 'assessment_tokens'
        ];

        foreach ($relatedTables as $table) {
            Database::execute("DELETE FROM {$table} WHERE assessment_id = ?", [$assessmentId]);
        }

        Database::execute("DELETE FROM assessments WHERE id = ?", [$assessmentId]);

        Database::commit();

        Logger::info("Assessment deleted: {$assessmentId} by user: {$userId}");

        Response::success(null, 'Assessment deleted successfully');

    } catch (Exception $e) {
        Database::rollback();
        Logger::exception($e);
        Response::serverError('Failed to delete assessment');
    }

} else {
    Response::methodNotAllowed('GET, PUT, PATCH, DELETE');
}
