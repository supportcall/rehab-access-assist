<?php
/**
 * JWT (JSON Web Token) Handler
 * 
 * Simple JWT implementation for authentication
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    die('Direct access not permitted');
}

class JWT {
    /**
     * Encode payload to JWT
     */
    public static function encode(array $payload): string {
        // Header
        $header = [
            'alg' => JWT_ALGORITHM,
            'typ' => 'JWT'
        ];

        // Add standard claims if not present
        if (!isset($payload['iat'])) {
            $payload['iat'] = time();
        }
        if (!isset($payload['exp'])) {
            $payload['exp'] = time() + (JWT_EXPIRY_HOURS * 3600);
        }

        // Encode header and payload
        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        // Create signature
        $signature = self::sign("{$headerEncoded}.{$payloadEncoded}");
        $signatureEncoded = self::base64UrlEncode($signature);

        return "{$headerEncoded}.{$payloadEncoded}.{$signatureEncoded}";
    }

    /**
     * Decode and verify JWT
     * 
     * @return array|false Returns payload array or false if invalid
     */
    public static function decode(string $token): array|false {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            Logger::warning('JWT decode failed: Invalid token format');
            return false;
        }

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

        // Verify signature
        $expectedSignature = self::sign("{$headerEncoded}.{$payloadEncoded}");
        $actualSignature = self::base64UrlDecode($signatureEncoded);

        if (!hash_equals($expectedSignature, $actualSignature)) {
            Logger::warning('JWT decode failed: Invalid signature');
            return false;
        }

        // Decode payload
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);

        if ($payload === null) {
            Logger::warning('JWT decode failed: Invalid payload');
            return false;
        }

        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            Logger::debug('JWT decode failed: Token expired');
            return false;
        }

        return $payload;
    }

    /**
     * Create signature using HMAC-SHA256
     */
    private static function sign(string $data): string {
        return hash_hmac('sha256', $data, JWT_SECRET, true);
    }

    /**
     * Base64 URL-safe encode
     */
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL-safe decode
     */
    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Generate a secure refresh token
     */
    public static function generateRefreshToken(): string {
        return bin2hex(random_bytes(32));
    }

    /**
     * Extract token from Authorization header
     */
    public static function extractFromHeader(): ?string {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        // Try Apache-specific header if standard one is empty
        if (empty($authHeader) && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }
        
        // Also check for custom header
        if (empty($authHeader)) {
            $authHeader = $_SERVER['HTTP_X_AUTHORIZATION'] ?? '';
        }

        if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
