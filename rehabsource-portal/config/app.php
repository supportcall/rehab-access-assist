<?php
/**
 * Application Configuration
 * 
 * @package RehabSource
 */

return [
    // Application
    'name' => $_ENV['APP_NAME'] ?? 'Rehab Source',
    'url' => $_ENV['APP_URL'] ?? 'https://rehab-source.com',
    'env' => $_ENV['APP_ENV'] ?? 'production',
    'debug' => ($_ENV['APP_DEBUG'] ?? 'false') === 'true',
    'key' => $_ENV['APP_KEY'] ?? '',
    'timezone' => $_ENV['APP_TIMEZONE'] ?? 'Australia/Sydney',
    
    // Database
    'database' => [
        'driver' => 'mysql',
        'host' => $_ENV['DB_HOST'] ?? 'localhost',
        'port' => (int) ($_ENV['DB_PORT'] ?? 3306),
        'database' => $_ENV['DB_DATABASE'] ?? 'rehabsource',
        'username' => $_ENV['DB_USERNAME'] ?? '',
        'password' => $_ENV['DB_PASSWORD'] ?? '',
        'charset' => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
        'collation' => $_ENV['DB_COLLATION'] ?? 'utf8mb4_unicode_ci',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        ],
    ],
    
    // Security
    'security' => [
        'session_lifetime' => (int) ($_ENV['SESSION_LIFETIME_MINUTES'] ?? 120),
        'session_secure' => ($_ENV['SESSION_SECURE_ONLY'] ?? 'true') === 'true',
        'session_httponly' => ($_ENV['SESSION_HTTP_ONLY'] ?? 'true') === 'true',
        'session_samesite' => $_ENV['SESSION_SAME_SITE'] ?? 'Strict',
        'jwt_secret' => $_ENV['JWT_SECRET'] ?? '',
        'jwt_expiry' => (int) ($_ENV['JWT_EXPIRY_MINUTES'] ?? 60),
        'jwt_refresh_expiry' => (int) ($_ENV['JWT_REFRESH_EXPIRY_DAYS'] ?? 30),
        'password_min_length' => (int) ($_ENV['PASSWORD_MIN_LENGTH'] ?? 12),
        'lockout_threshold' => (int) ($_ENV['LOCKOUT_THRESHOLD'] ?? 5),
        'lockout_duration' => (int) ($_ENV['LOCKOUT_DURATION_MINUTES'] ?? 15),
        'csrf_lifetime' => (int) ($_ENV['CSRF_TOKEN_LIFETIME_MINUTES'] ?? 60),
    ],
    
    // Rate limiting
    'rate_limits' => [
        'auth' => [
            'attempts' => (int) ($_ENV['RATE_LIMIT_AUTH_ATTEMPTS'] ?? 5),
            'window' => (int) ($_ENV['RATE_LIMIT_AUTH_WINDOW_MINUTES'] ?? 15),
        ],
        'upload' => [
            'requests' => (int) ($_ENV['RATE_LIMIT_UPLOAD_REQUESTS'] ?? 20),
            'window' => (int) ($_ENV['RATE_LIMIT_UPLOAD_WINDOW_MINUTES'] ?? 60),
        ],
    ],
    
    // Storage
    'storage' => [
        'path' => $_ENV['STORAGE_PATH'] ?? dirname(__DIR__) . '/storage',
        'uploads' => $_ENV['STORAGE_UPLOADS'] ?? 'uploads',
        'reports' => $_ENV['STORAGE_REPORTS'] ?? 'reports',
        'cache' => $_ENV['STORAGE_CACHE'] ?? 'cache',
        'logs' => $_ENV['STORAGE_LOGS'] ?? 'logs',
        'keys' => $_ENV['STORAGE_KEYS'] ?? 'keys',
    ],
    
    // File uploads
    'uploads' => [
        'max_size' => (int) ($_ENV['MAX_UPLOAD_SIZE_MB'] ?? 5) * 1024 * 1024,
        'allowed_images' => explode(',', $_ENV['ALLOWED_IMAGE_TYPES'] ?? 'jpg,jpeg,png,gif,webp'),
        'allowed_documents' => explode(',', $_ENV['ALLOWED_DOCUMENT_TYPES'] ?? 'pdf,doc,docx,xls,xlsx'),
    ],
    
    // Email
    'mail' => [
        'driver' => 'smtp',
        'host' => $_ENV['SMTP_HOST'] ?? '',
        'port' => (int) ($_ENV['SMTP_PORT'] ?? 465),
        'encryption' => $_ENV['SMTP_ENCRYPTION'] ?? 'ssl',
        'username' => $_ENV['SMTP_USERNAME'] ?? '',
        'password' => $_ENV['SMTP_PASSWORD'] ?? '',
        'from_address' => $_ENV['SMTP_FROM_ADDRESS'] ?? '',
        'from_name' => $_ENV['SMTP_FROM_NAME'] ?? 'Rehab Source',
        'queue_enabled' => ($_ENV['EMAIL_QUEUE_ENABLED'] ?? 'true') === 'true',
        'max_retries' => (int) ($_ENV['EMAIL_MAX_RETRIES'] ?? 3),
    ],
    
    // PDF generation
    'pdf' => [
        'engine' => $_ENV['PDF_ENGINE'] ?? 'wkhtmltopdf',
        'wkhtmltopdf_path' => $_ENV['WKHTMLTOPDF_PATH'] ?? '/usr/local/bin/wkhtmltopdf',
        'chromium_path' => $_ENV['CHROMIUM_PATH'] ?? '/usr/bin/chromium-browser',
    ],
    
    // Features
    'features' => [
        'telehealth' => ($_ENV['FEATURE_TELEHEALTH'] ?? 'false') === 'true',
        'mhr_integration' => ($_ENV['FEATURE_MHR_INTEGRATION'] ?? 'false') === 'true',
        'multi_clinic' => ($_ENV['FEATURE_MULTI_CLINIC'] ?? 'true') === 'true',
        'equipment_module' => ($_ENV['FEATURE_EQUIPMENT_MODULE'] ?? 'true') === 'true',
        'knowledge_base' => ($_ENV['FEATURE_KNOWLEDGE_BASE'] ?? 'true') === 'true',
        'reviews' => ($_ENV['FEATURE_REVIEWS'] ?? 'true') === 'true',
    ],
    
    // Logging
    'logging' => [
        'level' => $_ENV['LOG_LEVEL'] ?? 'warning',
        'channel' => $_ENV['LOG_CHANNEL'] ?? 'file',
        'max_files' => (int) ($_ENV['LOG_MAX_FILES'] ?? 30),
        'max_size' => (int) ($_ENV['LOG_MAX_SIZE_MB'] ?? 50) * 1024 * 1024,
    ],
    
    // Data retention
    'retention' => [
        'data_years' => (int) ($_ENV['DATA_RETENTION_YEARS'] ?? 5),
        'audit_years' => (int) ($_ENV['AUDIT_LOG_RETENTION_YEARS'] ?? 7),
    ],
    
    // Admin access
    'admin' => [
        'allowed_ips' => array_filter(explode(',', $_ENV['ADMIN_ALLOWED_IPS'] ?? '127.0.0.1')),
        'basic_auth_enabled' => ($_ENV['ADMIN_BASIC_AUTH_ENABLED'] ?? 'false') === 'true',
        'basic_auth_user' => $_ENV['ADMIN_BASIC_AUTH_USER'] ?? '',
        'basic_auth_password' => $_ENV['ADMIN_BASIC_AUTH_PASSWORD'] ?? '',
    ],
    
    // Maintenance
    'maintenance' => [
        'enabled' => ($_ENV['MAINTENANCE_MODE'] ?? 'false') === 'true',
        'secret' => $_ENV['MAINTENANCE_SECRET'] ?? '',
    ],
];
