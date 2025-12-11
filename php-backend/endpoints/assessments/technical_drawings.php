<?php
/**
 * Technical Drawings Endpoints
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

$assessmentId = $routeParams['assessment_id'] ?? null;
$drawingId = $routeParams['id'] ?? null;

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
    'title', 'description', 'drawing_type', 'room_area', 'svg_content',
    'ai_generated', 'photo_references', 'measurements_used', 'annotations'
];

if ($method === 'GET') {
    if ($drawingId) {
        $drawing = Database::queryOne(
            "SELECT * FROM technical_drawings WHERE id = ? AND assessment_id = ?",
            [$drawingId, $assessmentId]
        );
        if (!$drawing) Response::notFound('Drawing not found');
        Response::success($drawing);
    } else {
        $drawings = Database::query(
            "SELECT * FROM technical_drawings WHERE assessment_id = ? ORDER BY created_at DESC",
            [$assessmentId]
        );
        Response::success($drawings);
    }

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['title']) || empty($input['drawing_type'])) {
        Response::badRequest('title and drawing_type are required');
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
    Database::execute(
        "INSERT INTO technical_drawings (" . implode(', ', $fields) . ", created_at, updated_at) VALUES ({$placeholders}, NOW(), NOW())",
        $values
    );

    $drawing = Database::queryOne("SELECT * FROM technical_drawings WHERE id = ?", [$values[0]]);
    Response::success($drawing, 'Drawing created', 201);

} elseif ($method === 'PUT' || $method === 'PATCH') {
    if (!$drawingId) Response::badRequest('Invalid drawing ID');

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

    if (empty($updates)) Response::badRequest('No valid fields');

    $params[] = $drawingId;
    Database::execute(
        "UPDATE technical_drawings SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?",
        $params
    );

    $drawing = Database::queryOne("SELECT * FROM technical_drawings WHERE id = ?", [$drawingId]);
    Response::success($drawing, 'Drawing updated');

} elseif ($method === 'DELETE') {
    if (!$drawingId) Response::badRequest('Invalid drawing ID');
    Database::execute("DELETE FROM technical_drawings WHERE id = ? AND assessment_id = ?", [$drawingId, $assessmentId]);
    Response::success(null, 'Drawing deleted');

} else {
    Response::methodNotAllowed('GET, POST, PUT, PATCH, DELETE');
}
