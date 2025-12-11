<?php
/**
 * Compliance Checklist Endpoints
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

$assessmentId = $routeParams['assessment_id'] ?? null;
$checkId = $routeParams['id'] ?? null;

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
    'standard_reference', 'provision_number', 'requirement_description',
    'compliant', 'non_compliance_notes', 'remediation_required'
];

if ($method === 'GET') {
    if ($checkId) {
        $check = Database::queryOne(
            "SELECT * FROM compliance_checklist WHERE id = ? AND assessment_id = ?",
            [$checkId, $assessmentId]
        );
        if (!$check) Response::notFound('Compliance check not found');
        Response::success($check);
    } else {
        $checks = Database::query(
            "SELECT * FROM compliance_checklist WHERE assessment_id = ? ORDER BY standard_reference, provision_number",
            [$assessmentId]
        );
        Response::success($checks);
    }

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['standard_reference'])) {
        Response::badRequest('standard_reference is required');
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
        "INSERT INTO compliance_checklist (" . implode(', ', $fields) . ", created_at, updated_at) VALUES ({$placeholders}, NOW(), NOW())",
        $values
    );

    $check = Database::queryOne("SELECT * FROM compliance_checklist WHERE id = ?", [$values[0]]);
    Response::success($check, 'Compliance check created', 201);

} elseif ($method === 'PUT' || $method === 'PATCH') {
    if (!$checkId) Response::badRequest('Invalid check ID');

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

    $params[] = $checkId;
    Database::execute(
        "UPDATE compliance_checklist SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?",
        $params
    );

    $check = Database::queryOne("SELECT * FROM compliance_checklist WHERE id = ?", [$checkId]);
    Response::success($check, 'Compliance check updated');

} elseif ($method === 'DELETE') {
    if (!$checkId) Response::badRequest('Invalid check ID');
    Database::execute("DELETE FROM compliance_checklist WHERE id = ? AND assessment_id = ?", [$checkId, $assessmentId]);
    Response::success(null, 'Compliance check deleted');

} else {
    Response::methodNotAllowed('GET, POST, PUT, PATCH, DELETE');
}
