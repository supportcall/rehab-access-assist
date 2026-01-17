<?php
/**
 * Authentication Handler
 * Secure authentication with Argon2id, JWT, and session management
 */

namespace App\Core;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class Auth
{
    private static ?array $currentUser = null;
    private static ?array $currentRoles = null;
    
    // Token expiry times
    private const ACCESS_TOKEN_EXPIRY = 3600;       // 1 hour
    private const REFRESH_TOKEN_EXPIRY = 604800;    // 7 days
    
    /**
     * Get current authenticated user
     */
    public static function user(): ?array
    {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }
        
        $token = self::getBearerToken();
        if (!$token) {
            return null;
        }
        
        try {
            $config = require APP_ROOT . '/config/app.php';
            $decoded = JWT::decode($token, new Key($config['jwt']['secret'], 'HS256'));
            
            // Verify token type
            if ($decoded->type !== 'access') {
                return null;
            }
            
            // Get user from database
            $user = Database::queryOne(
                "SELECT * FROM users WHERE id = ? AND is_active = 1",
                [$decoded->sub]
            );
            
            if (!$user) {
                return null;
            }
            
            // Remove sensitive data
            unset($user['password_hash'], $user['mfa_secret'], $user['mfa_recovery_codes']);
            
            self::$currentUser = $user;
            return $user;
            
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get current user ID
     */
    public static function id(): ?string
    {
        return self::user()['id'] ?? null;
    }

    /**
     * Require authentication
     */
    public static function require(): array
    {
        $user = self::user();
        if (!$user) {
            Response::unauthorized('Authentication required');
        }
        return $user;
    }

    /**
     * Check if user has role
     */
    public static function hasRole(string $role, ?string $userId = null): bool
    {
        $userId = $userId ?? self::id();
        if (!$userId) {
            return false;
        }
        
        $result = Database::queryOne(
            "SELECT 1 FROM user_roles ur
             JOIN roles r ON ur.role_id = r.id
             WHERE ur.user_id = ? AND r.name = ? AND (ur.expires_at IS NULL OR ur.expires_at > NOW())",
            [$userId, $role]
        );
        
        return $result !== null;
    }

    /**
     * Get user roles
     */
    public static function roles(?string $userId = null): array
    {
        $userId = $userId ?? self::id();
        if (!$userId) {
            return [];
        }
        
        if ($userId === self::id() && self::$currentRoles !== null) {
            return self::$currentRoles;
        }
        
        $roles = Database::query(
            "SELECT r.name, r.display_name FROM user_roles ur
             JOIN roles r ON ur.role_id = r.id
             WHERE ur.user_id = ? AND (ur.expires_at IS NULL OR ur.expires_at > NOW())",
            [$userId]
        );
        
        $roleNames = array_column($roles, 'name');
        
        if ($userId === self::id()) {
            self::$currentRoles = $roleNames;
        }
        
        return $roleNames;
    }

    /**
     * Require specific role
     */
    public static function requireRole(string $role): array
    {
        $user = self::require();
        
        if (!self::hasRole($role)) {
            Response::forbidden("Role '{$role}' required");
        }
        
        return $user;
    }

    /**
     * Require any of the specified roles
     */
    public static function requireAnyRole(array $roles): array
    {
        $user = self::require();
        $userRoles = self::roles();
        
        foreach ($roles as $role) {
            if (in_array($role, $userRoles)) {
                return $user;
            }
        }
        
        Response::forbidden('Insufficient permissions');
        return []; // Never reached
    }

    /**
     * Check if user has permission
     */
    public static function hasPermission(string $permission, ?string $userId = null): bool
    {
        $userId = $userId ?? self::id();
        if (!$userId) {
            return false;
        }
        
        $result = Database::queryOne(
            "SELECT 1 FROM user_roles ur
             JOIN role_permissions rp ON ur.role_id = rp.role_id
             JOIN permissions p ON rp.permission_id = p.id
             WHERE ur.user_id = ? AND p.name = ? AND (ur.expires_at IS NULL OR ur.expires_at > NOW())",
            [$userId, $permission]
        );
        
        return $result !== null;
    }

    /**
     * Require specific permission
     */
    public static function requirePermission(string $permission): array
    {
        $user = self::require();
        
        if (!self::hasPermission($permission)) {
            Response::forbidden("Permission '{$permission}' required");
        }
        
        return $user;
    }

    /**
     * Hash password with Argon2id
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 3
        ]);
    }

    /**
     * Verify password
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Create access token
     */
    public static function createAccessToken(string $userId): string
    {
        $config = require APP_ROOT . '/config/app.php';
        
        $payload = [
            'iss' => $config['app']['url'],
            'sub' => $userId,
            'iat' => time(),
            'exp' => time() + self::ACCESS_TOKEN_EXPIRY,
            'type' => 'access'
        ];
        
        return JWT::encode($payload, $config['jwt']['secret'], 'HS256');
    }

    /**
     * Create refresh token
     */
    public static function createRefreshToken(string $userId): string
    {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        
        // Store in database
        Database::insert('sessions', [
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'ip_address' => self::getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'expires_at' => date('Y-m-d H:i:s', time() + self::REFRESH_TOKEN_EXPIRY)
        ]);
        
        return $token;
    }

    /**
     * Validate refresh token and return user ID
     */
    public static function validateRefreshToken(string $token): ?string
    {
        $tokenHash = hash('sha256', $token);
        
        $session = Database::queryOne(
            "SELECT user_id FROM sessions 
             WHERE token_hash = ? AND expires_at > NOW() AND is_revoked = 0",
            [$tokenHash]
        );
        
        if (!$session) {
            return null;
        }
        
        // Update last activity
        Database::execute(
            "UPDATE sessions SET last_activity = NOW() WHERE token_hash = ?",
            [$tokenHash]
        );
        
        return $session['user_id'];
    }

    /**
     * Revoke refresh token
     */
    public static function revokeRefreshToken(string $token): void
    {
        $tokenHash = hash('sha256', $token);
        Database::execute(
            "UPDATE sessions SET is_revoked = 1 WHERE token_hash = ?",
            [$tokenHash]
        );
    }

    /**
     * Revoke all user sessions
     */
    public static function revokeAllSessions(string $userId): void
    {
        Database::execute(
            "UPDATE sessions SET is_revoked = 1 WHERE user_id = ?",
            [$userId]
        );
    }

    /**
     * Login user
     */
    public static function login(string $email, string $password): ?array
    {
        // Check rate limit
        if (self::isRateLimited('login', self::getClientIP())) {
            Response::rateLimitExceeded();
        }
        
        $user = Database::queryOne(
            "SELECT * FROM users WHERE email = ?",
            [strtolower(trim($email))]
        );
        
        if (!$user) {
            self::incrementRateLimit('login', self::getClientIP());
            self::logSecurityEvent('login_failed', null, ['email' => $email, 'reason' => 'user_not_found']);
            return null;
        }
        
        // Check if account is locked
        if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
            self::logSecurityEvent('login_failed', $user['id'], ['reason' => 'account_locked']);
            return null;
        }
        
        // Verify password
        if (!self::verifyPassword($password, $user['password_hash'])) {
            // Increment failed attempts
            $attempts = $user['failed_login_attempts'] + 1;
            $lockUntil = $attempts >= 5 ? date('Y-m-d H:i:s', time() + 900) : null; // 15 min lock
            
            Database::execute(
                "UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?",
                [$attempts, $lockUntil, $user['id']]
            );
            
            self::incrementRateLimit('login', self::getClientIP());
            self::logSecurityEvent('login_failed', $user['id'], ['reason' => 'invalid_password', 'attempts' => $attempts]);
            
            return null;
        }
        
        // Check if account is active
        if (!$user['is_active']) {
            self::logSecurityEvent('login_failed', $user['id'], ['reason' => 'account_inactive']);
            return null;
        }
        
        // Reset failed attempts and update login info
        Database::execute(
            "UPDATE users SET failed_login_attempts = 0, locked_until = NULL, 
             last_login_at = NOW(), last_login_ip = ? WHERE id = ?",
            [self::getClientIP(), $user['id']]
        );
        
        // Generate tokens
        $accessToken = self::createAccessToken($user['id']);
        $refreshToken = self::createRefreshToken($user['id']);
        
        // Log successful login
        self::logSecurityEvent('login_success', $user['id']);
        self::resetRateLimit('login', self::getClientIP());
        
        // Remove sensitive data
        unset($user['password_hash'], $user['mfa_secret'], $user['mfa_recovery_codes']);
        
        return [
            'user' => $user,
            'roles' => self::roles($user['id']),
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in' => self::ACCESS_TOKEN_EXPIRY
        ];
    }

