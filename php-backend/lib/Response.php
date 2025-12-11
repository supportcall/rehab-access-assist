<?php
/**
 * API Response Helper Class
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    die('Direct access not permitted');
}

class Response {
    /**
     * Send a JSON success response
     */
    public static function success($data = null, int $statusCode = 200, string $message = 'Success'): void {
        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }

    /**
     * Send a JSON error response
     */
    public static function error(string $message, int $statusCode = 400, $errors = null): void {
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
     * Send a 401 Unauthorized response
     */
    public static function unauthorized(string $message = 'Unauthorized'): void {
        self::error($message, 401);
    }

    /**
     * Send a 403 Forbidden response
     */
    public static function forbidden(string $message = 'Forbidden'): void {
        self::error($message, 403);
    }

    /**
     * Send a 404 Not Found response
     */
    public static function notFound(string $message = 'Resource not found'): void {
        self::error($message, 404);
    }

    /**
     * Send a 422 Validation Error response
     */
    public static function validationError(array $errors, string $message = 'Validation failed'): void {
        self::error($message, 422, $errors);
    }

    /**
     * Send a 500 Server Error response
     */
    public static function serverError(string $message = 'Internal server error'): void {
        self::error($message, 500);
    }

    /**
     * Send raw JSON response
     */
    public static function json($data, int $statusCode = 200): void {
        // Set headers
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        
        // Encode and output
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Set CORS headers
     */
    public static function setCorsHeaders(): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Check if origin is allowed
        $allowedOrigins = defined('CORS_ALLOWED_ORIGINS') ? CORS_ALLOWED_ORIGINS : ['*'];
        
        if (in_array($origin, $allowedOrigins) || in_array('*', $allowedOrigins)) {
            header("Access-Control-Allow-Origin: {$origin}");
        }
        
        header('Access-Control-Allow-Methods: ' . (defined('CORS_ALLOWED_METHODS') ? CORS_ALLOWED_METHODS : 'GET, POST, PUT, PATCH, DELETE, OPTIONS'));
        header('Access-Control-Allow-Headers: ' . (defined('CORS_ALLOWED_HEADERS') ? CORS_ALLOWED_HEADERS : 'Content-Type, Authorization'));
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: ' . (defined('CORS_MAX_AGE') ? CORS_MAX_AGE : 86400));
    }

    /**
     * Handle preflight OPTIONS request
     */
    public static function handlePreflight(): void {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            self::setCorsHeaders();
            http_response_code(204);
            exit;
        }
    }
}
