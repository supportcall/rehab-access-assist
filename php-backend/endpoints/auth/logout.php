<?php
/**
 * Logout Endpoint
 * POST /api/v1/auth/logout
 */

if ($method !== 'POST') {
    Response::methodNotAllowed('POST');
}

try {
    // Get authorization header
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader)) {
        // Already logged out or no session
        Response::success(null, 'Logged out successfully');
    }

    // Extract token
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        
        // Verify and decode token to get user_id
        $payload = JWT::verify($token);
        
        if ($payload && isset($payload['user_id'])) {
            // Get refresh token from body if provided
            $input = json_decode(file_get_contents('php://input'), true);
            $refreshToken = $input['refresh_token'] ?? null;
            
            if ($refreshToken) {
                // Invalidate specific session
                $tokenHash = hash('sha256', $refreshToken);
                Database::execute(
                    "DELETE FROM sessions WHERE user_id = ? AND token_hash = ?",
                    [$payload['user_id'], $tokenHash]
                );
            } else {
                // Invalidate all sessions for this user (logout everywhere)
                Database::execute(
                    "DELETE FROM sessions WHERE user_id = ?",
                    [$payload['user_id']]
                );
            }
            
            Logger::info("User logged out: {$payload['user_id']}");
        }
    }

    Response::success(null, 'Logged out successfully');

} catch (Exception $e) {
    // Even if token is invalid, consider it logged out
    Logger::warning("Logout with invalid token: " . $e->getMessage());
    Response::success(null, 'Logged out successfully');
}
