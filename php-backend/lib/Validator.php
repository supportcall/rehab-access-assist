<?php
/**
 * Input Validation Helper
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    die('Direct access not permitted');
}

class Validator {
    private array $errors = [];
    private array $data;

    public function __construct(array $data) {
        $this->data = $data;
    }

    /**
     * Validate that a field is required
     */
    public function required(string $field, string $message = null): self {
        if (!isset($this->data[$field]) || trim((string)$this->data[$field]) === '') {
            $this->errors[$field] = $message ?? "{$field} is required";
        }
        return $this;
    }

    /**
     * Validate email format
     */
    public function email(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field] = $message ?? "Invalid email address";
            }
        }
        return $this;
    }

    /**
     * Validate minimum length
     */
    public function minLength(string $field, int $min, string $message = null): self {
        if (isset($this->data[$field]) && strlen((string)$this->data[$field]) < $min) {
            $this->errors[$field] = $message ?? "{$field} must be at least {$min} characters";
        }
        return $this;
    }

    /**
     * Validate maximum length
     */
    public function maxLength(string $field, int $max, string $message = null): self {
        if (isset($this->data[$field]) && strlen((string)$this->data[$field]) > $max) {
            $this->errors[$field] = $message ?? "{$field} must be less than {$max} characters";
        }
        return $this;
    }

    /**
     * Validate UUID format
     */
    public function uuid(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
            if (!preg_match($pattern, $this->data[$field])) {
                $this->errors[$field] = $message ?? "Invalid UUID format";
            }
        }
        return $this;
    }

    /**
     * Validate numeric value
     */
    public function numeric(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!is_numeric($this->data[$field])) {
                $this->errors[$field] = $message ?? "{$field} must be a number";
            }
        }
        return $this;
    }

    /**
     * Validate integer value
     */
    public function integer(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_INT)) {
                $this->errors[$field] = $message ?? "{$field} must be an integer";
            }
        }
        return $this;
    }

    /**
     * Validate value is in array
     */
    public function in(string $field, array $allowed, string $message = null): self {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!in_array($this->data[$field], $allowed)) {
                $this->errors[$field] = $message ?? "{$field} must be one of: " . implode(', ', $allowed);
            }
        }
        return $this;
    }

    /**
     * Validate date format
     */
    public function date(string $field, string $format = 'Y-m-d', string $message = null): self {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            $date = DateTime::createFromFormat($format, $this->data[$field]);
            if (!$date || $date->format($format) !== $this->data[$field]) {
                $this->errors[$field] = $message ?? "{$field} must be a valid date";
            }
        }
        return $this;
    }

    /**
     * Validate date is not in the future
     */
    public function notFuture(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            $date = strtotime($this->data[$field]);
            if ($date > time()) {
                $this->errors[$field] = $message ?? "{$field} cannot be in the future";
            }
        }
        return $this;
    }

    /**
     * Validate phone number format
     */
    public function phone(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            // Remove spaces, dashes, parentheses
            $phone = preg_replace('/[\s\-\(\)]+/', '', $this->data[$field]);
            // Australian phone format: 10-12 digits, may start with +
            if (!preg_match('/^\+?[0-9]{10,12}$/', $phone)) {
                $this->errors[$field] = $message ?? "Invalid phone number";
            }
        }
        return $this;
    }

    /**
     * Validate system ID format (OT-XXXXXX or PT-XXXXXX)
     */
    public function systemId(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!preg_match('/^[A-Z]{2}-\d{6}$/', $this->data[$field])) {
                $this->errors[$field] = $message ?? "Invalid system ID format (expected: XX-123456)";
            }
        }
        return $this;
    }

    /**
     * Validate boolean value
     */
    public function boolean(string $field, string $message = null): self {
        if (isset($this->data[$field])) {
            $value = $this->data[$field];
            $allowed = [true, false, 1, 0, '1', '0', 'true', 'false'];
            if (!in_array($value, $allowed, true)) {
                $this->errors[$field] = $message ?? "{$field} must be a boolean";
            }
        }
        return $this;
    }

    /**
     * Check if validation passed
     */
    public function passes(): bool {
        return empty($this->errors);
    }

    /**
     * Check if validation failed
     */
    public function fails(): bool {
        return !$this->passes();
    }

    /**
     * Get all validation errors
     */
    public function errors(): array {
        return $this->errors;
    }

    /**
     * Get first error message
     */
    public function firstError(): ?string {
        return reset($this->errors) ?: null;
    }

    /**
     * Get validated data (only fields that were validated)
     */
    public function validated(): array {
        return $this->data;
    }

    /**
     * Static factory method
     */
    public static function make(array $data): self {
        return new self($data);
    }
}
