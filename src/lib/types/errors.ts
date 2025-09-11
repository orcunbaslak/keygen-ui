/**
 * Comprehensive Error Types for Keygen UI
 * Replaces generic unknown/any error handling with proper TypeScript types
 */

// Base error interface
export interface BaseError {
  message: string
  code?: string
  timestamp?: string
}

// Keygen API Error (from Keygen API responses)
export interface KeygenApiError extends BaseError {
  status: number
  title?: string
  detail?: string
  source?: {
    pointer?: string
    parameter?: string
  }
  errors?: Array<{
    id?: string
    status?: string
    code?: string
    title: string
    detail: string
    source?: {
      pointer?: string
      parameter?: string
    }
    links?: Record<string, string>
  }>
}

// Network/Connection Errors
export interface NetworkError extends BaseError {
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'CONNECTION_REFUSED' | 'ABORT'
  originalError?: Error
}

// Authentication Errors
export interface AuthError extends BaseError {
  code: 'AUTH_FAILED' | 'TOKEN_EXPIRED' | 'INVALID_CREDENTIALS' | 'UNAUTHORIZED'
  status: 401 | 403
}

// Validation Errors (client-side)
export interface ValidationError extends BaseError {
  code: 'VALIDATION_ERROR'
  field?: string
  value?: unknown
}

// Parse/JSON Errors
export interface ParseError extends BaseError {
  code: 'PARSE_ERROR' | 'JSON_ERROR'
  originalError?: Error
}

// Generic Application Error
export interface AppError extends BaseError {
  code: 'APP_ERROR'
  stack?: string
}

// Union type of all possible errors
export type ApplicationError = 
  | KeygenApiError 
  | NetworkError 
  | AuthError 
  | ValidationError 
  | ParseError 
  | AppError
  | Error // Standard JavaScript Error

// Error response from API (follows Keygen API format)
export interface ErrorResponse {
  errors: Array<{
    id?: string
    status?: string
    code?: string
    title: string
    detail: string
    source?: {
      pointer?: string
      parameter?: string
    }
    links?: Record<string, string>
  }>
}

// HTTP Status Code mappings
export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

// Common error codes
export const ERROR_CODES = {
  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  ABORT: 'ABORT',
  
  // Authentication
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Parsing
  PARSE_ERROR: 'PARSE_ERROR',
  JSON_ERROR: 'JSON_ERROR',
  
  // Application
  APP_ERROR: 'APP_ERROR',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]