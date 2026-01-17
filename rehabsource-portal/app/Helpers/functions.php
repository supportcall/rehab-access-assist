<?php

declare(strict_types=1);

/**
 * Global Helper Functions
 * Used throughout the application
 */

if (!function_exists('env')) {
    /**
     * Get environment variable with default
     */
    function env(string $key, mixed $default = null): mixed
    {
        $value = $_ENV[$key] ?? getenv($key) ?: $default;
        
        if ($value === false) {
            return $default;
        }

        // Convert string booleans
        return match (strtolower((string)$value)) {
            'true', '(true)' => true,
            'false', '(false)' => false,
            'null', '(null)' => null,
            'empty', '(empty)' => '',
            default => $value
        };
    }
}

if (!function_exists('config')) {
    /**
     * Get configuration value using dot notation
     */
    function config(string $key, mixed $default = null): mixed
    {
        static $config = null;
        
        if ($config === null) {
            $configPath = dirname(__DIR__, 2) . '/config/app.php';
            $config = file_exists($configPath) ? require $configPath : [];
        }

        $keys = explode('.', $key);
        $value = $config;

        foreach ($keys as $k) {
            if (!is_array($value) || !array_key_exists($k, $value)) {
                return $default;
            }
            $value = $value[$k];
        }

        return $value;
    }
}

if (!function_exists('base_path')) {
    /**
     * Get base path of application
     */
    function base_path(string $path = ''): string
    {
        $basePath = dirname(__DIR__, 2);
        return $path ? $basePath . '/' . ltrim($path, '/') : $basePath;
    }
}

if (!function_exists('storage_path')) {
    /**
     * Get storage path
     */
    function storage_path(string $path = ''): string
    {
        $storagePath = base_path('storage');
        return $path ? $storagePath . '/' . ltrim($path, '/') : $storagePath;
    }
}

if (!function_exists('public_path')) {
    /**
     * Get public path
     */
    function public_path(string $path = ''): string
    {
        $publicPath = base_path('public');
        return $path ? $publicPath . '/' . ltrim($path, '/') : $publicPath;
    }
}

if (!function_exists('dd')) {
    /**
     * Dump and die - for debugging
     */
    function dd(mixed ...$vars): never
    {
        foreach ($vars as $var) {
            echo '<pre>';
            var_dump($var);
            echo '</pre>';
        }
        die(1);
    }
}

if (!function_exists('dump')) {
    /**
     * Dump without dying
     */
    function dump(mixed ...$vars): void
    {
        foreach ($vars as $var) {
            echo '<pre>';
            var_dump($var);
            echo '</pre>';
        }
    }
}

if (!function_exists('now')) {
    /**
     * Get current datetime
     */
    function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', new \DateTimeZone(config('app.timezone', 'Australia/Sydney')));
    }
}

if (!function_exists('sanitize')) {
    /**
     * Sanitize string for output
     */
    function sanitize(string $string): string
    {
        return htmlspecialchars($string, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}

if (!function_exists('is_uuid')) {
    /**
     * Check if string is valid UUID v4
     */
    function is_uuid(string $string): bool
    {
        return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $string);
    }
}

if (!function_exists('format_bytes')) {
    /**
     * Format bytes to human readable
     */
    function format_bytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

if (!function_exists('format_phone_au')) {
    /**
     * Format Australian phone number
     */
    function format_phone_au(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        if (strlen($phone) === 10) {
            if (str_starts_with($phone, '04')) {
                // Mobile: 0412 345 678
                return substr($phone, 0, 4) . ' ' . substr($phone, 4, 3) . ' ' . substr($phone, 7);
            } else {
                // Landline: (02) 1234 5678
                return '(' . substr($phone, 0, 2) . ') ' . substr($phone, 2, 4) . ' ' . substr($phone, 6);
            }
        }
        
        return $phone;
    }
}

if (!function_exists('mask_email')) {
    /**
     * Mask email for privacy
     */
    function mask_email(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return $email;
        }
        
        $name = $parts[0];
        $domain = $parts[1];
        
        $maskedName = strlen($name) > 2 
            ? substr($name, 0, 2) . str_repeat('*', strlen($name) - 2)
            : str_repeat('*', strlen($name));
        
        return $maskedName . '@' . $domain;
    }
}

if (!function_exists('generate_token')) {
    /**
     * Generate secure random token
     */
    function generate_token(int $length = 32): string
    {
        return bin2hex(random_bytes($length / 2));
    }
}

if (!function_exists('array_get')) {
    /**
     * Get array value using dot notation
     */
    function array_get(array $array, string $key, mixed $default = null): mixed
    {
        if (array_key_exists($key, $array)) {
            return $array[$key];
        }

        foreach (explode('.', $key) as $segment) {
            if (!is_array($array) || !array_key_exists($segment, $array)) {
                return $default;
            }
            $array = $array[$segment];
        }

        return $array;
    }
}

if (!function_exists('array_only')) {
    /**
     * Get only specified keys from array
     */
    function array_only(array $array, array $keys): array
    {
        return array_intersect_key($array, array_flip($keys));
    }
}

if (!function_exists('array_except')) {
    /**
     * Get all keys except specified from array
     */
    function array_except(array $array, array $keys): array
    {
        return array_diff_key($array, array_flip($keys));
    }
}

if (!function_exists('str_contains_any')) {
    /**
     * Check if string contains any of the given substrings
     */
    function str_contains_any(string $haystack, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (str_contains($haystack, $needle)) {
                return true;
            }
        }
        return false;
    }
}

if (!function_exists('retry')) {
    /**
     * Retry a callback a number of times
     */
    function retry(int $times, callable $callback, int $sleepMs = 0): mixed
    {
        $attempts = 0;
        $lastException = null;

        while ($attempts < $times) {
            try {
                return $callback();
            } catch (\Exception $e) {
                $lastException = $e;
                $attempts++;
                
                if ($attempts < $times && $sleepMs > 0) {
                    usleep($sleepMs * 1000);
                }
            }
        }

        throw $lastException;
    }
}

if (!function_exists('log_error')) {
    /**
     * Log error to file
     */
    function log_error(string $message, array $context = []): void
    {
        $logFile = storage_path('logs/error.log');
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $timestamp = date('Y-m-d H:i:s');
        $contextStr = $context ? ' ' . json_encode($context) : '';
        $logLine = "[{$timestamp}] ERROR: {$message}{$contextStr}" . PHP_EOL;
        
        file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
    }
}

if (!function_exists('log_info')) {
    /**
     * Log info to file
     */
    function log_info(string $message, array $context = []): void
    {
        $logFile = storage_path('logs/app.log');
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $timestamp = date('Y-m-d H:i:s');
        $contextStr = $context ? ' ' . json_encode($context) : '';
        $logLine = "[{$timestamp}] INFO: {$message}{$contextStr}" . PHP_EOL;
        
        file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
    }
}

if (!function_exists('abort')) {
    /**
     * Abort request with error response
     */
    function abort(int $code, string $message = ''): never
    {
        http_response_code($code);
        header('Content-Type: application/json');
        
        echo json_encode([
            'success' => false,
            'error' => $message ?: match ($code) {
                400 => 'Bad Request',
                401 => 'Unauthorized',
                403 => 'Forbidden',
                404 => 'Not Found',
                405 => 'Method Not Allowed',
                422 => 'Unprocessable Entity',
                429 => 'Too Many Requests',
                500 => 'Internal Server Error',
                default => 'Error'
            }
        ]);
        
        exit;
    }
}
