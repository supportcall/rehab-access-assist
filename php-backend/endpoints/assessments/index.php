<?php
/**
 * Assessments Endpoints
 * GET /api/v1/assessments - List assessments
 * POST /api/v1/assessments - Create assessment
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

if ($method === 'GET') {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $status = $_GET['status'] ?? null;
    $clientId = $_GET['client_id'] ?? null;

    $where = [];
    $params = [];

    // Filter by assigned OT or created by (unless system admin)
    if (!in_array('system_admin', $roles)) {
        $where[] = "(a.assigned_ot_id = ? OR a.created_by = ?)";
        $params[] = $userId;
        $params[] = $userId;
    }

    if ($status) {
        $where[] = "a.status = ?";
        $params[] = $status;
    }

    if ($clientId) {
        $where[] = "a.client_id = ?";
        $params[] = $clientId;
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $total = Database::queryOne(
        "SELECT COUNT(*) as count FROM assessments a {$whereClause}",
        $params
    )['count'];

    $assessments = Database::query(
        "SELECT a.*, 
                c.first_name as client_first_name, c.last_name as client_last_name, c.system_id as client_system_id,
                p.first_name as ot_first_name, p.last_name as ot_last_name
         FROM assessments a
         LEFT JOIN clients c ON c.id = a.client_id
         LEFT JOIN profiles p ON p.user_id = a.assigned_ot_id
         {$whereClause}
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?",
        array_merge($params, [$limit, $offset])
    );

    Response::success([
        'assessments' => $assessments,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ]);

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $rules = [
        'client_id' => ['required', 'uuid']
    ];

    $errors = Validator::validate($input ?? [], $rules);
    if (!empty($errors)) {
        Response::badRequest('Validation failed', $errors);
    }

    // Verify client access
    $client = Database::queryOne(
        "SELECT * FROM clients WHERE id = ?",
        [$input['client_id']]
    );

    if (!$client) {
        Response::notFound('Client not found');
    }

    if (!in_array('system_admin', $roles)) {
        if ($client['assigned_ot_id'] !== $userId && $client['created_by'] !== $userId) {
            Response::forbidden('Access denied to this client');
        }
    }

    try {
        $assessmentId = Database::generateUUID();

        Database::execute(
            "INSERT INTO assessments (
                id, client_id, created_by, assigned_ot_id, assessment_date, status,
                primary_goal, fall_history, near_miss_locations,
                difficulty_toileting, difficulty_showering, difficulty_transfers, difficulty_steps,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, CURDATE(), 'draft', ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [
                $assessmentId,
                $input['client_id'],
                $userId,
                $input['assigned_ot_id'] ?? $userId,
                $input['primary_goal'] ?? null,
                $input['fall_history'] ?? null,
                $input['near_miss_locations'] ?? null,
                $input['difficulty_toileting'] ?? null,
                $input['difficulty_showering'] ?? null,
                $input['difficulty_transfers'] ?? null,
                $input['difficulty_steps'] ?? null
            ]
        );

        $assessment = Database::queryOne("SELECT * FROM assessments WHERE id = ?", [$assessmentId]);

        Logger::info("Assessment created: {$assessmentId} by user: {$userId}");

        Response::success($assessment, 'Assessment created successfully', 201);

    } catch (Exception $e) {
        Logger::exception($e);
        Response::serverError('Failed to create assessment');
    }

} else {
    Response::methodNotAllowed('GET, POST');
}
