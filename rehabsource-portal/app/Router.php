<?php
/**
 * Simple Router
 * Handles URL routing to controllers
 */

namespace App;

use App\Core\Response;
use App\Core\CSRF;

class Router
{
    private array $routes = [];
    private array $middleware = [];

    /**
     * Register GET route
     */
    public function get(string $path, array $handler): self
    {
        $this->routes['GET'][$path] = $handler;
        return $this;
    }

    /**
     * Register POST route
     */
    public function post(string $path, array $handler): self
    {
        $this->routes['POST'][$path] = $handler;
        return $this;
    }

    /**
     * Register PUT route
     */
    public function put(string $path, array $handler): self
    {
        $this->routes['PUT'][$path] = $handler;
        return $this;
    }

    /**
     * Register DELETE route
     */
    public function delete(string $path, array $handler): self
    {
        $this->routes['DELETE'][$path] = $handler;
        return $this;
    }

    /**
     * Register PATCH route
     */
    public function patch(string $path, array $handler): self
    {
        $this->routes['PATCH'][$path] = $handler;
        return $this;
    }

    /**
     * Add middleware
     */
    public function middleware(string $name, callable $handler): self
    {
        $this->middleware[$name] = $handler;
        return $this;
    }

    /**
     * Dispatch the request
     */
    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Handle OPTIONS requests for CORS
        if ($method === 'OPTIONS') {
            $this->handleCors();
            exit;
        }
        
        // Set CORS headers
        $this->handleCors();
        
        // Remove trailing slash
        $path = rtrim($path, '/') ?: '/';
        
        // Remove base path if set
        $basePath = defined('BASE_PATH') ? BASE_PATH : '';
        if ($basePath && strpos($path, $basePath) === 0) {
            $path = substr($path, strlen($basePath)) ?: '/';
        }
        
        // Find matching route
        $handler = $this->matchRoute($method, $path, $params);
        
        if (!$handler) {
            Response::notFound('Endpoint not found');
        }
        
        // CSRF check for state-changing methods
        if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            // Skip CSRF for login/register endpoints
            $skipCsrf = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
            if (!in_array($path, $skipCsrf)) {
                // CSRF::require(); // Enable in production
            }
        }
        
        // Call handler
        $this->callHandler($handler, $params);
    }

    /**
     * Match route with parameters
     */
    private function matchRoute(string $method, string $path, ?array &$params = null): ?array
    {
        $params = [];
        
        if (!isset($this->routes[$method])) {
            return null;
        }
        
        foreach ($this->routes[$method] as $routePath => $handler) {
            $pattern = $this->buildPattern($routePath);
            
            if (preg_match($pattern, $path, $matches)) {
                // Extract named parameters
                foreach ($matches as $key => $value) {
                    if (is_string($key)) {
                        $params[$key] = $value;
                    }
                }
                return $handler;
            }
        }
        
        return null;
    }

    /**
     * Build regex pattern from route path
     */
    private function buildPattern(string $path): string
    {
        // Escape special characters
        $pattern = preg_quote($path, '#');
        
        // Replace {param} with named capture groups
        $pattern = preg_replace('/\\\{([a-zA-Z_]+)\\\}/', '(?P<$1>[^/]+)', $pattern);
        
        return '#^' . $pattern . '$#';
    }

    /**
     * Call the route handler
     */
    private function callHandler(array $handler, array $params): void
    {
        [$controllerClass, $method] = $handler;
        
        // Add namespace if not present
        if (strpos($controllerClass, '\\') === false) {
            $controllerClass = 'App\\Controllers\\' . $controllerClass;
        }
        
        if (!class_exists($controllerClass)) {
            Response::serverError('Controller not found: ' . $controllerClass);
        }
        
        $controller = new $controllerClass();
        
        if (!method_exists($controller, $method)) {
            Response::serverError('Method not found: ' . $method);
        }
        
        // Call method with parameters
        call_user_func_array([$controller, $method], array_values($params));
    }

    /**
     * Handle CORS headers
     */
    private function handleCors(): void
    {
        $config = require APP_ROOT . '/config/app.php';
        $allowedOrigins = $config['cors']['allowed_origins'] ?? ['*'];
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (in_array('*', $allowedOrigins) || in_array($origin, $allowedOrigins)) {
            header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
        }
        
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
    }

    /**
     * Load routes from config
     */
    public function loadRoutes(): void
    {
        // Auth routes
        $this->post('/api/auth/login', ['AuthController', 'login']);
        $this->post('/api/auth/register', ['AuthController', 'register']);
        $this->post('/api/auth/logout', ['AuthController', 'logout']);
        $this->post('/api/auth/refresh', ['AuthController', 'refresh']);
        $this->get('/api/auth/me', ['AuthController', 'me']);
        $this->post('/api/auth/forgot-password', ['AuthController', 'forgotPassword']);
        $this->post('/api/auth/reset-password', ['AuthController', 'resetPassword']);
        $this->post('/api/auth/change-password', ['AuthController', 'changePassword']);
        $this->get('/api/auth/verify-email', ['AuthController', 'verifyEmail']);
        $this->post('/api/auth/resend-verification', ['AuthController', 'resendVerification']);
        $this->get('/api/auth/csrf', ['AuthController', 'csrf']);
        
        // Profile routes
        $this->get('/api/profile', ['ProfileController', 'show']);
        $this->put('/api/profile', ['ProfileController', 'update']);
        $this->get('/api/therapists/search', ['ProfileController', 'searchTherapists']);
        $this->get('/api/therapists/{id}', ['ProfileController', 'getTherapist']);
        $this->get('/api/clients', ['ProfileController', 'listClients']);
        $this->get('/api/clients/{id}', ['ProfileController', 'getClient']);
        
        // Case routes
        $this->get('/api/cases', ['CaseController', 'index']);
        $this->get('/api/cases/{id}', ['CaseController', 'show']);
        $this->post('/api/cases', ['CaseController', 'store']);
        $this->put('/api/cases/{id}', ['CaseController', 'update']);
        $this->post('/api/cases/{id}/members', ['CaseController', 'addMember']);
        $this->delete('/api/cases/{caseId}/members/{memberId}', ['CaseController', 'removeMember']);
        $this->post('/api/cases/{id}/notes', ['CaseController', 'addNote']);
        $this->post('/api/cases/{id}/visits', ['CaseController', 'scheduleVisit']);
        
        // Wizard routes
        $this->get('/api/wizards', ['WizardController', 'index']);
        $this->get('/api/wizards/{id}', ['WizardController', 'show']);
        $this->post('/api/wizards/{id}/start', ['WizardController', 'start']);
        $this->get('/api/wizard-runs', ['WizardController', 'listRuns']);
        $this->get('/api/wizard-runs/{id}', ['WizardController', 'getRun']);
        $this->post('/api/wizard-runs/{id}/answers', ['WizardController', 'saveAnswers']);
        $this->post('/api/wizard-runs/{id}/complete', ['WizardController', 'complete']);
        $this->post('/api/wizard-runs/{id}/pause', ['WizardController', 'pause']);
        $this->post('/api/wizard-runs/{id}/resume', ['WizardController', 'resume']);
        $this->post('/api/admin/wizards', ['WizardController', 'create']);
        
        // Health check
        $this->get('/api/health', function() {
            Response::success(['status' => 'healthy', 'timestamp' => date('c')]);
        });
    }
}
