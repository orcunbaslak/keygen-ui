import {
  KeygenResponse,
  KeygenError,
  ApiRequestOptions,
  PaginationOptions,
} from '@/lib/types/keygen';

export class KeygenApiError extends Error {
  public errors: KeygenError[];
  public status?: number;

  constructor(errors: KeygenError[], status?: number) {
    const message = errors.map(e => `${e.title}: ${e.detail}`).join(', ');
    super(message);
    this.name = 'KeygenApiError';
    this.errors = errors;
    this.status = status;
  }
}

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
      } catch {
        // JSON parsing failed - this is normal for empty responses (like DELETE)
        if (response.ok && method === 'DELETE') {
          // DELETE requests often return empty bodies, which is normal
          data = null;
        } else if (!response.ok) {
          // For error responses, if we can't parse JSON, create a basic error
          data = null;
        } else {
          // For other successful responses, empty JSON might be unexpected
          console.warn('Could not parse JSON response, but request was successful');
          data = null;
        }
      }

      // Handle API errors
      if (!response.ok) {
        throw new KeygenApiError(
          data?.errors || [{ title: 'HTTP Error', detail: `Request failed with status ${response.status}` }],
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof KeygenApiError) {
        throw error;
      }

      // Handle network errors
      throw new KeygenApiError([{
        title: 'Network Error',
        detail: error instanceof Error ? error.message : 'A network error occurred'
      }]);
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

    throw new KeygenApiError([{
      title: 'Authentication Failed',
      detail: 'Failed to retrieve token from authentication response'
    }]);
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