<?php
/**
 * Profile Endpoints
 * GET /api/v1/profiles/me - Get current user profile
 * PUT /api/v1/profiles/me - Update current user profile
 */

$userId = Auth::requireAuth();

if ($method === 'GET') {
    // Get profile
    $profile = Database::queryOne(
        "SELECT p.*, u.email as user_email
         FROM profiles p
         JOIN users u ON u.id = p.user_id
         WHERE p.user_id = ?",
        [$userId]
    );

    if (!$profile) {
        Response::notFound('Profile not found');
    }

    // Get roles
    $roles = Database::query(
        "SELECT role FROM user_roles WHERE user_id = ?",
        [$userId]
    );

    Response::success([
        'id' => $profile['id'],
        'user_id' => $profile['user_id'],
        'email' => $profile['user_email'],
        'first_name' => $profile['first_name'],
        'last_name' => $profile['last_name'],
        'system_id' => $profile['system_id'],
        'aphra_registration_number' => $profile['aphra_registration_number'],
        'mobile_number' => $profile['mobile_number'],
        'phone' => $profile['phone'],
        'postal_code' => $profile['postal_code'],
        'suburb' => $profile['suburb'],
        'state' => $profile['state'],
        'country' => $profile['country'],
        'service_area_type' => $profile['service_area_type'],
        'service_area_value' => $profile['service_area_value'],
        'service_radius_km' => $profile['service_radius_km'],
        'roles' => array_column($roles, 'role'),
        'created_at' => $profile['created_at'],
        'updated_at' => $profile['updated_at']
    ]);

} elseif ($method === 'PUT' || $method === 'PATCH') {
    // Update profile
    $input = json_decode(file_get_contents('php://input'), true);

    // Allowed fields to update
    $allowedFields = [
        'first_name', 'last_name', 'aphra_registration_number',
        'mobile_number', 'phone', 'postal_code', 'suburb', 'state', 'country',
        'service_area_type', 'service_area_value', 'service_radius_km'
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

    $params[] = $userId;

    Database::execute(
        "UPDATE profiles SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE user_id = ?",
        $params
    );

    // Return updated profile
    $profile = Database::queryOne(
        "SELECT * FROM profiles WHERE user_id = ?",
        [$userId]
    );

    Logger::info("Profile updated for user: {$userId}");

    Response::success($profile, 'Profile updated successfully');

} else {
    Response::methodNotAllowed('GET, PUT, PATCH');
}
