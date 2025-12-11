<?php
/**
 * OT & Physio Assessment Portal - Configuration
 * 
 * IMPORTANT: Copy this file to config.local.php and update with your actual values
 * Never commit config.local.php to version control
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    die('Direct access not permitted');
}

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
define('LOG_DIR', dirname(__DIR__) . '/logs');
define('LOG_LEVEL', APP_DEBUG ? 'debug' : 'error'); // debug, info, warning, error

// ============================================================
// ERROR HANDLING
// ============================================================
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// ============================================================
// TIMEZONE
// ============================================================
date_default_timezone_set('Australia/Sydney');

// ============================================================
// SESSION CONFIGURATION
// ============================================================
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', APP_ENV === 'production' ? 1 : 0);
ini_set('session.cookie_samesite', 'Strict');
