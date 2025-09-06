import { KeygenClient } from '../client';
import { Policy, KeygenResponse, ListOptions, KeygenListResponse } from '../../types/keygen';

export class PolicyResource {
  constructor(private client: KeygenClient) {}

  /**
   * List all policies
   */
  async list(options?: ListOptions): Promise<KeygenListResponse<Policy>> {
    const queryParams = new URLSearchParams();
    
    if (options?.limit) queryParams.set('limit', options.limit.toString());
    if (options?.page) queryParams.set('page', options.page.toString());
    
    const query = queryParams.toString();
    const endpoint = query ? `/policies?${query}` : '/policies';
    
    return this.client.request<Policy[]>(endpoint);
  }

  /**
   * Get a specific policy by ID
   */
  async get(policyId: string): Promise<KeygenResponse<Policy>> {
    return this.client.request<Policy>(`/policies/${policyId}`);
  }

  /**
   * Create a new policy
   */
  async create(data: {
    name: string;
    productId: string;
    duration?: number;
    strict?: boolean;
    floating?: boolean;
    concurrent?: boolean;
    protected?: boolean;
    requireHeartbeat?: boolean;
    heartbeatDuration?: number;
    heartbeatCullStrategy?: 'DEACTIVATE_DEAD' | 'KEEP_DEAD';
    heartbeatResurrectionStrategy?: 'NO_REVIVE' | 'ALWAYS_REVIVE';
    heartbeatBasis?: 'FROM_CREATION' | 'FROM_FIRST_VALIDATION';
    machineUniquenessStrategy?: 'UNIQUE_PER_LICENSE' | 'UNIQUE_PER_ACCOUNT';
    machineMatchingStrategy?: 'MATCH_ANY' | 'MATCH_TWO' | 'MATCH_MOST' | 'MATCH_ALL';
    expirationStrategy?: 'RESTRICT_ACCESS' | 'REVOKE_ACCESS' | 'MAINTAIN_ACCESS';
    expirationBasis?: 'FROM_CREATION' | 'FROM_FIRST_VALIDATION' | 'FROM_FIRST_ACTIVATION' | 'FROM_FIRST_DOWNLOAD' | 'FROM_FIRST_USE';
    renewalBasis?: 'FROM_EXPIRY' | 'FROM_NOW';
    transferStrategy?: 'RESET_EXPIRY' | 'KEEP_EXPIRY';
    authenticationStrategy?: 'TOKEN' | 'LICENSE' | 'MIXED' | 'NONE';
    machineLeasingStrategy?: 'PER_LICENSE' | 'PER_USER' | 'ALWAYS_ALLOW';
    processLeasingStrategy?: 'PER_MACHINE' | 'PER_LICENSE' | 'PER_USER' | 'ALWAYS_ALLOW';
    overageStrategy?: 'NO_OVERAGE' | 'ALWAYS_ALLOW_OVERAGE' | 'ALLOW_1_25X_OVERAGE' | 'ALLOW_1_5X_OVERAGE' | 'ALLOW_2X_OVERAGE';
    metadata?: Record<string, any>;
  }): Promise<KeygenResponse<Policy>> {
    const { productId, ...attributes } = data;
    
    return this.client.request<Policy>('/policies', {
      method: 'POST',
      body: {
        data: {
          type: 'policies',
          attributes,
          relationships: {
            product: {
              data: {
                type: 'products',
                id: productId
              }
            }
          }
        }
      }
    });
  }

  /**
   * Update a policy
   */
  async update(policyId: string, data: {
    name?: string;
    duration?: number;
    strict?: boolean;
    floating?: boolean;
    concurrent?: boolean;
    protected?: boolean;
    requireHeartbeat?: boolean;
    heartbeatDuration?: number;
    heartbeatCullStrategy?: 'DEACTIVATE_DEAD' | 'KEEP_DEAD';
    heartbeatResurrectionStrategy?: 'NO_REVIVE' | 'ALWAYS_REVIVE';
    heartbeatBasis?: 'FROM_CREATION' | 'FROM_FIRST_VALIDATION';
    machineUniquenessStrategy?: 'UNIQUE_PER_LICENSE' | 'UNIQUE_PER_ACCOUNT';
    machineMatchingStrategy?: 'MATCH_ANY' | 'MATCH_TWO' | 'MATCH_MOST' | 'MATCH_ALL';
    expirationStrategy?: 'RESTRICT_ACCESS' | 'REVOKE_ACCESS' | 'MAINTAIN_ACCESS';
    expirationBasis?: 'FROM_CREATION' | 'FROM_FIRST_VALIDATION' | 'FROM_FIRST_ACTIVATION' | 'FROM_FIRST_DOWNLOAD' | 'FROM_FIRST_USE';
    renewalBasis?: 'FROM_EXPIRY' | 'FROM_NOW';
    transferStrategy?: 'RESET_EXPIRY' | 'KEEP_EXPIRY';
    authenticationStrategy?: 'TOKEN' | 'LICENSE' | 'MIXED' | 'NONE';
    machineLeasingStrategy?: 'PER_LICENSE' | 'PER_USER' | 'ALWAYS_ALLOW';
    processLeasingStrategy?: 'PER_MACHINE' | 'PER_LICENSE' | 'PER_USER' | 'ALWAYS_ALLOW';
    overageStrategy?: 'NO_OVERAGE' | 'ALWAYS_ALLOW_OVERAGE' | 'ALLOW_1_25X_OVERAGE' | 'ALLOW_1_5X_OVERAGE' | 'ALLOW_2X_OVERAGE';
    metadata?: Record<string, any>;
  }): Promise<KeygenResponse<Policy>> {
    return this.client.request<Policy>(`/policies/${policyId}`, {
      method: 'PATCH',
      body: {
        data: {
          type: 'policies',
          id: policyId,
          attributes: data
        }
      }
    });
  }

  /**
   * Delete a policy
   */
  async delete(policyId: string): Promise<void> {
    await this.client.request<void>(`/policies/${policyId}`, {
      method: 'DELETE'
    });
  }
}