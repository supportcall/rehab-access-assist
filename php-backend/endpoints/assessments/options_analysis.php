<?php
/**
 * Options Analysis Endpoints
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

$assessmentId = $routeParams['assessment_id'] ?? null;
$optionId = $routeParams['id'] ?? null;

if (!$assessmentId || !Validator::isUUID($assessmentId)) {
    Response::badRequest('Invalid assessment ID');
}

$assessment = Database::queryOne("SELECT * FROM assessments WHERE id = ?", [$assessmentId]);
if (!$assessment) Response::notFound('Assessment not found');

if (!in_array('system_admin', $roles)) {
    if ($assessment['assigned_ot_id'] !== $userId && $assessment['created_by'] !== $userId) {
        Response::forbidden('Access denied');
    }
}

$allowedFields = [
    'goal_area', 'option_type', 'option_description', 'clinical_impact', 'compliance_notes',
    'risks', 'buildability', 'program_estimate', 'estimated_cost', 'value_for_money_justification',
    'ndia_alignment', 'recommended'
];

if ($method === 'GET') {
    if ($optionId) {
        $option = Database::queryOne(
            "SELECT * FROM options_analysis WHERE id = ? AND assessment_id = ?",
            [$optionId, $assessmentId]
        );
        if (!$option) Response::notFound('Option not found');
        Response::success($option);
    } else {
        $options = Database::query(
            "SELECT * FROM options_analysis WHERE assessment_id = ? ORDER BY goal_area, recommended DESC",
            [$assessmentId]
        );
        Response::success($options);
    }

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['goal_area']) || empty($input['option_type'])) {
        Response::badRequest('goal_area and option_type are required');
    }

    $fields = ['id', 'assessment_id'];
    $values = [Database::generateUUID(), $assessmentId];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $fields[] = $field;
            $values[] = $input[$field];
        }
    }

    $placeholders = implode(', ', array_fill(0, count($fields), '?'));
    Database::execute(
        "INSERT INTO options_analysis (" . implode(', ', $fields) . ", created_at, updated_at) VALUES ({$placeholders}, NOW(), NOW())",
        $values
    );

    $option = Database::queryOne("SELECT * FROM options_analysis WHERE id = ?", [$values[0]]);
    Response::success($option, 'Option created', 201);

} elseif ($method === 'PUT' || $method === 'PATCH') {
    if (!$optionId) Response::badRequest('Invalid option ID');

    $input = json_decode(file_get_contents('php://input'), true);
    $updates = [];
    $params = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $updates[] = "{$field} = ?";
            $params[] = $input[$field];
        }
    }

    if (empty($updates)) Response::badRequest('No valid fields');

    $params[] = $optionId;
    Database::execute(
        "UPDATE options_analysis SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?",
        $params
    );

    $option = Database::queryOne("SELECT * FROM options_analysis WHERE id = ?", [$optionId]);
    Response::success($option, 'Option updated');

} elseif ($method === 'DELETE') {
    if (!$optionId) Response::badRequest('Invalid option ID');
    Database::execute("DELETE FROM options_analysis WHERE id = ? AND assessment_id = ?", [$optionId, $assessmentId]);
    Response::success(null, 'Option deleted');

} else {
    Response::methodNotAllowed('GET, POST, PUT, PATCH, DELETE');
}
