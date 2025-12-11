<?php
/**
 * OT & Physio Assessment Portal - API Entry Point
 * 
 * All API requests are routed through this file
 */

// Define app root
define('APP_ROOT', __DIR__);

// Load configuration
require_once APP_ROOT . '/config/config.php';

// Load core libraries
require_once APP_ROOT . '/lib/Logger.php';
require_once APP_ROOT . '/config/database.php';
require_once APP_ROOT . '/lib/Response.php';
require_once APP_ROOT . '/lib/JWT.php';
require_once APP_ROOT . '/lib/Validator.php';
require_once APP_ROOT . '/lib/Auth.php';

// Handle CORS
Response::setCorsHeaders();
Response::handlePreflight();

// Get request info
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Remove base path if present
$basePath = '/api/v1';
if (strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}

// Simple router - load appropriate endpoint file
try {
    // Route to appropriate handler
    $routes = [
        '/auth/login' => 'auth/login.php',
        '/auth/signup' => 'auth/signup.php',
        '/auth/logout' => 'auth/logout.php',
        '/auth/me' => 'auth/me.php',
        '/auth/refresh' => 'auth/refresh.php',
        // More routes will be added in Phase 2-5
    ];

    // Check for exact match first
    if (isset($routes[$uri])) {
        require_once APP_ROOT . '/endpoints/' . $routes[$uri];
        exit;
    }

    // Check for parameterized routes (e.g., /clients/{id})
    // This will be expanded in later phases

    // 404 if no route matched
    Response::notFound('Endpoint not found');

} catch (Exception $e) {
    Logger::exception($e);
    Response::serverError(APP_DEBUG ? $e->getMessage() : 'Internal server error');
}
