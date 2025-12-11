<?php
/**
 * Simple Logger Class
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    die('Direct access not permitted');
}

class Logger {
    private static array $levels = [
        'debug' => 0,
        'info' => 1,
        'warning' => 2,
        'error' => 3
    ];

    /**
     * Log a debug message
     */
    public static function debug(string $message, array $context = []): void {
        self::log('debug', $message, $context);
    }

    /**
     * Log an info message
     */
    public static function info(string $message, array $context = []): void {
        self::log('info', $message, $context);
    }

    /**
     * Log a warning message
     */
    public static function warning(string $message, array $context = []): void {
        self::log('warning', $message, $context);
    }

    /**
     * Log an error message
     */
    public static function error(string $message, array $context = []): void {
        self::log('error', $message, $context);
    }

    /**
     * Main log method
     */
    private static function log(string $level, string $message, array $context = []): void {
        // Check if we should log this level
        $configLevel = defined('LOG_LEVEL') ? LOG_LEVEL : 'error';
        if (self::$levels[$level] < self::$levels[$configLevel]) {
            return;
        }

        // Create log directory if it doesn't exist
        $logDir = defined('LOG_DIR') ? LOG_DIR : dirname(__DIR__) . '/logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        // Format the log entry
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode($context) : '';
        $logEntry = "[{$timestamp}] [{$level}] {$message}{$contextStr}" . PHP_EOL;

        // Write to log file
        $logFile = $logDir . '/' . date('Y-m-d') . '.log';
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

        // Also output to error log in development
        if (defined('APP_DEBUG') && APP_DEBUG) {
            error_log($logEntry);
        }
    }

    /**
     * Log an exception
     */
    public static function exception(Throwable $e, array $context = []): void {
        $context['file'] = $e->getFile();
        $context['line'] = $e->getLine();
        $context['trace'] = $e->getTraceAsString();
        
        self::error($e->getMessage(), $context);
    }
}
