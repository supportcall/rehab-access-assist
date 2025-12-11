<?php
/**
 * OT & Physio Assessment Portal - Configuration
 * 
 * IMPORTANT: Copy production.php to config.local.php and update with your actual values
 * The config.local.php file takes precedence if it exists
 * Never commit config.local.php to version control
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    die('Direct access not permitted');
}

// Load local config if exists (production override)
$localConfigPath = __DIR__ . '/config.local.php';
if (file_exists($localConfigPath)) {
    $localConfig = require $localConfigPath;
    
    // Apply local config values
    if (isset($localConfig['db'])) {
        define('DB_HOST', $localConfig['db']['host'] ?? 'localhost');
        define('DB_PORT', $localConfig['db']['port'] ?? '3306');
        define('DB_NAME', $localConfig['db']['name']);
        define('DB_USER', $localConfig['db']['user']);
        define('DB_PASS', $localConfig['db']['pass']);
        define('DB_CHARSET', $localConfig['db']['charset'] ?? 'utf8mb4');
    }
    
    if (isset($localConfig['jwt'])) {
        define('JWT_SECRET', $localConfig['jwt']['secret']);
        define('JWT_ALGORITHM', $localConfig['jwt']['algorithm'] ?? 'HS256');
        define('JWT_EXPIRY_HOURS', ($localConfig['jwt']['access_expiry'] ?? 3600) / 3600);
        define('JWT_REFRESH_EXPIRY_DAYS', ($localConfig['jwt']['refresh_expiry'] ?? 604800) / 86400);
    }
    
    if (isset($localConfig['app'])) {
        define('APP_ENV', $localConfig['app']['debug'] ? 'development' : 'production');
        define('APP_DEBUG', $localConfig['app']['debug'] ?? false);
        define('APP_URL', $localConfig['app']['url'] ?? 'https://localhost');
        if (isset($localConfig['app']['timezone'])) {
            date_default_timezone_set($localConfig['app']['timezone']);
        }
    }
    
    if (isset($localConfig['uploads'])) {
        define('UPLOAD_DIR', $localConfig['uploads']['directory']);
        define('UPLOAD_MAX_SIZE', $localConfig['uploads']['max_size'] ?? 20 * 1024 * 1024);
    }
    
    if (isset($localConfig['cors'])) {
        define('CORS_ALLOWED_ORIGINS', $localConfig['cors']['allowed_origins']);
    }
    
    if (isset($localConfig['logging'])) {
        define('LOG_DIR', $localConfig['logging']['path'] ?? dirname(__DIR__) . '/logs');
        define('LOG_LEVEL', $localConfig['logging']['level'] ?? 'error');
    }
    
    // Mark that local config was loaded
    define('LOCAL_CONFIG_LOADED', true);
}

// Only define defaults if local config wasn't loaded
if (!defined('LOCAL_CONFIG_LOADED')) {

// ============================================================
// ENVIRONMENT
// ============================================================
define('APP_ENV', getenv('APP_ENV') ?: 'production'); // 'development' or 'production'
define('APP_DEBUG', APP_ENV === 'development');
define('APP_URL', getenv('APP_URL') ?: 'https://your-domain.com');

// ============================================================
// DATABASE CONFIGURATION
// ============================================================
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'ot_assessment_portal');
define('DB_USER', getenv('DB_USER') ?: 'your_db_user');
define('DB_PASS', getenv('DB_PASS') ?: 'your_db_password');
define('DB_CHARSET', 'utf8mb4');

// ============================================================
// JWT CONFIGURATION
// ============================================================
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_64_CHARS_MIN');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRY_HOURS', 24); // Token expires after 24 hours
define('JWT_REFRESH_EXPIRY_DAYS', 30); // Refresh token expires after 30 days

// ============================================================
// FILE UPLOAD CONFIGURATION
// ============================================================
define('UPLOAD_DIR', dirname(__DIR__) . '/uploads');
define('UPLOAD_MAX_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf']);
define('ALLOWED_MIME_TYPES', [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
]);

// ============================================================
// CORS CONFIGURATION
// ============================================================
define('CORS_ALLOWED_ORIGINS', [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://your-frontend-domain.com',
    APP_URL
]);
define('CORS_ALLOWED_METHODS', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
define('CORS_ALLOWED_HEADERS', 'Content-Type, Authorization, X-Requested-With');
define('CORS_MAX_AGE', 86400); // 24 hours

// ============================================================
// SECURITY CONFIGURATION
// ============================================================
define('PASSWORD_MIN_LENGTH', 6);
define('BCRYPT_COST', 12);
define('RATE_LIMIT_REQUESTS', 100); // requests per minute
define('RATE_LIMIT_WINDOW', 60); // seconds

// ============================================================
// API CONFIGURATION
// ============================================================
define('API_VERSION', 'v1');
define('API_BASE_PATH', '/api/' . API_VERSION);

// ============================================================
// LOGGING
// ============================================================
if (!defined('LOG_DIR')) define('LOG_DIR', dirname(__DIR__) . '/logs');
if (!defined('LOG_LEVEL')) define('LOG_LEVEL', defined('APP_DEBUG') && APP_DEBUG ? 'debug' : 'error');

} // End of default config block (if local config wasn't loaded)

// ============================================================
// ENSURE DEFAULTS FOR CONSTANTS THAT MIGHT BE MISSING
// ============================================================
if (!defined('ALLOWED_EXTENSIONS')) {
    define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf']);
}
if (!defined('ALLOWED_MIME_TYPES')) {
    define('ALLOWED_MIME_TYPES', [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'
    ]);
}
if (!defined('CORS_ALLOWED_METHODS')) {
    define('CORS_ALLOWED_METHODS', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
}
if (!defined('CORS_ALLOWED_HEADERS')) {
    define('CORS_ALLOWED_HEADERS', 'Content-Type, Authorization, X-Requested-With');
}
if (!defined('CORS_MAX_AGE')) {
    define('CORS_MAX_AGE', 86400);
}
if (!defined('PASSWORD_MIN_LENGTH')) {
    define('PASSWORD_MIN_LENGTH', 6);
}
if (!defined('BCRYPT_COST')) {
    define('BCRYPT_COST', 12);
}
if (!defined('API_VERSION')) {
    define('API_VERSION', 'v1');
}
if (!defined('API_BASE_PATH')) {
    define('API_BASE_PATH', '/api/' . API_VERSION);
}

// ============================================================
// ERROR HANDLING
// ============================================================
if (defined('APP_DEBUG') && APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// ============================================================
// TIMEZONE (set if not already set by local config)
// ============================================================
if (!ini_get('date.timezone')) {
    date_default_timezone_set('Australia/Sydney');
}

// ============================================================
// SESSION CONFIGURATION
// ============================================================
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', defined('APP_ENV') && APP_ENV === 'production' ? 1 : 0);
ini_set('session.cookie_samesite', 'Strict');