    /**
     * Register new user
     */
    public static function register(array $data): array
    {
        // Validate email uniqueness
        if (Database::exists('users', 'email', strtolower($data['email']))) {
            Response::error('Email already registered', 409);
        }
        
        // Create user
        $userId = Database::insert('users', [
            'email' => strtolower(trim($data['email'])),
            'password_hash' => self::hashPassword($data['password']),
            'email_verification_token' => bin2hex(random_bytes(32))
        ]);
        
        // Assign default role based on registration type
        $roleName = $data['role_type'] ?? 'client';
        
        // Map role types
        $roleMap = [
            'client' => 'client',
            'carer' => 'carer',
            'therapist' => 'therapist',
            'case_manager' => 'case_manager'
        ];
        
        $role = $roleMap[$roleName] ?? 'client';
        
        // Get role ID
        $roleData = Database::queryOne("SELECT id FROM roles WHERE name = ?", [$role]);
        
        if ($roleData) {
            Database::insert('user_roles', [
                'user_id' => $userId,
                'role_id' => $roleData['id'],
                'granted_by' => $userId // Self-granted on registration
            ]);
        }
        
        // Create profile based on role
        self::createProfile($userId, $data, $role);
        
        // Log event
        self::logAuditEvent('user.registered', 'users', $userId, null, [
            'email' => $data['email'],
            'role' => $role
        ]);
        
        // Auto-login after registration
        return self::login($data['email'], $data['password']);
    }

