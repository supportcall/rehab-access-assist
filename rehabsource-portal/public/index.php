<?php
/**
 * Rehab Source Portal - Front Controller
 * 
 * All requests are routed through this file.
 * 
 * @package RehabSource
 * @version 1.0.0
 */

declare(strict_types=1);

// Define application root
define('APP_ROOT', dirname(__DIR__));
define('PUBLIC_ROOT', __DIR__);
define('APP_START', microtime(true));

// Error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Load Composer autoloader
require APP_ROOT . '/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(APP_ROOT);
$dotenv->safeLoad();

// Load configuration
$config = require APP_ROOT . '/config/app.php';

// Set timezone
date_default_timezone_set($config['timezone'] ?? 'Australia/Sydney');

// Initialize application
use RehabSource\Core\Application;
use RehabSource\Core\Router;
use RehabSource\Core\Request;
use RehabSource\Core\Response;
use RehabSource\Middleware\SecurityHeaders;
use RehabSource\Middleware\RateLimiter;
use RehabSource\Middleware\CsrfProtection;
use RehabSource\Middleware\Authentication;

try {
    // Create application instance
    $app = new Application($config);
    
    // Register middleware stack
    $app->middleware([
        SecurityHeaders::class,
        RateLimiter::class,
        CsrfProtection::class,
        Authentication::class,
    ]);
    
    // Create request from globals
    $request = Request::createFromGlobals();
    
    // Load routes
    require APP_ROOT . '/config/routes.php';
    
    // Dispatch request
    $response = $app->handle($request);
    
    // Send response
    $response->send();
    
} catch (Throwable $e) {
    // Log the error
    error_log(sprintf(
        "[%s] %s in %s:%d\nStack trace:\n%s",
        date('Y-m-d H:i:s'),
        $e->getMessage(),
        $e->getFile(),
        $e->getLine(),
        $e->getTraceAsString()
    ));
    
    // Return appropriate error response
    $isDebug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
    
    if ($request->isApi()) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'INTERNAL_ERROR',
                'message' => $isDebug ? $e->getMessage() : 'An internal error occurred',
            ]
        ]);
    } else {
        http_response_code(500);
        if ($isDebug) {
            echo "<h1>Error</h1><pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
            echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
        } else {
            include APP_ROOT . '/templates/errors/500.html';
        }
    }
}
