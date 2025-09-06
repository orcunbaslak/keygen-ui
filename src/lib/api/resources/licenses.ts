import { KeygenClient } from '../client';
import { License, LicenseFilters, KeygenResponse } from '@/lib/types/keygen';

export class LicenseResource {
  constructor(private client: KeygenClient) {}

  /**
   * List all licenses
   */
  async list(filters: LicenseFilters = {}): Promise<KeygenResponse<License[]>> {
    const params = {
      ...this.client.buildPaginationParams(filters),
    };

    // Add filter parameters
    if (filters.user) params.user = filters.user;
    if (filters.policy) params.policy = filters.policy;
    if (filters.group) params.group = filters.group;
    if (filters.product) params.product = filters.product;
    if (filters.status) params.status = filters.status;

    return this.client.request<License[]>('licenses', { params });
  }

  /**
   * Get a specific license by ID
   */
  async get(id: string): Promise<KeygenResponse<License>> {
    return this.client.request<License>(`licenses/${id}`);
  }

  /**
   * Create a new license
   */
  async create(licenseData: {
    policyId: string;
    userId?: string;
    groupId?: string;
    name?: string;
    metadata?: Record<string, any>;
    expiry?: string;
    maxUses?: number;
  }): Promise<KeygenResponse<License>> {
    const body = {
      data: {
        type: 'licenses',
        attributes: {
          name: licenseData.name,
          metadata: licenseData.metadata || {},
          expiry: licenseData.expiry,
          maxUses: licenseData.maxUses,
        },
        relationships: {
          policy: {
            data: { type: 'policies', id: licenseData.policyId },
          },
          ...(licenseData.userId && {
            user: {
              data: { type: 'users', id: licenseData.userId },
            },
          }),
          ...(licenseData.groupId && {
            group: {
              data: { type: 'groups', id: licenseData.groupId },
            },
          }),
        },
      },
    };

    return this.client.request<License>('licenses', {
      method: 'POST',
      body,
    });
  }

  /**
   * Update a license
   */
  async update(id: string, updates: {
    name?: string;
    metadata?: Record<string, any>;
    expiry?: string;
    maxUses?: number;
  }): Promise<KeygenResponse<License>> {
    const body = {
      data: {
        type: 'licenses',
        id,
        attributes: updates,
      },
    };

    return this.client.request<License>(`licenses/${id}`, {
      method: 'PATCH',
      body,
    });
  }

  /**
   * Delete a license
   */
  async delete(id: string): Promise<void> {
    await this.client.request(`licenses/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Suspend a license
   */
  async suspend(id: string): Promise<KeygenResponse<License>> {
    return this.client.request<License>(`licenses/${id}/actions/suspend`, {
      method: 'POST',
    });
  }

  /**
   * Reinstate a license
   */
  async reinstate(id: string): Promise<KeygenResponse<License>> {
    return this.client.request<License>(`licenses/${id}/actions/reinstate`, {
      method: 'POST',
    });
  }

  /**
   * Renew a license
   */
  async renew(id: string): Promise<KeygenResponse<License>> {
    return this.client.request<License>(`licenses/${id}/actions/renew`, {
      method: 'POST',
    });
  }

  /**
   * Decrement license usage
   */
  async decrementUsage(id: string, decrement = 1): Promise<KeygenResponse<License>> {
    const body = {
      meta: { decrement },
    };

    return this.client.request<License>(`licenses/${id}/actions/decrement-usage`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Reset license usage
   */
  async resetUsage(id: string): Promise<KeygenResponse<License>> {
    return this.client.request<License>(`licenses/${id}/actions/reset-usage`, {
      method: 'POST',
    });
  }

  /**
   * Generate activation token for license
   */
  async generateActivationToken(id: string, ttl = 3600): Promise<KeygenResponse<any>> {
    const body = {
      data: {
        type: 'tokens',
        attributes: {
          expiry: new Date(Date.now() + ttl * 1000).toISOString(),
        },
      },
    };

    return this.client.request(`licenses/${id}/tokens`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Get license entitlements
   */
  async getEntitlements(id: string): Promise<KeygenResponse<any[]>> {
    return this.client.request(`licenses/${id}/entitlements`);
  }

  /**
   * Attach entitlements to license
   */
  async attachEntitlements(id: string, entitlementIds: string[]): Promise<KeygenResponse<any>> {
    const body = {
      data: entitlementIds.map(entitlementId => ({
        type: 'entitlements',
        id: entitlementId,
      })),
    };

    return this.client.request(`licenses/${id}/relationships/entitlements`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Detach entitlements from license
   */
  async detachEntitlements(id: string, entitlementIds: string[]): Promise<void> {
    const body = {
      data: entitlementIds.map(entitlementId => ({
        type: 'entitlements',
        id: entitlementId,
      })),
    };

    await this.client.request(`licenses/${id}/relationships/entitlements`, {
      method: 'DELETE',
      body,
    });
  }

  /**
   * Get license machines
   */
  async getMachines(id: string): Promise<KeygenResponse<any[]>> {
    return this.client.request(`licenses/${id}/machines`);
  }

  /**
   * Change license policy
   */
  async changePolicy(id: string, policyId: string): Promise<KeygenResponse<License>> {
    const body = {
      data: { type: 'policies', id: policyId },
    };

    return this.client.request<License>(`licenses/${id}/relationships/policy`, {
      method: 'PATCH',
      body,
    });
  }

  /**
   * Change license owner
   */
  async changeOwner(id: string, userId: string): Promise<KeygenResponse<License>> {
    const body = {
      data: { type: 'users', id: userId },
    };

    return this.client.request<License>(`licenses/${id}/relationships/user`, {
      method: 'PATCH',
      body,
    });
  }

  /**
   * Change license group
   */
  async changeGroup(id: string, groupId: string): Promise<KeygenResponse<License>> {
    const body = {
      data: { type: 'groups', id: groupId },
    };

    return this.client.request<License>(`licenses/${id}/relationships/group`, {
      method: 'PATCH',
      body,
    });
  }
}