    /**
     * Create user profile based on role
     */
    private static function createProfile(string $userId, array $data, string $role): void
    {
        $profileData = [
            'user_id' => $userId,
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
        ];
        
        switch ($role) {
            case 'client':
            case 'carer':
                Database::insert('client_profiles', array_merge($profileData, [
                    'phone_mobile' => $data['phone'] ?? null,
                    'suburb' => $data['suburb'] ?? null,
                    'state' => $data['state'] ?? null,
                    'postcode' => $data['postcode'] ?? null
                ]));
                break;
                
            case 'therapist':
                Database::insert('therapist_profiles', array_merge($profileData, [
                    'profession' => $data['profession'] ?? 'occupational_therapist',
                    'ahpra_number' => $data['ahpra_number'] ?? null,
                    'phone_mobile' => $data['phone'] ?? null,
                    'suburb' => $data['suburb'] ?? null,
                    'state' => $data['state'] ?? null,
                    'postcode' => $data['postcode'] ?? null
                ]));
                break;
                
            case 'case_manager':
                Database::insert('case_manager_profiles', array_merge($profileData, [
                    'role_type' => $data['case_manager_type'] ?? 'case_manager',
                    'organization_name' => $data['organization'] ?? null,
                    'phone_mobile' => $data['phone'] ?? null,
                    'suburb' => $data['suburb'] ?? null,
                    'state' => $data['state'] ?? null,
                    'postcode' => $data['postcode'] ?? null
                ]));
                break;
        }
    }

    /**
     * Logout user
     */
    public static function logout(?string $refreshToken = null): void
    {
        $userId = self::id();
        
        if ($refreshToken) {
            self::revokeRefreshToken($refreshToken);
        } elseif ($userId) {
            // Revoke current session only
            self::revokeAllSessions($userId);
        }
        
        if ($userId) {
            self::logSecurityEvent('logout', $userId);
        }
    }

    /**
     * Request password reset
     */
    public static function requestPasswordReset(string $email): bool
    {
        $user = Database::queryOne("SELECT id FROM users WHERE email = ?", [strtolower($email)]);
        
        if (!$user) {
            // Return true anyway to prevent email enumeration
            return true;
        }
        
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour
        
        Database::execute(
            "UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?",
            [hash('sha256', $token), $expires, $user['id']]
        );
        
        // Queue email (handled by email service)
        Database::insert('outbound_emails', [
            'recipient_email' => $email,
            'subject' => 'Password Reset Request',
            'body_html' => self::getPasswordResetEmailHtml($token),
            'body_text' => "Reset your password: " . APP_URL . "/reset-password?token=" . $token,
            'priority' => 'high'
        ]);
        
        return true;
    }

