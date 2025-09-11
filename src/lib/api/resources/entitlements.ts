import { KeygenClient } from '../client';
import { Entitlement, KeygenResponse, ListOptions, KeygenListResponse } from '../../types/keygen';

export interface EntitlementFilters extends ListOptions {
  name?: string;
  code?: string;
}

export class EntitlementResource {
  constructor(private client: KeygenClient) {}

  /**
   * List all entitlements
   */
  async list(filters: EntitlementFilters = {}): Promise<KeygenListResponse<Entitlement>> {
    const params: Record<string, unknown> = {};
    
    // Add pagination
    if (filters.limit) params.limit = filters.limit;
    if (filters.page) params.page = filters.page;
    
    // Add filter parameters
    if (filters.name) params.name = filters.name;
    if (filters.code) params.code = filters.code;

    return this.client.request<Entitlement[]>('entitlements', { params });
  }

  /**
   * Get a specific entitlement by ID
   */
  async get(id: string): Promise<KeygenResponse<Entitlement>> {
    return this.client.request<Entitlement>(`entitlements/${id}`);
  }

  /**
   * Create a new entitlement
   */
  async create(entitlementData: {
    name: string;
    code: string;
  }): Promise<KeygenResponse<Entitlement>> {
    const body = {
      data: {
        type: 'entitlements',
        attributes: {
          name: entitlementData.name.trim(),
          code: entitlementData.code.trim(),
        },
      },
    };

    return this.client.request<Entitlement>('entitlements', {
      method: 'POST',
      body,
    });
  }

  /**
   * Update an entitlement
   */
  async update(id: string, updates: {
    name?: string;
    code?: string;
  }): Promise<KeygenResponse<Entitlement>> {
    const body = {
      data: {
        type: 'entitlements',
        id,
        attributes: {
          ...(updates.name && { name: updates.name.trim() }),
          ...(updates.code && { code: updates.code.trim() }),
        },
      },
    };

    return this.client.request<Entitlement>(`entitlements/${id}`, {
      method: 'PATCH',
      body,
    });
  }

  /**
   * Delete an entitlement
   */
  async delete(id: string): Promise<void> {
    await this.client.request(`entitlements/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get entitlement licenses
   */
  async getLicenses(id: string, options: ListOptions = {}): Promise<KeygenResponse<unknown[]>> {
    const params: Record<string, unknown> = {};
    if (options.limit) params.limit = options.limit;
    if (options.page) params.page = options.page;

    return this.client.request(`entitlements/${id}/licenses`, { params });
  }

  /**
   * Attach entitlement to licenses
   */
  async attachToLicenses(id: string, licenseIds: string[]): Promise<KeygenResponse<unknown>> {
    const body = {
      data: licenseIds.map(licenseId => ({
        type: 'licenses',
        id: licenseId,
      })),
    };

    return this.client.request(`entitlements/${id}/relationships/licenses`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Detach entitlement from licenses
   */
  async detachFromLicenses(id: string, licenseIds: string[]): Promise<void> {
    const body = {
      data: licenseIds.map(licenseId => ({
        type: 'licenses',
        id: licenseId,
      })),
    };

    await this.client.request(`entitlements/${id}/relationships/licenses`, {
      method: 'DELETE',
      body,
    });
  }
}