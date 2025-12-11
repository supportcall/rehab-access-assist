<?php
/**
 * Authentication Helper Class
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    die('Direct access not permitted');
}

class Auth {
    private static ?array $user = null;
    private static ?string $role = null;

    /**
     * Authenticate user from JWT token in request
     * 
     * @return array|null User data or null if not authenticated
     */
    public static function authenticate(): ?array {
        // Get token from header
        $token = JWT::extractFromHeader();
        
        if (!$token) {
            return null;
        }

        // Decode and verify token
        $payload = JWT::decode($token);
        
        if (!$payload || !isset($payload['sub'])) {
            return null;
        }

        // Get user from database
        $user = Database::queryOne(
            "SELECT u.*, p.system_id, p.first_name, p.last_name, p.email as profile_email
             FROM users u
             LEFT JOIN profiles p ON p.id = u.id
             WHERE u.id = ?",
            [$payload['sub']]
        );

        if (!$user) {
            return null;
        }

        // Get user role
        $roleData = Database::queryOne(
            "SELECT role FROM user_roles WHERE user_id = ?",
            [$user['id']]
        );

        self::$user = $user;
        self::$role = $roleData['role'] ?? null;

        return $user;
    }

    /**
     * Require authentication - returns user or sends 401 response
     */
    public static function require(): array {
        $user = self::authenticate();
        
        if (!$user) {
            Response::unauthorized('Authentication required');
        }

        return $user;
    }

    /**
     * Require specific role
     */
    public static function requireRole(string|array $roles): array {
        $user = self::require();
        
        $roles = is_array($roles) ? $roles : [$roles];
        
        if (!in_array(self::$role, $roles)) {
            Response::forbidden('Insufficient permissions');
        }

        return $user;
    }

    /**
     * Require system admin role
     */
    public static function requireAdmin(): array {
        return self::requireRole('system_admin');
    }

    /**
     * Require OT admin role (or system admin)
     */
    public static function requireOT(): array {
        return self::requireRole(['ot_admin', 'system_admin']);
    }

    /**
     * Get current authenticated user
     */
    public static function user(): ?array {
        if (self::$user === null) {
            self::authenticate();
        }
        return self::$user;
    }

    /**
     * Get current user ID
     */
    public static function id(): ?string {
        $user = self::user();
        return $user['id'] ?? null;
    }

    /**
     * Get current user role
     */
    public static function role(): ?string {
        if (self::$role === null) {
            self::authenticate();
        }
        return self::$role;
    }

    /**
     * Check if user has specific role
     */
    public static function hasRole(string $role): bool {
        return self::role() === $role;
    }

    /**
     * Check if user is system admin
     */
    public static function isAdmin(): bool {
        return self::hasRole('system_admin');
    }

    /**
     * Check if user is OT admin
     */
    public static function isOT(): bool {
        return self::hasRole('ot_admin') || self::hasRole('system_admin');
    }

    /**
     * Hash a password
     */
    public static function hashPassword(string $password): string {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
    }

    /**
     * Verify a password
     */
    public static function verifyPassword(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }

    /**
     * Create JWT token for user
     */
    public static function createToken(string $userId): string {
        return JWT::encode([
            'sub' => $userId,
            'iat' => time(),
            'exp' => time() + (JWT_EXPIRY_HOURS * 3600)
        ]);
    }

    /**
     * Create refresh token and store in database
     */
    public static function createRefreshToken(string $userId): string {
        $token = JWT::generateRefreshToken();
        $tokenHash = hash('sha256', $token);
        $expiresAt = date('Y-m-d H:i:s', time() + (JWT_REFRESH_EXPIRY_DAYS * 86400));

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

        return $token;
    }

    /**
     * Validate refresh token and return user ID
     */
    public static function validateRefreshToken(string $token): ?string {
        $tokenHash = hash('sha256', $token);
        
        $session = Database::queryOne(
            "SELECT user_id FROM sessions 
             WHERE token_hash = ? AND expires_at > NOW()",
            [$tokenHash]
        );

        return $session['user_id'] ?? null;
    }

    /**
     * Revoke refresh token
     */
    public static function revokeRefreshToken(string $token): void {
        $tokenHash = hash('sha256', $token);
        Database::execute("DELETE FROM sessions WHERE token_hash = ?", [$tokenHash]);
    }

    /**
     * Revoke all refresh tokens for user
     */
    public static function revokeAllTokens(string $userId): void {
        Database::execute("DELETE FROM sessions WHERE user_id = ?", [$userId]);
    }

    /**
     * Clear expired sessions
     */
    public static function clearExpiredSessions(): int {
        return Database::execute("DELETE FROM sessions WHERE expires_at < NOW()");
    }
}
