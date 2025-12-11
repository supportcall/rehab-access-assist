<?php
/**
 * Clients Endpoints
 * GET /api/v1/clients - List clients
 * POST /api/v1/clients - Create client
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

// Check permissions
if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

if ($method === 'GET') {
    // List clients
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $search = $_GET['search'] ?? null;

    $where = [];
    $params = [];

    // Filter by assigned OT or created by (unless system admin)
    if (!in_array('system_admin', $roles)) {
        $where[] = "(assigned_ot_id = ? OR created_by = ?)";
        $params[] = $userId;
        $params[] = $userId;
    }

    // Search filter
    if ($search) {
        $where[] = "(first_name LIKE ? OR last_name LIKE ? OR system_id LIKE ?)";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    // Get total count
    $total = Database::count('clients', !empty($where) ? implode(' AND ', $where) : '1=1', $params);

    // Get clients
    $clients = Database::query(
        "SELECT c.*, 
                p.first_name as ot_first_name, p.last_name as ot_last_name
         FROM clients c
         LEFT JOIN profiles p ON p.user_id = c.assigned_ot_id
         {$whereClause}
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?",
        array_merge($params, [$limit, $offset])
    );

    Response::success([
        'clients' => $clients,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);

} elseif ($method === 'POST') {
    // Create client
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate
    $rules = [
        'first_name' => ['required', 'min:1', 'max:100'],
        'last_name' => ['required', 'min:1', 'max:100']
    ];

    $errors = Validator::validate($input ?? [], $rules);
    if (!empty($errors)) {
        Response::badRequest('Validation failed', $errors);
    }

    try {
        // Generate system ID
        $systemId = generateClientSystemId();

        $clientId = Database::generateUUID();

        Database::execute(
            "INSERT INTO clients (
                id, first_name, last_name, system_id, date_of_birth, diagnosis,
                funding_body, primary_mobility_aid, mobile_number, postal_code,
                suburb, state, country, notes, assigned_ot_id, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [
                $clientId,
                trim($input['first_name']),
                trim($input['last_name']),
                $systemId,
                $input['date_of_birth'] ?? null,
                $input['diagnosis'] ?? null,
                $input['funding_body'] ?? null,
                $input['primary_mobility_aid'] ?? null,
                $input['mobile_number'] ?? null,
                $input['postal_code'] ?? null,
                $input['suburb'] ?? null,
                $input['state'] ?? null,
                $input['country'] ?? 'Australia',
                $input['notes'] ?? null,
                $input['assigned_ot_id'] ?? $userId,
                $userId
            ]
        );

        $client = Database::queryOne("SELECT * FROM clients WHERE id = ?", [$clientId]);

        Logger::info("Client created: {$clientId} by user: {$userId}");

        Response::success($client, 'Client created successfully', 201);

    } catch (Exception $e) {
        Logger::exception($e);
        Response::serverError('Failed to create client');
    }

} else {
    Response::methodNotAllowed('GET, POST');
}

function generateClientSystemId(): string {
    $maxAttempts = 10;
    for ($i = 0; $i < $maxAttempts; $i++) {
        $id = 'PT-' . str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        if (!Database::exists('clients', 'system_id', $id)) {
            return $id;
        }
    }
    return 'PT-' . substr(time(), -6);
}
