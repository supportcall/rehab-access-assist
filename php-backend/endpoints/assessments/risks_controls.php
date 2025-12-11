<?php
/**
 * Risks & Controls Endpoints
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

$assessmentId = $routeParams['assessment_id'] ?? null;
$riskId = $routeParams['id'] ?? null;

if (!$assessmentId || !Validator::isUUID($assessmentId)) {
    Response::badRequest('Invalid assessment ID');
}

$assessment = Database::queryOne("SELECT * FROM assessments WHERE id = ?", [$assessmentId]);
if (!$assessment) {
    Response::notFound('Assessment not found');
}

if (!in_array('system_admin', $roles)) {
    if ($assessment['assigned_ot_id'] !== $userId && $assessment['created_by'] !== $userId) {
        Response::forbidden('Access denied');
    }
}

$allowedFields = [
    'risk_type', 'risk_description', 'severity', 'control_measure',
    'home_fast_item', 'safer_home_item', 'wehsa_item', 'lighting_contrast',
    'construction_phase_risks', 'decanting_plan', 'site_security', 'infection_control', 'photo_urls'
];

if ($method === 'GET') {
    if ($riskId) {
        $risk = Database::queryOne(
            "SELECT * FROM risks_controls WHERE id = ? AND assessment_id = ?",
            [$riskId, $assessmentId]
        );
        if (!$risk) Response::notFound('Risk not found');
        Response::success($risk);
    } else {
        $risks = Database::query(
            "SELECT * FROM risks_controls WHERE assessment_id = ? ORDER BY risk_type, severity DESC",
            [$assessmentId]
        );
        Response::success($risks);
    }

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['risk_type'])) {
        Response::badRequest('risk_type is required');
    }

    $fields = ['id', 'assessment_id'];
    $values = [Database::generateUUID(), $assessmentId];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $fields[] = $field;
            $value = is_array($input[$field]) ? json_encode($input[$field]) : $input[$field];
            $values[] = $value;
        }
    }

    $placeholders = implode(', ', array_fill(0, count($fields), '?'));
    Database::execute(
        "INSERT INTO risks_controls (" . implode(', ', $fields) . ", created_at, updated_at) VALUES ({$placeholders}, NOW(), NOW())",
        $values
    );

    $risk = Database::queryOne("SELECT * FROM risks_controls WHERE id = ?", [$values[0]]);
    Response::success($risk, 'Risk created', 201);

} elseif ($method === 'PUT' || $method === 'PATCH') {
    if (!$riskId) Response::badRequest('Invalid risk ID');

    $input = json_decode(file_get_contents('php://input'), true);
    $updates = [];
    $params = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $updates[] = "{$field} = ?";
            $params[] = is_array($input[$field]) ? json_encode($input[$field]) : $input[$field];
        }
    }

    if (empty($updates)) Response::badRequest('No valid fields');

    $params[] = $riskId;
    Database::execute(
        "UPDATE risks_controls SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?",
        $params
    );

    $risk = Database::queryOne("SELECT * FROM risks_controls WHERE id = ?", [$riskId]);
    Response::success($risk, 'Risk updated');

} elseif ($method === 'DELETE') {
    if (!$riskId) Response::badRequest('Invalid risk ID');
    Database::execute("DELETE FROM risks_controls WHERE id = ? AND assessment_id = ?", [$riskId, $assessmentId]);
    Response::success(null, 'Risk deleted');

} else {
    Response::methodNotAllowed('GET, POST, PUT, PATCH, DELETE');
}
