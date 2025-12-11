<?php
/**
 * Lookup OT by System ID
 * GET /api/v1/profiles/lookup?system_id=OT-XXXXXX
 */

if ($method !== 'GET') {
    Response::methodNotAllowed('GET');
}

Auth::requireAuth();

$systemId = $_GET['system_id'] ?? null;

if (empty($systemId)) {
    Response::badRequest('system_id parameter is required');
}

// Validate format
if (!preg_match('/^OT-\d{6}$/', $systemId)) {
    Response::badRequest('Invalid system_id format');
}

try {
    // Look up profile by system ID
    $profile = Database::queryOne(
        "SELECT p.id, p.user_id, p.first_name, p.last_name, p.system_id,
                p.suburb, p.state, p.service_area_type, p.service_area_value
         FROM profiles p
         JOIN user_roles ur ON ur.user_id = p.user_id
         WHERE p.system_id = ? AND ur.role = 'ot_admin'",
        [$systemId]
    );

    if (!$profile) {
        Response::notFound('OT not found with this system ID');
    }

    Response::success([
        'id' => $profile['user_id'], // Return user_id for referral system
        'first_name' => $profile['first_name'],
        'last_name' => $profile['last_name'],
        'system_id' => $profile['system_id'],
        'suburb' => $profile['suburb'],
        'state' => $profile['state']
    ]);

} catch (Exception $e) {
    Logger::exception($e);
    Response::serverError('Lookup failed');
}
