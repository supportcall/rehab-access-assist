<?php
/**
 * Refresh Token Endpoint
 * POST /api/v1/auth/refresh
 */

if ($method !== 'POST') {
    Response::methodNotAllowed('POST');
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['refresh_token'])) {
    Response::badRequest('Refresh token is required');
}

$refreshToken = $input['refresh_token'];

try {
    // Verify refresh token format
    $payload = JWT::verifyRefreshToken($refreshToken);
    
    if (!$payload || !isset($payload['user_id'])) {
        Response::unauthorized('Invalid refresh token');
    }

    $userId = $payload['user_id'];
    $tokenHash = hash('sha256', $refreshToken);

    // Check if session exists and is valid
    $session = Database::queryOne(
        "SELECT * FROM sessions WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()",
        [$userId, $tokenHash]
    );

    if (!$session) {
        Response::unauthorized('Invalid or expired refresh token');
    }

    // Get user data
    $user = Database::queryOne(
        "SELECT u.*, p.first_name, p.last_name, p.system_id
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.id = ? AND u.deleted_at IS NULL",
        [$userId]
    );

    if (!$user) {
        // User was deleted, remove session
        Database::execute("DELETE FROM sessions WHERE user_id = ?", [$userId]);
        Response::unauthorized('User not found');
    }

    // Get user roles
    $roles = Database::query(
        "SELECT role FROM user_roles WHERE user_id = ?",
        [$userId]
    );
    $roleList = array_column($roles, 'role');

    // Generate new access token
    $newAccessToken = JWT::generate([
        'user_id' => $userId,
        'email' => $user['email'],
        'roles' => $roleList
    ], 3600);

    // Optionally rotate refresh token (more secure)
    $newRefreshToken = JWT::generateRefreshToken($userId);
    $newTokenHash = hash('sha256', $newRefreshToken);
    $newExpiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

    // Update session with new refresh token
    Database::execute(
        "UPDATE sessions SET token_hash = ?, expires_at = ?, updated_at = NOW() WHERE id = ?",
        [$newTokenHash, $newExpiresAt, $session['id']]
    );

    Logger::info("Token refreshed for user: {$userId}");

    Response::success([
        'access_token' => $newAccessToken,
        'refresh_token' => $newRefreshToken,
        'expires_in' => 3600
    ], 'Token refreshed');

} catch (Exception $e) {
    Logger::exception($e);
    Response::unauthorized('Token refresh failed');
}
