<?php
/**
 * CSRF Protection
 * Token-based CSRF protection for state-changing requests
 */

namespace App\Core;

class CSRF
{
    private const TOKEN_EXPIRY = 3600; // 1 hour
    private const TOKEN_HEADER = 'X-CSRF-Token';

    /**
     * Generate CSRF token
     */
    public static function generate(?string $sessionId = null): string
    {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        
        // Get or create session ID
        if (!$sessionId) {
            $sessionId = self::getSessionId();
        }
        
        if (!$sessionId) {
            // Create a temporary session for non-authenticated requests
            $sessionId = Database::generateUUID();
        }
        
        // Store token
        Database::insert('csrf_tokens', [
            'session_id' => $sessionId,
            'token_hash' => $tokenHash,
            'expires_at' => date('Y-m-d H:i:s', time() + self::TOKEN_EXPIRY)
        ]);
        
        return $token;
    }

    /**
     * Validate CSRF token
     */
    public static function validate(?string $token = null): bool
    {
        // Get token from header or parameter
        $token = $token ?? self::getTokenFromRequest();
        
        if (!$token) {
            return false;
        }
        
        $tokenHash = hash('sha256', $token);
        
        // Check token exists and is valid
        $record = Database::queryOne(
            "SELECT id FROM csrf_tokens 
             WHERE token_hash = ? AND expires_at > NOW() AND used_at IS NULL",
            [$tokenHash]
        );
        
        if (!$record) {
            return false;
        }
        
        // Mark token as used (one-time use)
        Database::execute(
            "UPDATE csrf_tokens SET used_at = NOW() WHERE id = ?",
            [$record['id']]
        );
        
        return true;
    }

    /**
     * Require valid CSRF token
     */
    public static function require(): void
    {
        // Skip for safe methods
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'])) {
            return;
        }
        
        if (!self::validate()) {
            Auth::logSecurityEvent('csrf_violation', Auth::id());
            Response::error('Invalid or expired CSRF token', 403);
        }
    }

    /**
     * Get token from request
     */
    private static function getTokenFromRequest(): ?string
    {
        // Check header first
        $headers = getallheaders();
        if (isset($headers[self::TOKEN_HEADER])) {
            return $headers[self::TOKEN_HEADER];
        }
        
        // Check POST data
        if (isset($_POST['_csrf_token'])) {
            return $_POST['_csrf_token'];
        }
        
        // Check JSON body
        $input = file_get_contents('php://input');
        if ($input) {
            $data = json_decode($input, true);
            if (isset($data['_csrf_token'])) {
                return $data['_csrf_token'];
            }
        }
        
        return null;
    }

    /**
     * Get current session ID
     */
    private static function getSessionId(): ?string
    {
        $token = self::getBearerToken();
        if (!$token) {
            return null;
        }
        
        // For JWT tokens, use the user ID as session reference
        return Auth::id();
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
     * Clean up expired tokens
     */
    public static function cleanup(): int
    {
        return Database::execute("DELETE FROM csrf_tokens WHERE expires_at < NOW()");
    }

    /**
     * Generate HTML hidden input with token
     */
    public static function field(): string
    {
        $token = self::generate();
        return '<input type="hidden" name="_csrf_token" value="' . htmlspecialchars($token) . '">';
    }

    /**
     * Get meta tag for JavaScript access
     */
    public static function meta(): string
    {
        $token = self::generate();
        return '<meta name="csrf-token" content="' . htmlspecialchars($token) . '">';
    }
}
