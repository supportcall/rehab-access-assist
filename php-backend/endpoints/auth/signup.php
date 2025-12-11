<?php
/**
 * Signup Endpoint
 * POST /api/v1/auth/signup
 */

if ($method !== 'POST') {
    Response::methodNotAllowed('POST');
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
$rules = [
    'email' => ['required', 'email'],
    'password' => ['required', 'min:8'],
    'first_name' => ['required', 'min:1', 'max:100'],
    'last_name' => ['required', 'min:1', 'max:100']
];

$errors = Validator::validate($input ?? [], $rules);
if (!empty($errors)) {
    Response::badRequest('Validation failed', $errors);
}

$email = strtolower(trim($input['email']));
$password = $input['password'];
$firstName = trim($input['first_name']);
$lastName = trim($input['last_name']);

// Additional password validation
if (!preg_match('/[A-Z]/', $password)) {
    Response::badRequest('Password must contain at least one uppercase letter');
}
if (!preg_match('/[a-z]/', $password)) {
    Response::badRequest('Password must contain at least one lowercase letter');
}
if (!preg_match('/[0-9]/', $password)) {
    Response::badRequest('Password must contain at least one number');
}

try {
    // Check if email already exists
    $existing = Database::queryOne(
        "SELECT id FROM users WHERE email = ?",
        [$email]
    );

    if ($existing) {
        Response::conflict('An account with this email already exists');
    }

    // Start transaction
    Database::beginTransaction();

    // Create user
    $userId = Database::generateUUID();
    $passwordHash = password_hash($password, PASSWORD_ARGON2ID);
    
    // For production, set email_verified_at based on AUTO_CONFIRM_EMAIL setting
    $emailVerifiedAt = defined('AUTO_CONFIRM_EMAIL') && AUTO_CONFIRM_EMAIL ? 'NOW()' : 'NULL';

    Database::execute(
        "INSERT INTO users (id, email, password_hash, first_name, last_name, email_verified_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, " . (defined('AUTO_CONFIRM_EMAIL') && AUTO_CONFIRM_EMAIL ? "NOW()" : "NULL") . ", NOW(), NOW())",
        [$userId, $email, $passwordHash, $firstName, $lastName]
    );

    // Generate system ID for profile
    $systemId = generateSystemId('OT');

    // Create profile (profile.id = user.id)
    Database::execute(
        "INSERT INTO profiles (id, first_name, last_name, email, system_id, country, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'Australia', NOW(), NOW())",
        [$userId, $firstName, $lastName, $email, $systemId]
    );

    // Determine role - first 2 users become system_admin, others become pending_ot
    $userCount = Database::count('users', '1=1');
    $role = ($userCount <= 2) ? 'system_admin' : 'pending_ot';

    // Assign role
    Database::execute(
        "INSERT INTO user_roles (id, user_id, role, created_at)
         VALUES (?, ?, ?, NOW())",
        [Database::generateUUID(), $userId, $role]
    );

    // If pending_ot, create signup request
    if ($role === 'pending_ot') {
        Database::execute(
            "INSERT INTO ot_signup_requests (id, user_id, email, first_name, last_name, status, requested_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW(), NOW())",
            [Database::generateUUID(), $userId, $email, $firstName, $lastName]
        );
    }

    Database::commit();

    Logger::info("New user registered: {$email} with role: {$role}");

    // If email confirmation is required, send confirmation email
    $emailConfirmed = defined('AUTO_CONFIRM_EMAIL') && AUTO_CONFIRM_EMAIL;
    if (!$emailConfirmed) {
        // TODO: Implement email sending
        Response::success([
            'message' => 'Account created. Please check your email to confirm your account.',
            'requires_confirmation' => true
        ], 'Signup successful', 201);
    }

    // Auto-login if email is confirmed
    $accessToken = JWT::generate([
        'user_id' => $userId,
        'email' => $email,
        'roles' => [$role]
    ], 3600);

    $refreshToken = JWT::generateRefreshToken($userId);

    // Store refresh token
    $tokenHash = hash('sha256', $refreshToken);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
    
    Database::execute(
        "INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?)",
        [
            Database::generateUUID(),
            $userId,
            $tokenHash,
            $expiresAt,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]
    );

    Response::success([
        'user' => [
            'id' => $userId,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'system_id' => $systemId,
            'roles' => [$role],
            'email_confirmed' => (bool)$emailConfirmed
        ],
        'access_token' => $accessToken,
        'refresh_token' => $refreshToken,
        'expires_in' => 3600,
        'is_first_user' => $role === 'system_admin'
    ], 'Account created successfully', 201);

} catch (Exception $e) {
    Database::rollback();
    Logger::exception($e);
    Response::serverError('Signup failed');
}

/**
 * Generate unique system ID
 */
function generateSystemId(string $prefix): string {
    $maxAttempts = 10;
    for ($i = 0; $i < $maxAttempts; $i++) {
        $id = $prefix . '-' . str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Check if exists in profiles or clients
        $existsProfile = Database::exists('profiles', 'system_id', $id);
        $existsClient = Database::exists('clients', 'system_id', $id);
        
        if (!$existsProfile && !$existsClient) {
            return $id;
        }
    }
    
    // Fallback with timestamp
    return $prefix . '-' . substr(time(), -6);
}
