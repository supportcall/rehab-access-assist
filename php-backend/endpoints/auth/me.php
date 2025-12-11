<?php
/**
 * Get Current User Endpoint
 * GET /api/v1/auth/me
 */

if ($method !== 'GET') {
    Response::methodNotAllowed('GET');
}

try {
    // Require authentication
    $userId = Auth::requireAuth();

    // Get user with profile
    $user = Database::queryOne(
        "SELECT u.id, u.email, u.email_confirmed, u.created_at, u.last_login,
                p.first_name, p.last_name, p.system_id, p.aphra_registration_number,
                p.mobile_number, p.phone, p.postal_code, p.suburb, p.state, p.country,
                p.service_area_type, p.service_area_value, p.service_radius_km
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.id = ? AND u.deleted_at IS NULL",
        [$userId]
    );

    if (!$user) {
        Response::notFound('User not found');
    }

    // Get user roles
    $roles = Database::query(
        "SELECT role FROM user_roles WHERE user_id = ?",
        [$userId]
    );
    $roleList = array_column($roles, 'role');

    // Check if pending approval
    $pendingApproval = null;
    if (in_array('pending_ot', $roleList)) {
        $request = Database::queryOne(
            "SELECT status, rejection_reason FROM ot_signup_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            [$userId]
        );
        if ($request) {
            $pendingApproval = [
                'status' => $request['status'],
                'rejection_reason' => $request['rejection_reason']
            ];
        }
    }

    Response::success([
        'id' => $user['id'],
        'email' => $user['email'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'system_id' => $user['system_id'],
        'aphra_registration_number' => $user['aphra_registration_number'],
        'mobile_number' => $user['mobile_number'],
        'phone' => $user['phone'],
        'postal_code' => $user['postal_code'],
        'suburb' => $user['suburb'],
        'state' => $user['state'],
        'country' => $user['country'],
        'service_area_type' => $user['service_area_type'],
        'service_area_value' => $user['service_area_value'],
        'service_radius_km' => $user['service_radius_km'],
        'roles' => $roleList,
        'email_confirmed' => (bool)$user['email_confirmed'],
        'created_at' => $user['created_at'],
        'last_login' => $user['last_login'],
        'pending_approval' => $pendingApproval
    ]);

} catch (Exception $e) {
    Logger::exception($e);
    Response::serverError('Failed to get user data');
}
