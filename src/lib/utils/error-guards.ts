/**
 * Type Guard Functions for Error Identification
 * Provides type-safe error checking without type assertions
 */

import {
  KeygenApiError,
  NetworkError,
  AuthError,
  ValidationError,
  ParseError,
  AppError,
  ERROR_CODES,
  HTTP_STATUS
} from '@/lib/types/errors'

/**
 * Type guard to check if an error is a KeygenApiError
 */
export function isKeygenApiError(error: unknown): error is KeygenApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  )
}

/**
 * Type guard to check if an error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT,
      ERROR_CODES.CONNECTION_REFUSED,
      ERROR_CODES.ABORT
    ].includes((error as { code: string }).code as 'NETWORK_ERROR' | 'TIMEOUT' | 'CONNECTION_REFUSED' | 'ABORT')
  )
}

/**
 * Type guard to check if an error is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    [
      ERROR_CODES.AUTH_FAILED,
      ERROR_CODES.TOKEN_EXPIRED,
      ERROR_CODES.INVALID_CREDENTIALS,
      ERROR_CODES.UNAUTHORIZED
    ].includes((error as { code: string }).code as 'AUTH_FAILED' | 'TOKEN_EXPIRED' | 'INVALID_CREDENTIALS' | 'UNAUTHORIZED') &&
    'status' in error &&
    ((error as { status: unknown }).status === HTTP_STATUS.UNAUTHORIZED || (error as { status: unknown }).status === HTTP_STATUS.FORBIDDEN)
  )
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === ERROR_CODES.VALIDATION_ERROR
  )
}

/**
 * Type guard to check if an error is a ParseError
 */
export function isParseError(error: unknown): error is ParseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    [ERROR_CODES.PARSE_ERROR, ERROR_CODES.JSON_ERROR].includes((error as { code: string }).code as 'PARSE_ERROR' | 'JSON_ERROR')
  )
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === ERROR_CODES.APP_ERROR
  )
}

/**
 * Type guard to check if an error is a standard JavaScript Error
 */
export function isJavaScriptError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Type guard to check if an error has a specific HTTP status
 */
export function hasHttpStatus(error: unknown, status: number): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status: unknown }).status === status
  )
}

/**
 * Type guard to check if an error is a 404 Not Found error
 */
export function isNotFoundError(error: unknown): boolean {
  return hasHttpStatus(error, HTTP_STATUS.NOT_FOUND)
}

/**
 * Type guard to check if an error is a 422 Validation error
 */
export function isUnprocessableEntityError(error: unknown): boolean {
  return hasHttpStatus(error, HTTP_STATUS.UNPROCESSABLE_ENTITY)
}

/**
 * Type guard to check if an error is a 403 Forbidden error
 */
export function isForbiddenError(error: unknown): boolean {
  return hasHttpStatus(error, HTTP_STATUS.FORBIDDEN)
}

/**
 * Type guard to check if an error is a 401 Unauthorized error
 */
export function isUnauthorizedError(error: unknown): boolean {
  return hasHttpStatus(error, HTTP_STATUS.UNAUTHORIZED)
}

/**
 * Extract error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (isKeygenApiError(error)) {
    return error.detail || error.message || 'API Error'
  }
  
  if (isNetworkError(error)) {
    return error.message || 'Network Error'
  }
  
  if (isAuthError(error)) {
    return error.message || 'Authentication Error'
  }
  
  if (isValidationError(error)) {
    return error.message || 'Validation Error'
  }
  
  if (isParseError(error)) {
    return error.message || 'Parse Error'
  }
  
  if (isAppError(error)) {
    return error.message || 'Application Error'
  }
  
  if (isJavaScriptError(error)) {
    return error.message || 'Unknown Error'
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'Unknown Error'
}

/**
 * Extract error code from any error type
 */
export function getErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code
  }
  
  return undefined
}

/**
 * Extract HTTP status from any error type
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    return (error as { status: number }).status
  }
  
  return undefined
}

/**
 * Check if error should trigger a retry
 */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) {
    return true
  }
  
  if (isKeygenApiError(error)) {
    // Retry on server errors, timeout, and rate limiting
    return (
      error.status >= 500 ||
      error.status === HTTP_STATUS.TOO_MANY_REQUESTS ||
      error.status === HTTP_STATUS.GATEWAY_TIMEOUT
    )
  }
  
  return false
}

/**
 * Check if error should show a toast notification
 */
export function shouldShowToast(error: unknown): boolean {
  // Don't show toast for validation errors (handled in forms)
  if (isValidationError(error)) {
    return false
  }
  
  // Don't show toast for 401 errors (handled by auth system)
  if (isUnauthorizedError(error)) {
    return false
  }
  
  return true
}