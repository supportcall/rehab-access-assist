<?php
/**
 * Measurements Endpoints
 * GET /api/v1/assessments/{assessment_id}/measurements
 * POST /api/v1/assessments/{assessment_id}/measurements
 * PUT /api/v1/assessments/{assessment_id}/measurements/{id}
 * DELETE /api/v1/assessments/{assessment_id}/measurements/{id}
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

$assessmentId = $routeParams['assessment_id'] ?? null;
$measurementId = $routeParams['id'] ?? null;

if (!$assessmentId || !Validator::isUUID($assessmentId)) {
    Response::badRequest('Invalid assessment ID');
}

// Verify assessment access
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
    'location', 'measurement_type', 'value_mm', 'required_value_mm',
    'compliant', 'standard_reference', 'notes', 'photo_urls'
];

if ($method === 'GET') {
    if ($measurementId) {
        $measurement = Database::queryOne(
            "SELECT * FROM measurements WHERE id = ? AND assessment_id = ?",
            [$measurementId, $assessmentId]
        );
        if (!$measurement) {
            Response::notFound('Measurement not found');
        }
        Response::success($measurement);
    } else {
        $measurements = Database::query(
            "SELECT * FROM measurements WHERE assessment_id = ? ORDER BY location, measurement_type",
            [$assessmentId]
        );
        Response::success($measurements);
    }

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['location']) || empty($input['measurement_type'])) {
        Response::badRequest('location and measurement_type are required');
    }

    $fields = ['id', 'assessment_id'];
    $values = [Database::generateUUID(), $assessmentId];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $fields[] = $field;
            $value = $input[$field];
            if (is_array($value)) {
                $value = json_encode($value);
            }
            $values[] = $value;
        }
    }

    $placeholders = implode(', ', array_fill(0, count($fields), '?'));
    $fieldList = implode(', ', $fields);

    Database::execute(
        "INSERT INTO measurements ({$fieldList}, created_at, updated_at) VALUES ({$placeholders}, NOW(), NOW())",
        $values
    );

    $measurement = Database::queryOne("SELECT * FROM measurements WHERE id = ?", [$values[0]]);

    Response::success($measurement, 'Measurement created', 201);

} elseif ($method === 'PUT' || $method === 'PATCH') {
    if (!$measurementId || !Validator::isUUID($measurementId)) {
        Response::badRequest('Invalid measurement ID');
    }

    $existing = Database::queryOne(
        "SELECT * FROM measurements WHERE id = ? AND assessment_id = ?",
        [$measurementId, $assessmentId]
    );

    if (!$existing) {
        Response::notFound('Measurement not found');
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $updates = [];
    $params = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $updates[] = "{$field} = ?";
            $value = $input[$field];
            if (is_array($value)) {
                $value = json_encode($value);
            }
            $params[] = $value;
        }
    }

    if (empty($updates)) {
        Response::badRequest('No valid fields to update');
    }

    $params[] = $measurementId;

    Database::execute(
        "UPDATE measurements SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?",
        $params
    );

    $measurement = Database::queryOne("SELECT * FROM measurements WHERE id = ?", [$measurementId]);

    Response::success($measurement, 'Measurement updated');

} elseif ($method === 'DELETE') {
    if (!$measurementId || !Validator::isUUID($measurementId)) {
        Response::badRequest('Invalid measurement ID');
    }

    $result = Database::execute(
        "DELETE FROM measurements WHERE id = ? AND assessment_id = ?",
        [$measurementId, $assessmentId]
    );

    if ($result === 0) {
        Response::notFound('Measurement not found');
    }

    Response::success(null, 'Measurement deleted');

} else {
    Response::methodNotAllowed('GET, POST, PUT, PATCH, DELETE');
}
