<?php
/**
 * Referrals Endpoints
 * GET /api/v1/referrals - List referrals
 * POST /api/v1/referrals - Create referral
 * PUT /api/v1/referrals/{id} - Update referral (accept/reject)
 * DELETE /api/v1/referrals/{id} - Delete referral
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

$referralId = $routeParams['id'] ?? null;

if ($method === 'GET') {
    $type = $_GET['type'] ?? 'all'; // 'sent', 'received', 'all'

    $where = [];
    $params = [];

    if (!in_array('system_admin', $roles)) {
        if ($type === 'sent') {
            $where[] = "r.requesting_ot_id = ?";
            $params[] = $userId;
        } elseif ($type === 'received') {
            $where[] = "r.target_ot_id = ?";
            $params[] = $userId;
        } else {
            $where[] = "(r.requesting_ot_id = ? OR r.target_ot_id = ?)";
            $params[] = $userId;
            $params[] = $userId;
        }
    }

    $status = $_GET['status'] ?? null;
    if ($status) {
        $where[] = "r.status = ?";
        $params[] = $status;
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $referrals = Database::query(
        "SELECT r.*,
                c.first_name as client_first_name, c.last_name as client_last_name, c.system_id as client_system_id,
                req.first_name as requesting_ot_first_name, req.last_name as requesting_ot_last_name,
                tgt.first_name as target_ot_first_name, tgt.last_name as target_ot_last_name
         FROM referrals r
         LEFT JOIN clients c ON c.id = r.client_id
         LEFT JOIN profiles req ON req.user_id = r.requesting_ot_id
         LEFT JOIN profiles tgt ON tgt.user_id = r.target_ot_id
         {$whereClause}
         ORDER BY r.created_at DESC",
        $params
    );

    Response::success($referrals);

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['client_id']) || empty($input['target_ot_id'])) {
        Response::badRequest('client_id and target_ot_id are required');
    }

    // Validate client access
    $client = Database::queryOne("SELECT * FROM clients WHERE id = ?", [$input['client_id']]);
    if (!$client) {
        Response::notFound('Client not found');
    }

    if (!in_array('system_admin', $roles)) {
        if ($client['assigned_ot_id'] !== $userId && $client['created_by'] !== $userId) {
            Response::forbidden('Access denied to this client');
        }
    }

    // Validate target OT exists and is approved
    $targetOt = Database::queryOne(
        "SELECT p.* FROM profiles p
         JOIN user_roles ur ON ur.user_id = p.user_id
         WHERE p.user_id = ? AND ur.role = 'ot_admin'",
        [$input['target_ot_id']]
    );

    if (!$targetOt) {
        Response::notFound('Target OT not found or not approved');
    }

    $referralId = Database::generateUUID();

    Database::execute(
        "INSERT INTO referrals (id, client_id, requesting_ot_id, target_ot_id, status, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', ?, NOW(), NOW())",
        [
            $referralId,
            $input['client_id'],
            $userId,
            $input['target_ot_id'],
            $input['notes'] ?? null
        ]
    );

    $referral = Database::queryOne("SELECT * FROM referrals WHERE id = ?", [$referralId]);

    Logger::info("Referral created: {$referralId} from {$userId} to {$input['target_ot_id']}");

    Response::success($referral, 'Referral created', 201);

} elseif ($method === 'PUT' || $method === 'PATCH') {
    if (!$referralId || !Validator::isUUID($referralId)) {
        Response::badRequest('Invalid referral ID');
    }

    $referral = Database::queryOne("SELECT * FROM referrals WHERE id = ?", [$referralId]);
    if (!$referral) {
        Response::notFound('Referral not found');
    }

    // Check permissions
    $canUpdate = in_array('system_admin', $roles) || $referral['target_ot_id'] === $userId;
    if (!$canUpdate) {
        Response::forbidden('Only target OT can update referral');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $newStatus = $input['status'] ?? null;

    if (!in_array($newStatus, ['accepted', 'rejected'])) {
        Response::badRequest('status must be "accepted" or "rejected"');
    }

    if ($referral['status'] !== 'pending') {
        Response::badRequest('Referral has already been processed');
    }

    Database::beginTransaction();

    try {
        // Update referral
        Database::execute(
            "UPDATE referrals SET status = ?, referred_to_ot_id = ?, updated_at = NOW() WHERE id = ?",
            [$newStatus, $newStatus === 'accepted' ? $userId : null, $referralId]
        );

        // If accepted, update client assignment
        if ($newStatus === 'accepted') {
            Database::execute(
                "UPDATE clients SET assigned_ot_id = ?, updated_at = NOW() WHERE id = ?",
                [$userId, $referral['client_id']]
            );
        }

        Database::commit();

        $updated = Database::queryOne("SELECT * FROM referrals WHERE id = ?", [$referralId]);

        Logger::info("Referral {$referralId} {$newStatus} by {$userId}");

        Response::success($updated, "Referral {$newStatus}");

    } catch (Exception $e) {
        Database::rollback();
        Logger::exception($e);
        Response::serverError('Failed to update referral');
    }

} elseif ($method === 'DELETE') {
    if (!$referralId || !Validator::isUUID($referralId)) {
        Response::badRequest('Invalid referral ID');
    }

    $referral = Database::queryOne("SELECT * FROM referrals WHERE id = ?", [$referralId]);
    if (!$referral) {
        Response::notFound('Referral not found');
    }

    // Only requesting OT can delete pending referrals
    if ($referral['status'] !== 'pending') {
        Response::badRequest('Can only delete pending referrals');
    }

    if (!in_array('system_admin', $roles) && $referral['requesting_ot_id'] !== $userId) {
        Response::forbidden('Only requesting OT can delete referral');
    }

    Database::execute("DELETE FROM referrals WHERE id = ?", [$referralId]);

    Logger::info("Referral deleted: {$referralId}");

    Response::success(null, 'Referral deleted');

} else {
    Response::methodNotAllowed('GET, POST, PUT, PATCH, DELETE');
}
