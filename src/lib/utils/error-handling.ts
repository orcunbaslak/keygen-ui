/**
 * Centralized Error Handling Utilities
 * Provides consistent error handling across all components
 */

import { toast } from 'sonner'
import {
  isKeygenApiError,
  isNetworkError,
  isAuthError,
  isValidationError,
  isNotFoundError,
  isUnprocessableEntityError,
  isForbiddenError,
  isUnauthorizedError,
  getErrorMessage,
  getErrorStatus,
  shouldShowToast,
  getCombinedErrorMessage
} from './error-guards'

/**
 * Handle errors in CRUD operations (Create, Update, Delete)
 */
export function handleCrudError(
  error: unknown,
  operation: 'create' | 'update' | 'delete',
  resourceType: string,
  options?: {
    onNotFound?: () => void
    onForbidden?: () => void
    onValidation?: (message: string) => void
    customMessage?: string
  }
): void {
  console.error(`Failed to ${operation} ${resourceType}:`, error)

  if (isNotFoundError(error)) {
    const message = options?.customMessage || `${resourceType} not found - it may have been deleted`
    if (options?.onNotFound) {
      options.onNotFound()
    }
    if (shouldShowToast(error)) {
      toast.error(message)
    }
    return
  }

  if (isUnprocessableEntityError(error)) {
    // Extract detailed error message from API response
    const detailedMessage = getCombinedErrorMessage(error)
    const message = options?.customMessage || detailedMessage || `Invalid ${resourceType.toLowerCase()} data - please check your input`
    if (options?.onValidation) {
      options.onValidation(message)
    }
    if (shouldShowToast(error)) {
      toast.error(message)
    }
    return
  }

  if (isForbiddenError(error)) {
    const message = options?.customMessage || `Permission denied - insufficient access rights`
    if (options?.onForbidden) {
      options.onForbidden()
    }
    if (shouldShowToast(error)) {
      toast.error(message)
    }
    return
  }

  if (isUnauthorizedError(error)) {
    const message = 'Authentication required - please log in again'
    if (shouldShowToast(error)) {
      toast.error(message)
    }
    // Could trigger redirect to login here
    return
  }

  if (isNetworkError(error)) {
    const message = 'Network connection failed - please check your internet connection'
    if (shouldShowToast(error)) {
      toast.error(message)
    }
    return
  }

  if (isKeygenApiError(error)) {
    const message = options?.customMessage || `Failed to ${operation} ${resourceType.toLowerCase()}: ${getErrorMessage(error)}`
    if (shouldShowToast(error)) {
      toast.error(message)
    }
    return
  }

  // Fallback for any other error types
  const message = options?.customMessage || `Failed to ${operation} ${resourceType.toLowerCase()}: ${getErrorMessage(error)}`
  if (shouldShowToast(error)) {
    toast.error(message)
  }
}

/**
 * Handle errors in data loading operations
 */
export function handleLoadError(
  error: unknown,
  resourceType: string,
  options?: {
    customMessage?: string
    silent?: boolean
  }
): void {
  console.error(`Failed to load ${resourceType}:`, error)

  if (options?.silent) {
    return
  }

  if (isNetworkError(error)) {
    const message = 'Network connection failed - please check your internet connection'
    toast.error(message)
    return
  }

  if (isUnauthorizedError(error)) {
    const message = 'Authentication required - please log in again'
    toast.error(message)
    return
  }

  const message = options?.customMessage || `Failed to load ${resourceType.toLowerCase()}`
  if (shouldShowToast(error)) {
    toast.error(message)
  }
}

/**
 * Handle errors in form submission
 */
export function handleFormError(
  error: unknown,
  formType: string,
  options?: {
    customMessage?: string
    onValidation?: (message: string) => void
  }
): void {
  console.error(`Form submission error (${formType}):`, error)

  if (isValidationError(error)) {
    const message = getErrorMessage(error)
    if (options?.onValidation) {
      options.onValidation(message)
    } else if (shouldShowToast(error)) {
      toast.error(message)
    }
    return
  }

  if (isUnprocessableEntityError(error)) {
    // Extract detailed error message from API response
    const detailedMessage = getCombinedErrorMessage(error)
    const message = detailedMessage || 'Please check your input and try again'
    if (options?.onValidation) {
      options.onValidation(message)
    } else if (shouldShowToast(error)) {
      toast.error(message)
    }
    return
  }

  // Use the generic CRUD handler for other errors
  handleCrudError(error, 'create', formType, options)
}

/**
 * Handle authentication errors specifically
 */
export function handleAuthError(error: unknown): void {
  // Log error with full details (plain objects don't serialize well with console.error)
  const errorMessage = getCombinedErrorMessage(error)
  console.error('Authentication error:', errorMessage, error)

  if (isAuthError(error) || isUnauthorizedError(error)) {
    // Extract specific error message if available
    const detailedMessage = getCombinedErrorMessage(error)
    const message = detailedMessage !== 'Unknown Error'
      ? detailedMessage
      : 'Authentication failed - please check your credentials'
    toast.error(message)
    return
  }

  if (isNetworkError(error)) {
    toast.error('Cannot connect to authentication server')
    return
  }

  // For other errors, try to show the actual error message
  const message = errorMessage !== 'Unknown Error'
    ? errorMessage
    : 'Login failed - please try again'
  toast.error(message)
}

/**
 * Extract user-friendly error message for display
 */
export function getUserFriendlyErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (isKeygenApiError(error)) {
    return error.detail || error.message || fallback
  }

  if (isNetworkError(error)) {
    return 'Connection failed - please check your internet connection'
  }

  if (isAuthError(error) || isUnauthorizedError(error)) {
    return 'Authentication required - please log in'
  }

  if (isValidationError(error)) {
    return error.message || 'Please check your input'
  }

  return getErrorMessage(error) || fallback
}

/**
 * Check if an error indicates the resource should be refreshed/refetched
 */
export function shouldRefreshAfterError(error: unknown): boolean {
  // Refresh after 404 (item was deleted) or network errors (might be transient)
  return isNotFoundError(error) || isNetworkError(error)
}

/**
 * Get appropriate retry delay based on error type
 */
export function getRetryDelay(error: unknown): number {
  if (isNetworkError(error)) {
    return 2000 // 2 seconds for network errors
  }

  if (isKeygenApiError(error)) {
    const status = getErrorStatus(error)
    if (status === 429) { // Rate limited
      return 5000 // 5 seconds for rate limiting
    }
    if (status && status >= 500) { // Server errors
      return 3000 // 3 seconds for server errors
    }
  }

  return 1000 // 1 second default
}