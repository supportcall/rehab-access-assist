<?php
/**
 * HTTP Response Handler
 * Standardized JSON responses with security headers
 */

namespace App\Core;

class Response
{
    /**
     * Send JSON response
     */
    public static function json($data, int $statusCode = 200): void
    {
        self::setSecurityHeaders();
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send success response
     */
    public static function success($data = null, string $message = 'Success', int $statusCode = 200): void
    {
        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }

    /**
     * Send error response
     */
    public static function error(string $message, int $statusCode = 400, $errors = null): void
    {
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        
        self::json($response, $statusCode);
    }

    /**
     * Send validation error response
     */
    public static function validationError(array $errors): void
    {
        self::error('Validation failed', 422, $errors);
    }

    /**
     * Send unauthorized response
     */
    public static function unauthorized(string $message = 'Unauthorized'): void
    {
        self::error($message, 401);
    }

    /**
     * Send forbidden response
     */
    public static function forbidden(string $message = 'Forbidden'): void
    {
        self::error($message, 403);
    }

    /**
     * Send not found response
     */
    public static function notFound(string $message = 'Not found'): void
    {
        self::error($message, 404);
    }

    /**
     * Send rate limit exceeded response
     */
    public static function rateLimitExceeded(int $retryAfter = 60): void
    {
        header("Retry-After: {$retryAfter}");
        self::error('Too many requests. Please try again later.', 429);
    }

    /**
     * Send server error response
     */
    public static function serverError(string $message = 'Internal server error'): void
    {
        self::error($message, 500);
    }

    /**
     * Set security headers
     */
    private static function setSecurityHeaders(): void
    {
        // Prevent clickjacking
        header('X-Frame-Options: DENY');
        
        // Prevent MIME type sniffing
        header('X-Content-Type-Options: nosniff');
        
        // Enable XSS filter
        header('X-XSS-Protection: 1; mode=block');
        
        // Referrer policy
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Content Security Policy
        header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self'");
        
        // Permissions Policy
        header("Permissions-Policy: camera=(), microphone=(), geolocation=()");
        
        // HSTS (only in production)
        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
    }

    /**
     * Send file download response
     */
    public static function download(string $filePath, string $fileName, string $mimeType = 'application/octet-stream'): void
    {
        if (!file_exists($filePath)) {
            self::notFound('File not found');
        }
        
        self::setSecurityHeaders();
        
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: private, max-age=0, must-revalidate');
        
        readfile($filePath);
        exit;
    }

    /**
     * Send file inline response (for viewing)
     */
    public static function inline(string $filePath, string $mimeType): void
    {
        if (!file_exists($filePath)) {
            self::notFound('File not found');
        }
        
        self::setSecurityHeaders();
        
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: inline');
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: private, max-age=3600');
        
        readfile($filePath);
        exit;
    }
}
