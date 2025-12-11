<?php
/**
 * Login Endpoint
 * POST /api/v1/auth/login
 */

if ($method !== 'POST') {
    Response::methodNotAllowed('POST');
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
$rules = [
    'email' => ['required', 'email'],
    'password' => ['required', 'min:6']
];

$errors = Validator::validate($input ?? [], $rules);
if (!empty($errors)) {
    Response::badRequest('Validation failed', $errors);
}

$email = strtolower(trim($input['email']));
$password = $input['password'];

try {
    // Find user by email
    $user = Database::queryOne(
        "SELECT u.*, p.first_name, p.last_name, p.system_id, p.aphra_registration_number,
                p.mobile_number, p.phone, p.postal_code, p.suburb, p.state, p.country,
                p.service_area_type, p.service_area_value, p.service_radius_km
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.email = ? AND u.deleted_at IS NULL",
        [$email]
    );

    if (!$user) {
        Logger::warning("Login attempt for non-existent user: {$email}");
        Response::unauthorized('Invalid email or password');
    }

    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        Logger::warning("Failed login attempt for user: {$email}");
        Response::unauthorized('Invalid email or password');
    }

    // Check if email is confirmed
    if (!$user['email_confirmed']) {
        Response::forbidden('Please confirm your email address before logging in');
    }

    // Get user roles
    $roles = Database::query(
        "SELECT role FROM user_roles WHERE user_id = ?",
        [$user['id']]
    );
    $roleList = array_column($roles, 'role');

    // Check if user is pending_ot (not yet approved)
    if (in_array('pending_ot', $roleList) && !in_array('ot_admin', $roleList) && !in_array('system_admin', $roleList)) {
        // User is pending approval - still allow login but frontend will redirect
    }

    // Generate tokens
    $accessToken = JWT::generate([
        'user_id' => $user['id'],
        'email' => $user['email'],
        'roles' => $roleList
    ], 3600); // 1 hour

    $refreshToken = JWT::generateRefreshToken($user['id']);

    // Store refresh token
    $tokenHash = hash('sha256', $refreshToken);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
    
    Database::execute(
        "INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?)",
        [
            Database::generateUUID(),
            $user['id'],
            $tokenHash,
            $expiresAt,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]
    );

    // Update last login
    Database::execute(
        "UPDATE users SET last_login = NOW() WHERE id = ?",
        [$user['id']]
    );

    Logger::info("User logged in: {$email}");

    // Build user response (exclude sensitive data)
    $userData = [
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
        'created_at' => $user['created_at']
    ];

    Response::success([
        'user' => $userData,
        'access_token' => $accessToken,
        'refresh_token' => $refreshToken,
        'expires_in' => 3600
    ], 'Login successful');

} catch (Exception $e) {
    Logger::exception($e);
    Response::serverError('Login failed');
}