    /**
     * Reset password with token
     */
    public static function resetPassword(string $token, string $newPassword): bool
    {
        $tokenHash = hash('sha256', $token);
        
        $user = Database::queryOne(
            "SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()",
            [$tokenHash]
        );
        
        if (!$user) {
            return false;
        }
        
        Database::execute(
            "UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?",
            [self::hashPassword($newPassword), $user['id']]
        );
        
        // Revoke all sessions
        self::revokeAllSessions($user['id']);
        
        self::logSecurityEvent('password_reset', $user['id']);
        
        return true;
    }

    /**
     * Get bearer token from request
     */
    private static function getBearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            return $matches[1];
        }
        
        return null;
    }

    /**
     * Get client IP address
     */
    public static function getClientIP(): string
    {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        
        // Handle comma-separated IPs
        if (strpos($ip, ',') !== false) {
            $ip = trim(explode(',', $ip)[0]);
        }
        
        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
    }

    /**
     * Check if rate limited
     */
    public static function isRateLimited(string $action, string $identifier, int $maxAttempts = 5, int $windowSeconds = 300): bool
    {
        $record = Database::queryOne(
            "SELECT attempts, blocked_until FROM rate_limits 
             WHERE identifier = ? AND action = ?",
            [$identifier, $action]
        );
        
        if (!$record) {
            return false;
        }
        
        if ($record['blocked_until'] && strtotime($record['blocked_until']) > time()) {
            return true;
        }
        
        return false;
    }

    /**
     * Increment rate limit counter
     */
    public static function incrementRateLimit(string $action, string $identifier, int $maxAttempts = 5, int $blockSeconds = 300): void
    {
        $record = Database::queryOne(
            "SELECT id, attempts FROM rate_limits WHERE identifier = ? AND action = ?",
            [$identifier, $action]
        );
        
        if ($record) {
            $attempts = $record['attempts'] + 1;
            $blockedUntil = $attempts >= $maxAttempts ? date('Y-m-d H:i:s', time() + $blockSeconds) : null;
            
            Database::execute(
                "UPDATE rate_limits SET attempts = ?, blocked_until = ? WHERE id = ?",
                [$attempts, $blockedUntil, $record['id']]
            );
        } else {
            Database::insert('rate_limits', [
                'identifier' => $identifier,
                'action' => $action,
                'attempts' => 1
            ]);
        }
    }

    /**
     * Reset rate limit
     */
    public static function resetRateLimit(string $action, string $identifier): void
    {
        Database::delete('rate_limits', 'identifier = ? AND action = ?', [$identifier, $action]);
    }

    /**
     * Log security event
     */
    public static function logSecurityEvent(string $eventType, ?string $userId = null, array $details = []): void
    {
        Database::insert('security_events', [
            'event_type' => $eventType,
            'user_id' => $userId,
            'ip_address' => self::getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'details' => json_encode($details),
            'severity' => in_array($eventType, ['login_failed', 'unauthorized_access', 'csrf_violation']) ? 'warning' : 'info'
        ]);
    }

    /**
     * Log audit event
     */
    public static function logAuditEvent(string $action, string $entityType, ?string $entityId = null, ?array $oldValues = null, ?array $newValues = null): void
    {
        Database::insert('audit_logs', [
            'user_id' => self::id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues ? json_encode($oldValues) : null,
            'new_values' => $newValues ? json_encode($newValues) : null,
            'ip_address' => self::getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    }

    /**
     * Get password reset email HTML
     */
    private static function getPasswordResetEmailHtml(string $token): string
    {
        $url = APP_URL . "/reset-password?token=" . $token;
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Password Reset Request</h2>
    <p>You have requested to reset your password. Click the button below to proceed:</p>
    <p style="text-align: center;">
        <a href="{$url}" style="display: inline-block; padding: 12px 24px; background-color: #00C090; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
    </p>
    <p>If you did not request this, please ignore this email.</p>
    <p>This link will expire in 1 hour.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #666; font-size: 12px;">Rehab Source - Australian OT + Physio Portal</p>
</body>
</html>
HTML;
    }
}
