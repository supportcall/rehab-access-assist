<?php
/**
 * Admin Endpoints - OT Signup Requests
 * GET /api/v1/admin/signup-requests - List pending requests
 * PUT /api/v1/admin/signup-requests/{id} - Approve/reject request
 * POST /api/v1/admin/signup-requests/{id}/approve - Approve request
 * POST /api/v1/admin/signup-requests/{id}/reject - Reject request
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('system_admin', $roles)) {
    Response::forbidden('System admin access required');
}

$requestId = $routeParams['id'] ?? null;
$action = $routeParams['action'] ?? null;

// Handle approve/reject actions (POST to /approve or /reject endpoints)
if ($action === 'approve' && $method === 'POST') {
    if (!$requestId || !Validator::isUUID($requestId)) {
        Response::badRequest('Invalid request ID');
    }

    $request = Database::queryOne("SELECT * FROM ot_signup_requests WHERE id = ?", [$requestId]);
    if (!$request) {
        Response::notFound('Signup request not found');
    }

    if ($request['status'] !== 'pending') {
        Response::badRequest('Request has already been processed');
    }

    Database::beginTransaction();

    try {
        // Update user role from pending_ot to ot_admin
        Database::execute(
            "UPDATE user_roles SET role = 'ot_admin' WHERE user_id = ? AND role = 'pending_ot'",
            [$request['user_id']]
        );

        // Update request status
        Database::execute(
            "UPDATE ot_signup_requests SET status = 'approved', reviewed_at = NOW(), reviewed_by = ? WHERE id = ?",
            [$userId, $requestId]
        );

        Database::commit();

        Logger::info("OT signup approved: {$request['email']} by admin: {$userId}");

        Response::success(null, 'Request approved successfully');

    } catch (Exception $e) {
        Database::rollback();
        Logger::exception($e);
        Response::serverError('Failed to approve request');
    }
}

if ($action === 'reject' && $method === 'POST') {
    if (!$requestId || !Validator::isUUID($requestId)) {
        Response::badRequest('Invalid request ID');
    }

    $request = Database::queryOne("SELECT * FROM ot_signup_requests WHERE id = ?", [$requestId]);
    if (!$request) {
        Response::notFound('Signup request not found');
    }

    if ($request['status'] !== 'pending') {
        Response::badRequest('Request has already been processed');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $reason = $input['reason'] ?? 'No reason provided';

    Database::execute(
        "UPDATE ot_signup_requests SET status = 'rejected', rejection_reason = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?",
        [$reason, $userId, $requestId]
    );

    Logger::info("OT signup rejected: {$request['email']} by admin: {$userId}");

    Response::success(null, 'Request rejected successfully');
}

// Standard REST endpoints
if ($method === 'GET') {
    $status = $_GET['status'] ?? null;

    if ($status) {
        $requests = Database::query(
            "SELECT sr.*, p.first_name, p.last_name, p.system_id
             FROM ot_signup_requests sr
             LEFT JOIN profiles p ON p.user_id = sr.user_id
             WHERE sr.status = ?
             ORDER BY sr.requested_at DESC",
            [$status]
        );
    } else {
        $requests = Database::query(
            "SELECT sr.*, p.first_name, p.last_name, p.system_id
             FROM ot_signup_requests sr
             LEFT JOIN profiles p ON p.user_id = sr.user_id
             ORDER BY sr.requested_at DESC"
        );
    }

    Response::success($requests);

} elseif ($method === 'PUT' || $method === 'PATCH') {
    if (!$requestId || !Validator::isUUID($requestId)) {
        Response::badRequest('Invalid request ID');
    }

    $request = Database::queryOne("SELECT * FROM ot_signup_requests WHERE id = ?", [$requestId]);
    if (!$request) {
        Response::notFound('Signup request not found');
    }

    if ($request['status'] !== 'pending') {
        Response::badRequest('Request has already been processed');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $inputAction = $input['action'] ?? null;

    if (!in_array($inputAction, ['approve', 'reject'])) {
        Response::badRequest('action must be "approve" or "reject"');
    }

    Database::beginTransaction();

    try {
        if ($inputAction === 'approve') {
            // Update user role from pending_ot to ot_admin
            Database::execute(
                "UPDATE user_roles SET role = 'ot_admin' WHERE user_id = ? AND role = 'pending_ot'",
                [$request['user_id']]
            );

            // Update request status
            Database::execute(
                "UPDATE ot_signup_requests SET status = 'approved', reviewed_at = NOW(), reviewed_by = ? WHERE id = ?",
                [$userId, $requestId]
            );

            Logger::info("OT signup approved: {$request['email']} by admin: {$userId}");

        } else {
            $reason = $input['rejection_reason'] ?? 'No reason provided';

            Database::execute(
                "UPDATE ot_signup_requests SET status = 'rejected', rejection_reason = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?",
                [$reason, $userId, $requestId]
            );

            Logger::info("OT signup rejected: {$request['email']} by admin: {$userId}");
        }

        Database::commit();

        $updated = Database::queryOne("SELECT * FROM ot_signup_requests WHERE id = ?", [$requestId]);

        Response::success($updated, "Request {$inputAction}d successfully");

    } catch (Exception $e) {
        Database::rollback();
        Logger::exception($e);
        Response::serverError('Failed to process request');
    }

} else {
    Response::methodNotAllowed('GET, PUT, PATCH, POST');
}
