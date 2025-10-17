/**
 * Sanitizes database error messages to prevent information disclosure
 * Logs full error details for debugging while returning safe messages to users
 */
export function getSafeErrorMessage(error: any): string {
  // Log full error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error('Database error:', error);
  }

  // Handle Supabase/PostgreSQL specific error codes
  const errorCode = error?.code;
  const errorMessage = error?.message?.toLowerCase() || '';

  // Duplicate key violations
  if (errorCode === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
    return 'This record already exists. Please use different values.';
  }

  // Foreign key violations
  if (errorCode === '23503' || errorMessage.includes('foreign key') || errorMessage.includes('violates')) {
    return 'Invalid reference provided. Please check your input.';
  }

  // Not null violations
  if (errorCode === '23502' || errorMessage.includes('null value')) {
    return 'Required field is missing. Please fill in all required fields.';
  }

  // Check constraint violations
  if (errorCode === '23514' || errorMessage.includes('check constraint')) {
    return 'Invalid data provided. Please check your input values.';
  }

  // RLS policy violations
  if (errorMessage.includes('rls') || errorMessage.includes('policy') || errorMessage.includes('permission')) {
    return "You don't have permission for this action.";
  }

  // Authentication errors
  if (errorMessage.includes('jwt') || errorMessage.includes('token') || errorMessage.includes('auth')) {
    return 'Your session has expired. Please log in again.';
  }

  // Network/connection errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
    return 'Connection error. Please check your internet and try again.';
  }

  // Validation errors (custom)
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return 'Please check your input and try again.';
  }

  // Length violations
  if (errorMessage.includes('too long') || errorMessage.includes('length')) {
    return 'Input exceeds maximum length. Please shorten your text.';
  }

  // Default safe message for any other error
  return 'An error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Validates input length before submission
 */
export function validateLength(value: string, maxLength: number, fieldName: string): void {
  if (value && value.length > maxLength) {
    throw new Error(`${fieldName} must be less than ${maxLength} characters`);
  }
}

/**
 * Validates required fields
 */
export function validateRequired(value: any, fieldName: string): void {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${fieldName} is required`);
  }
}
