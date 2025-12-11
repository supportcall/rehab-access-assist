<?php
/**
 * Production Configuration
 * Copy this file and update values for your cPanel VPS
 */

return [
    // Database Configuration
    'db' => [
        'host' => 'localhost',          // Usually localhost on cPanel
        'name' => 'your_database_name', // Create in cPanel MySQL Databases
        'user' => 'your_db_user',       // Create in cPanel MySQL Databases
        'pass' => 'your_db_password',   // Set in cPanel MySQL Databases
        'charset' => 'utf8mb4',
    ],

    // JWT Configuration
    'jwt' => [
        'secret' => 'CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_AT_LEAST_32_CHARS',
        'algorithm' => 'HS256',
        'access_expiry' => 3600,      // 1 hour
        'refresh_expiry' => 604800,   // 7 days
    ],

    // Application Configuration
    'app' => [
        'name' => 'RehabSource OT Assessment Portal',
        'url' => 'https://yourdomain.com',
        'debug' => false,              // MUST be false in production
        'timezone' => 'Australia/Sydney',
    ],

    // File Upload Configuration
    'uploads' => [
        'directory' => __DIR__ . '/../../uploads',
        'max_size' => 20 * 1024 * 1024, // 20MB
        'allowed_types' => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    ],

    // CORS Configuration
    'cors' => [
        'allowed_origins' => ['https://yourdomain.com'],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Authorization', 'Content-Type', 'X-Requested-With'],
    ],

    // Email Configuration (optional - for password reset etc)
    'mail' => [
        'smtp_host' => 'mail.yourdomain.com',
        'smtp_port' => 587,
        'smtp_user' => 'noreply@yourdomain.com',
        'smtp_pass' => 'your_email_password',
        'from_email' => 'noreply@yourdomain.com',
        'from_name' => 'RehabSource Portal',
    ],

    // Logging
    'logging' => [
        'enabled' => true,
        'path' => __DIR__ . '/../../logs',
        'level' => 'warning', // debug, info, warning, error
    ],
];
