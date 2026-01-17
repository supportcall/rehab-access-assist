<?php
/**
 * Input Validation Class
 * Secure validation for all user inputs
 */

namespace App\Core;

class Validator
{
    private array $errors = [];
    private array $data = [];
    private array $validated = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Create new validator instance
     */
    public static function make(array $data): self
    {
        return new self($data);
    }

    /**
     * Validate required field
     */
    public function required(string $field, string $message = null): self
    {
        if (!isset($this->data[$field]) || trim((string)$this->data[$field]) === '') {
            $this->errors[$field][] = $message ?? "The {$field} field is required.";
        }
        return $this;
    }

    /**
     * Validate email format
     */
    public function email(string $field, string $message = null): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field][] = $message ?? "The {$field} must be a valid email address.";
            }
        }
        return $this;
    }

    /**
     * Validate minimum length
     */
    public function minLength(string $field, int $min, string $message = null): self
    {
        if (isset($this->data[$field]) && strlen((string)$this->data[$field]) < $min) {
            $this->errors[$field][] = $message ?? "The {$field} must be at least {$min} characters.";
        }
        return $this;
    }

    /**
     * Validate maximum length
     */
    public function maxLength(string $field, int $max, string $message = null): self
    {
        if (isset($this->data[$field]) && strlen((string)$this->data[$field]) > $max) {
            $this->errors[$field][] = $message ?? "The {$field} must not exceed {$max} characters.";
        }
        return $this;
    }

    /**
     * Validate password strength
     */
    public function password(string $field, string $message = null): self
    {
        if (isset($this->data[$field])) {
            $password = $this->data[$field];
            
            if (strlen($password) < 8) {
                $this->errors[$field][] = $message ?? "Password must be at least 8 characters.";
            }
            
            if (!preg_match('/[A-Z]/', $password)) {
                $this->errors[$field][] = "Password must contain at least one uppercase letter.";
            }
            
            if (!preg_match('/[a-z]/', $password)) {
                $this->errors[$field][] = "Password must contain at least one lowercase letter.";
            }
            
            if (!preg_match('/[0-9]/', $password)) {
                $this->errors[$field][] = "Password must contain at least one number.";
            }
        }
        return $this;
    }

    /**
     * Validate password confirmation
     */
    public function confirmed(string $field, string $confirmField, string $message = null): self
    {
        if (isset($this->data[$field]) && isset($this->data[$confirmField])) {
            if ($this->data[$field] !== $this->data[$confirmField]) {
                $this->errors[$field][] = $message ?? "The {$field} confirmation does not match.";
            }
        }
        return $this;
    }

    /**
     * Validate numeric value
     */
    public function numeric(string $field, string $message = null): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!is_numeric($this->data[$field])) {
                $this->errors[$field][] = $message ?? "The {$field} must be a number.";
            }
        }
        return $this;
    }

    /**
     * Validate integer value
     */
    public function integer(string $field, string $message = null): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_INT)) {
                $this->errors[$field][] = $message ?? "The {$field} must be an integer.";
            }
        }
        return $this;
    }

    /**
     * Validate minimum value
     */
    public function min(string $field, $min, string $message = null): self
    {
        if (isset($this->data[$field]) && is_numeric($this->data[$field])) {
            if ($this->data[$field] < $min) {
                $this->errors[$field][] = $message ?? "The {$field} must be at least {$min}.";
            }
        }
        return $this;
    }

    /**
     * Validate maximum value
     */
    public function max(string $field, $max, string $message = null): self
    {
        if (isset($this->data[$field]) && is_numeric($this->data[$field])) {
            if ($this->data[$field] > $max) {
                $this->errors[$field][] = $message ?? "The {$field} must not exceed {$max}.";
            }
        }
        return $this;
    }

    /**
     * Validate against allowed values
     */
    public function in(string $field, array $allowed, string $message = null): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!in_array($this->data[$field], $allowed, true)) {
                $this->errors[$field][] = $message ?? "The selected {$field} is invalid.";
            }
        }
        return $this;
    }

    /**
     * Validate date format
     */
    public function date(string $field, string $format = 'Y-m-d', string $message = null): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            $date = \DateTime::createFromFormat($format, $this->data[$field]);
            if (!$date || $date->format($format) !== $this->data[$field]) {
                $this->errors[$field][] = $message ?? "The {$field} must be a valid date in format {$format}.";
            }
        }
        return $this;
    }

    /**
     * Validate UUID format
     */
    public function uuid(string $field, string $message = null): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
            if (!preg_match($pattern, $this->data[$field])) {
                $this->errors[$field][] = $message ?? "The {$field} must be a valid UUID.";
            }
        }
        return $this;
    }

    /**
     * Validate Australian phone number
     */
    public function phone(string $field, string $message = null): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            // Remove spaces and dashes
            $phone = preg_replace('/[\s\-]/', '', $this->data[$field]);
            
            // Australian mobile or landline
            if (!preg_match('/^(\+?61|0)?[2-9]\d{8}$/', $phone)) {
                $this->errors[$field][] = $message ?? "The {$field} must be a valid Australian phone number.";
            }
        }
        return $this;
    }

    /**
     * Validate Australian postcode
     */
    public function postcode(string $field, string $message = null): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!preg_match('/^\d{4}$/', $this->data[$field])) {
                $this->errors[$field][] = $message ?? "The {$field} must be a valid 4-digit postcode.";
            }
        }
        return $this;
    }

    /**
     * Validate Australian state
     */
    public function state(string $field, string $message = null): self
    {
        $states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'];
        return $this->in($field, $states, $message ?? "The {$field} must be a valid Australian state.");
    }

    /**
     * Validate URL
     */
    public function url(string $field, string $message = null): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_URL)) {
                $this->errors[$field][] = $message ?? "The {$field} must be a valid URL.";
            }
        }
        return $this;
    }

    /**
     * Validate JSON string
     */
    public function json(string $field, string $message = null): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            json_decode($this->data[$field]);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->errors[$field][] = $message ?? "The {$field} must be valid JSON.";
            }
        }
        return $this;
    }

    /**
     * Validate using custom callback
     */
    public function custom(string $field, callable $callback, string $message): self
    {
        if (isset($this->data[$field])) {
            if (!$callback($this->data[$field], $this->data)) {
                $this->errors[$field][] = $message;
            }
        }
        return $this;
    }

    /**
     * Sanitize and get validated data
     */
    public function validated(array $fields = null): array
    {
        $fields = $fields ?? array_keys($this->data);
        $validated = [];
        
        foreach ($fields as $field) {
            if (isset($this->data[$field])) {
                $value = $this->data[$field];
                
                // Sanitize string values
                if (is_string($value)) {
                    $value = trim($value);
                    $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                }
                
                $validated[$field] = $value;
            }
        }
        
        return $validated;
    }

    /**
     * Check if validation passed
     */
    public function passes(): bool
    {
        return empty($this->errors);
    }

    /**
     * Check if validation failed
     */
    public function fails(): bool
    {
        return !$this->passes();
    }

    /**
     * Get all errors
     */
    public function errors(): array
    {
        return $this->errors;
    }

    /**
     * Get first error for a field
     */
    public function firstError(string $field): ?string
    {
        return $this->errors[$field][0] ?? null;
    }

    /**
     * Get all first errors
     */
    public function firstErrors(): array
    {
        $first = [];
        foreach ($this->errors as $field => $errors) {
            $first[$field] = $errors[0];
        }
        return $first;
    }

    /**
     * Validate and throw on failure
     */
    public function validate(): array
    {
        if ($this->fails()) {
            Response::validationError($this->firstErrors());
        }
        return $this->validated();
    }
}
