import {
  KeygenResponse,
  // KeygenError removed - using new error types
  ApiRequestOptions,
  PaginationOptions,
} from '@/lib/types/keygen';
import {
  KeygenApiError,
  NetworkError,
  ParseError,
  AuthError,
  ERROR_CODES,
  HTTP_STATUS
} from '@/lib/types/errors';

// Error types are now defined in @/lib/types/errors
// This client throws proper typed errors instead of generic Error instances

export interface KeygenClientConfig {
  apiUrl: string;
  accountId: string;
  token?: string;
}

export class KeygenClient {
  private config: KeygenClientConfig;

  constructor(config: KeygenClientConfig) {
    this.config = config;
  }

  /**
   * Set the authentication token
   */
  setToken(token: string) {
    this.config.token = token;
  }

  /**
   * Get the current token
   */
  getToken(): string | undefined {
    return this.config.token;
  }

  /**
   * Make an authenticated request to the Keygen API
   */
  async request<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<KeygenResponse<T>> {
    const url = this.buildUrl(endpoint);
    const { method = 'GET', headers = {}, body, params } = options;

    // Build query parameters
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            // Handle nested objects like page[size], date[start], etc.
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              if (nestedValue !== undefined && nestedValue !== null) {
                searchParams.append(`${key}[${nestedKey}]`, String(nestedValue));
              }
            });
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }

    const fullUrl = searchParams.toString() 
      ? `${url}?${searchParams.toString()}`
      : url;

    const requestHeaders: Record<string, string> = {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      ...headers,
    };

    // Add authentication if token is available
    if (this.config.token) {
      requestHeaders.Authorization = `Bearer ${this.config.token}`;
    }

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle JSON responses - try to parse JSON, handle empty responses gracefully
      let data = null;
      
      try {
        data = await response.json();
      } catch (jsonError) {
        // JSON parsing failed
        if (response.ok && method === 'DELETE') {
          // DELETE requests often return empty bodies, which is normal
          data = null;
        } else if (!response.ok) {
          // For error responses, if we can't parse JSON, create a parse error
          const parseError: ParseError = {
            message: `Failed to parse error response: ${jsonError instanceof Error ? jsonError.message : 'Unknown parse error'}`,
            code: ERROR_CODES.PARSE_ERROR,
            originalError: jsonError instanceof Error ? jsonError : undefined
          };
          throw parseError;
        } else {
          // For other successful responses, log warning but continue
          console.warn('Could not parse JSON response, but request was successful');
          data = null;
        }
      }

      // Handle API errors with proper error types
      if (!response.ok) {
        const apiError: KeygenApiError = {
          message: data?.errors?.[0]?.detail || data?.errors?.[0]?.title || `HTTP ${response.status} Error`,
          status: response.status,
          code: data?.errors?.[0]?.code || `HTTP_${response.status}`,
          title: data?.errors?.[0]?.title || 'API Error',
          detail: data?.errors?.[0]?.detail || `Request failed with status ${response.status}`,
          source: data?.errors?.[0]?.source,
          errors: data?.errors || []
        };

        // Handle specific auth errors
        if (response.status === HTTP_STATUS.UNAUTHORIZED || response.status === HTTP_STATUS.FORBIDDEN) {
          const authError: AuthError = {
            message: apiError.message,
            status: response.status,
            code: response.status === HTTP_STATUS.UNAUTHORIZED ? ERROR_CODES.UNAUTHORIZED : ERROR_CODES.AUTH_FAILED
          };
          throw authError;
        }

        throw apiError;
      }

      return data;
    } catch (error) {
      // Re-throw our custom error types
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string'
      ) {
        throw error;
      }

      // Handle network/fetch errors
      if (error instanceof TypeError) {
        const networkError: NetworkError = {
          message: error.message || 'Network connection failed',
          code: ERROR_CODES.NETWORK_ERROR,
          originalError: error
        };
        throw networkError;
      }

      // Handle other JavaScript errors
      if (error instanceof Error) {
        const appError = {
          message: error.message || 'An unexpected error occurred',
          code: ERROR_CODES.APP_ERROR,
          stack: error.stack
        };
        throw appError;
      }

      // Fallback for unknown errors
      const unknownError = {
        message: 'An unknown error occurred',
        code: ERROR_CODES.APP_ERROR
      };
      throw unknownError;
    }
  }

  /**
   * Build the full URL for an endpoint
   */
  private buildUrl(endpoint: string): string {
    const baseUrl = `${this.config.apiUrl}/accounts/${this.config.accountId}`;
    
    // Handle both absolute and relative endpoints
    if (endpoint.startsWith('/')) {
      // Absolute endpoint (e.g., '/tokens', '/me')
      if (endpoint.startsWith('/v1') || endpoint === '/me') {
        return `${this.config.apiUrl}${endpoint}`;
      }
      return `${baseUrl}${endpoint}`;
    }
    
    // Relative endpoint
    return `${baseUrl}/${endpoint}`;
  }

  /**
   * Authenticate with email and password to get a token
   */
  async authenticate(email: string, password: string, tokenName = 'Keygen UI Token'): Promise<string> {
    const credentials = Buffer.from(`${email}:${password}`).toString('base64');

    const response = await this.request<{ attributes: { token: string } }>('/tokens', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      body: {
        data: {
          type: 'tokens',
          attributes: {
            name: tokenName,
          },
        },
      },
    });

    if (response.data?.attributes?.token) {
      this.setToken(response.data.attributes.token);
      return response.data.attributes.token;
    }

    const authError: KeygenApiError = {
      message: 'Authentication Failed',
      status: 401,
      title: 'Authentication Failed', 
      detail: 'Failed to retrieve token from authentication response',
      code: ERROR_CODES.AUTH_FAILED
    };
    throw authError;
  }

  /**
   * Get current user information (Who Am I?)
   */
  async me() {
    return this.request('/me');
  }

  /**
   * Build pagination parameters
   */
  buildPaginationParams(options: PaginationOptions = {}) {
    const params: Record<string, unknown> = {};

    if (options.limit) {
      params.limit = options.limit;
    }

    if (options.page) {
      params.page = options.page;
    }

    return params;
  }
}

// Create a singleton instance
let clientInstance: KeygenClient | null = null;

export function getKeygenClient(): KeygenClient {
  if (!clientInstance) {
    const apiUrl = process.env.NEXT_PUBLIC_KEYGEN_API_URL;
    const accountId = process.env.NEXT_PUBLIC_KEYGEN_ACCOUNT_ID;

    if (!apiUrl || !accountId) {
      throw new Error('Missing required environment variables: NEXT_PUBLIC_KEYGEN_API_URL and NEXT_PUBLIC_KEYGEN_ACCOUNT_ID');
    }

    clientInstance = new KeygenClient({
      apiUrl,
      accountId,
    });
  }

  return clientInstance;
}