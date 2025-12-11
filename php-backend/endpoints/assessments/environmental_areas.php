<?php
/**
 * Environmental Areas Endpoints
 * GET /api/v1/assessments/{assessment_id}/environmental_areas
 * POST /api/v1/assessments/{assessment_id}/environmental_areas
 * PUT /api/v1/assessments/{assessment_id}/environmental_areas/{id}
 * DELETE /api/v1/assessments/{assessment_id}/environmental_areas/{id}
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

$assessmentId = $routeParams['assessment_id'] ?? null;
$areaId = $routeParams['id'] ?? null;

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
    'area_location', 'area_name', 'door_clear_width', 'threshold_height',
    'toilet_centerline_left', 'toilet_centerline_right', 'ramp_gradient_riser',
    'ramp_gradient_going', 'wall_construction', 'barriers', 'notes', 'photo_urls'
];

if ($method === 'GET') {
    if ($areaId) {
        $area = Database::queryOne(
            "SELECT * FROM environmental_areas WHERE id = ? AND assessment_id = ?",
            [$areaId, $assessmentId]
        );
        if (!$area) {
            Response::notFound('Environmental area not found');
        }
        Response::success($area);
    } else {
        $areas = Database::query(
            "SELECT * FROM environmental_areas WHERE assessment_id = ? ORDER BY area_location, area_name",
            [$assessmentId]
        );
        Response::success($areas);
    }

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['area_location'])) {
        Response::badRequest('area_location is required');
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
        "INSERT INTO environmental_areas ({$fieldList}, created_at, updated_at) VALUES ({$placeholders}, NOW(), NOW())",
        $values
    );

    $newId = $values[0];
    $area = Database::queryOne("SELECT * FROM environmental_areas WHERE id = ?", [$newId]);

    Response::success($area, 'Environmental area created', 201);

} elseif ($method === 'PUT' || $method === 'PATCH') {
    if (!$areaId || !Validator::isUUID($areaId)) {
        Response::badRequest('Invalid area ID');
    }

    $existing = Database::queryOne(
        "SELECT * FROM environmental_areas WHERE id = ? AND assessment_id = ?",
        [$areaId, $assessmentId]
    );

    if (!$existing) {
        Response::notFound('Environmental area not found');
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

    $params[] = $areaId;

    Database::execute(
        "UPDATE environmental_areas SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?",
        $params
    );

    $area = Database::queryOne("SELECT * FROM environmental_areas WHERE id = ?", [$areaId]);

    Response::success($area, 'Environmental area updated');

} elseif ($method === 'DELETE') {
    if (!$areaId || !Validator::isUUID($areaId)) {
        Response::badRequest('Invalid area ID');
    }

    $result = Database::execute(
        "DELETE FROM environmental_areas WHERE id = ? AND assessment_id = ?",
        [$areaId, $assessmentId]
    );

    if ($result === 0) {
        Response::notFound('Environmental area not found');
    }

    Response::success(null, 'Environmental area deleted');

} else {
    Response::methodNotAllowed('GET, POST, PUT, PATCH, DELETE');
}
