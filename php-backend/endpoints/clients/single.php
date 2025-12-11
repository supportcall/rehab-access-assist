<?php
/**
 * Single Client Endpoints
 * GET /api/v1/clients/{id} - Get client
 * PUT /api/v1/clients/{id} - Update client
 * DELETE /api/v1/clients/{id} - Delete client
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

// Check permissions
if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

// Extract client ID from URI
$clientId = $routeParams['id'] ?? null;

if (!$clientId || !Validator::isUUID($clientId)) {
    Response::badRequest('Invalid client ID');
}

// Check access to client
$client = Database::queryOne(
    "SELECT * FROM clients WHERE id = ?",
    [$clientId]
);

if (!$client) {
    Response::notFound('Client not found');
}

// Check ownership (unless system admin)
if (!in_array('system_admin', $roles)) {
    if ($client['assigned_ot_id'] !== $userId && $client['created_by'] !== $userId) {
        Response::forbidden('Access denied to this client');
    }
}

if ($method === 'GET') {
    // Get client with OT info
    $clientData = Database::queryOne(
        "SELECT c.*, 
                p.first_name as ot_first_name, p.last_name as ot_last_name, p.system_id as ot_system_id
         FROM clients c
         LEFT JOIN profiles p ON p.user_id = c.assigned_ot_id
         WHERE c.id = ?",
        [$clientId]
    );

    Response::success($clientData);

} elseif ($method === 'PUT' || $method === 'PATCH') {
    // Update client
    $input = json_decode(file_get_contents('php://input'), true);

    $allowedFields = [
        'first_name', 'last_name', 'date_of_birth', 'diagnosis',
        'funding_body', 'primary_mobility_aid', 'mobile_number',
        'postal_code', 'suburb', 'state', 'country', 'notes', 'assigned_ot_id'
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

    $params[] = $clientId;

    Database::execute(
        "UPDATE clients SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?",
        $params
    );

    $updatedClient = Database::queryOne("SELECT * FROM clients WHERE id = ?", [$clientId]);

    Logger::info("Client updated: {$clientId} by user: {$userId}");

    Response::success($updatedClient, 'Client updated successfully');

} elseif ($method === 'DELETE') {
    // Delete client (soft delete would be better for production)
    Database::execute("DELETE FROM clients WHERE id = ?", [$clientId]);

    Logger::info("Client deleted: {$clientId} by user: {$userId}");

    Response::success(null, 'Client deleted successfully');

} else {
    Response::methodNotAllowed('GET, PUT, PATCH, DELETE');
}
