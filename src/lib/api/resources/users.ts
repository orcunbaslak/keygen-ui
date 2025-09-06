import { KeygenClient } from '../client';
import { User, UserFilters, KeygenResponse } from '@/lib/types/keygen';

export class UserResource {
  constructor(private client: KeygenClient) {}

  /**
   * List all users
   */
  async list(filters: UserFilters = {}): Promise<KeygenResponse<User[]>> {
    const params = {
      ...this.client.buildPaginationParams(filters),
    };

    // Add filter parameters
    if (filters.email) params.email = filters.email;
    if (filters.role) params.role = filters.role;
    if (filters.status) params.status = filters.status;

    return this.client.request<User[]>('users', { params });
  }

  /**
   * Get a specific user by ID
   */
  async get(id: string): Promise<KeygenResponse<User>> {
    return this.client.request<User>(`users/${id}`);
  }

  /**
   * Create a new user
   */
  async create(userData: {
    firstName?: string;
    lastName?: string;
    email: string;
    role?: User['attributes']['role'];
    password?: string;
    metadata?: Record<string, any>;
  }): Promise<KeygenResponse<User>> {
    const body = {
      data: {
        type: 'users',
        attributes: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role || 'user',
          password: userData.password,
          metadata: userData.metadata || {},
        },
      },
    };

    return this.client.request<User>('users', {
      method: 'POST',
      body,
    });
  }

  /**
   * Update a user
   */
  async update(id: string, updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: User['attributes']['role'];
    metadata?: Record<string, any>;
  }): Promise<KeygenResponse<User>> {
    const body = {
      data: {
        type: 'users',
        id,
        attributes: updates,
      },
    };

    return this.client.request<User>(`users/${id}`, {
      method: 'PATCH',
      body,
    });
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<void> {
    await this.client.request(`users/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<KeygenResponse<User>> {
    const body = {
      meta: {
        currentPassword,
        newPassword,
      },
    };

    return this.client.request<User>(`users/${id}/actions/update-password`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Reset user password
   */
  async resetPassword(id: string): Promise<KeygenResponse<any>> {
    return this.client.request(`users/${id}/actions/reset-password`, {
      method: 'POST',
    });
  }

  /**
   * Ban a user
   */
  async ban(id: string): Promise<KeygenResponse<User>> {
    return this.client.request<User>(`users/${id}/actions/ban`, {
      method: 'POST',
    });
  }

  /**
   * Unban a user
   */
  async unban(id: string): Promise<KeygenResponse<User>> {
    return this.client.request<User>(`users/${id}/actions/unban`, {
      method: 'POST',
    });
  }

  /**
   * Generate user token
   */
  async generateToken(id: string, tokenData: {
    name?: string;
    expiry?: string;
    permissions?: string[];
  } = {}): Promise<KeygenResponse<any>> {
    const body = {
      data: {
        type: 'tokens',
        attributes: {
          name: tokenData.name || 'User Token',
          expiry: tokenData.expiry,
          permissions: tokenData.permissions || ['*'],
        },
      },
    };

    return this.client.request(`users/${id}/tokens`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Get user licenses
   */
  async getLicenses(id: string): Promise<KeygenResponse<any[]>> {
    return this.client.request(`users/${id}/licenses`);
  }

  /**
   * Get user machines
   */
  async getMachines(id: string): Promise<KeygenResponse<any[]>> {
    return this.client.request(`users/${id}/machines`);
  }

  /**
   * Change user group
   */
  async changeGroup(id: string, groupId: string): Promise<KeygenResponse<User>> {
    const body = {
      data: { type: 'groups', id: groupId },
    };

    return this.client.request<User>(`users/${id}/relationships/group`, {
      method: 'PATCH',
      body,
    });
  }

  /**
   * Get user's second factors
   */
  async getSecondFactors(id: string): Promise<KeygenResponse<any[]>> {
    return this.client.request(`users/${id}/second-factors`);
  }

  /**
   * Create second factor for user
   */
  async createSecondFactor(id: string, factorData: {
    secret: string;
    uri?: string;
  }): Promise<KeygenResponse<any>> {
    const body = {
      data: {
        type: 'second-factors',
        attributes: factorData,
      },
    };

    return this.client.request(`users/${id}/second-factors`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Delete user's second factor
   */
  async deleteSecondFactor(userId: string, factorId: string): Promise<void> {
    await this.client.request(`users/${userId}/second-factors/${factorId}`, {
      method: 'DELETE',
    });
  }
}