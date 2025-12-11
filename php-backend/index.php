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

// Simple router
try {
    $routeParams = [];

    // Static routes
    $routes = [
        '/auth/login' => 'auth/login.php',
        '/auth/signup' => 'auth/signup.php',
        '/auth/logout' => 'auth/logout.php',
        '/auth/me' => 'auth/me.php',
        '/auth/refresh' => 'auth/refresh.php',
        '/profiles/me' => 'profiles/me.php',
        '/profiles/lookup' => 'profiles/lookup.php',
        '/clients' => 'clients/index.php',
        '/assessments' => 'assessments/index.php',
        '/referrals' => 'referrals/index.php',
        '/admin/signup-requests' => 'admin/signup-requests.php',
        '/admin/settings' => 'admin/settings.php',
        '/uploads' => 'uploads/index.php',
    ];

    if (isset($routes[$uri])) {
        require_once APP_ROOT . '/endpoints/' . $routes[$uri];
        exit;
    }

    // Parameterized routes
    // /clients/{id}
    if (preg_match('#^/clients/([a-f0-9-]{36})$#', $uri, $m)) {
        $routeParams['id'] = $m[1];
        require_once APP_ROOT . '/endpoints/clients/single.php';
        exit;
    }

    // /assessments/{id}
    if (preg_match('#^/assessments/([a-f0-9-]{36})$#', $uri, $m)) {
        $routeParams['id'] = $m[1];
        require_once APP_ROOT . '/endpoints/assessments/single.php';
        exit;
    }

    // /assessments/{id}/subtables
    $subtables = ['pre_visit_details','stakeholders','funding_pathway','clinical_assessment','at_audit','site_survey','structural_reconnaissance','builder_collaboration','deliverables'];
    if (preg_match('#^/assessments/([a-f0-9-]{36})/(' . implode('|', $subtables) . ')$#', $uri, $m)) {
        $routeParams['assessment_id'] = $m[1];
        $routeParams['table'] = $m[2];
        require_once APP_ROOT . '/endpoints/assessments/subtable.php';
        exit;
    }

    // /assessments/{id}/environmental_areas, measurements, risks_controls, etc.
    $arrayTables = ['environmental_areas','measurements','risks_controls','options_analysis','compliance_checklist','technical_drawings'];
    if (preg_match('#^/assessments/([a-f0-9-]{36})/(' . implode('|', $arrayTables) . ')(?:/([a-f0-9-]{36}))?$#', $uri, $m)) {
        $routeParams['assessment_id'] = $m[1];
        $routeParams['id'] = $m[3] ?? null;
        require_once APP_ROOT . '/endpoints/assessments/' . $m[2] . '.php';
        exit;
    }

    // /admin/signup-requests/{id}
    if (preg_match('#^/admin/signup-requests/([a-f0-9-]{36})$#', $uri, $m)) {
        $routeParams['id'] = $m[1];
        require_once APP_ROOT . '/endpoints/admin/signup-requests.php';
        exit;
    }

    // /admin/signup-requests/{id}/approve
    if (preg_match('#^/admin/signup-requests/([a-f0-9-]{36})/approve$#', $uri, $m)) {
        $routeParams['id'] = $m[1];
        $routeParams['action'] = 'approve';
        require_once APP_ROOT . '/endpoints/admin/signup-requests.php';
        exit;
    }

    // /admin/signup-requests/{id}/reject
    if (preg_match('#^/admin/signup-requests/([a-f0-9-]{36})/reject$#', $uri, $m)) {
        $routeParams['id'] = $m[1];
        $routeParams['action'] = 'reject';
        require_once APP_ROOT . '/endpoints/admin/signup-requests.php';
        exit;
    }

    // /admin/settings/{key}
    if (preg_match('#^/admin/settings/([a-zA-Z0-9_-]+)$#', $uri, $m)) {
        $routeParams['key'] = $m[1];
        require_once APP_ROOT . '/endpoints/admin/settings.php';
        exit;
    }

    // /referrals/{id}
    if (preg_match('#^/referrals/([a-f0-9-]{36})$#', $uri, $m)) {
        $routeParams['id'] = $m[1];
        require_once APP_ROOT . '/endpoints/referrals/index.php';
        exit;
    }

    Response::notFound('Endpoint not found');

} catch (Exception $e) {
    Logger::exception($e);
    Response::serverError(APP_DEBUG ? $e->getMessage() : 'Internal server error');
}
