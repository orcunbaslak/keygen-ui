import { KeygenClient } from '../client';
import { Group, KeygenResponse, ListOptions, KeygenListResponse } from '../../types/keygen';

export interface GroupFilters extends ListOptions {
  name?: string;
  maxLicenses?: number;
  maxMachines?: number;
  maxUsers?: number;
}

export class GroupResource {
  constructor(private client: KeygenClient) {}

  /**
   * List all groups
   */
  async list(filters: GroupFilters = {}): Promise<KeygenListResponse<Group>> {
    const params: Record<string, unknown> = {};
    
    // Add pagination
    if (filters.limit) params.limit = filters.limit;
    if (filters.page) params.page = filters.page;
    
    // Add filter parameters
    if (filters.name) params.name = filters.name;
    if (filters.maxLicenses) params.maxLicenses = filters.maxLicenses;
    if (filters.maxMachines) params.maxMachines = filters.maxMachines;
    if (filters.maxUsers) params.maxUsers = filters.maxUsers;

    return this.client.request<Group[]>('groups', { params });
  }

  /**
   * Get a specific group by ID
   */
  async get(id: string): Promise<KeygenResponse<Group>> {
    return this.client.request<Group>(`groups/${id}`);
  }

  /**
   * Create a new group
   */
  async create(groupData: {
    name: string;
    maxLicenses?: number;
    maxMachines?: number;
    maxUsers?: number;
  }): Promise<KeygenResponse<Group>> {
    const body = {
      data: {
        type: 'groups',
        attributes: {
          name: groupData.name.trim(),
          ...(groupData.maxLicenses && { maxLicenses: groupData.maxLicenses }),
          ...(groupData.maxMachines && { maxMachines: groupData.maxMachines }),
          ...(groupData.maxUsers && { maxUsers: groupData.maxUsers }),
        },
      },
    };

    return this.client.request<Group>('groups', {
      method: 'POST',
      body,
    });
  }

  /**
   * Update a group
   */
  async update(id: string, updates: {
    name?: string;
    maxLicenses?: number;
    maxMachines?: number;
    maxUsers?: number;
  }): Promise<KeygenResponse<Group>> {
    const body = {
      data: {
        type: 'groups',
        id,
        attributes: {
          ...(updates.name && { name: updates.name.trim() }),
          ...(updates.maxLicenses !== undefined && { maxLicenses: updates.maxLicenses }),
          ...(updates.maxMachines !== undefined && { maxMachines: updates.maxMachines }),
          ...(updates.maxUsers !== undefined && { maxUsers: updates.maxUsers }),
        },
      },
    };

    return this.client.request<Group>(`groups/${id}`, {
      method: 'PATCH',
      body,
    });
  }

  /**
   * Delete a group
   */
  async delete(id: string): Promise<void> {
    await this.client.request(`groups/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get group licenses
   */
  async getLicenses(id: string, options: ListOptions = {}): Promise<KeygenResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (options.limit) params.limit = options.limit;
    if (options.page) params.page = options.page;

    return this.client.request(`groups/${id}/licenses`, { params });
  }

  /**
   * Get group users
   */
  async getUsers(id: string, options: ListOptions = {}): Promise<KeygenResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (options.limit) params.limit = options.limit;
    if (options.page) params.page = options.page;

    return this.client.request(`groups/${id}/users`, { params });
  }

  /**
   * Add user to group
   */
  async addUser(id: string, userId: string): Promise<KeygenResponse<any>> {
    const body = {
      data: { type: 'users', id: userId },
    };

    return this.client.request(`groups/${id}/relationships/users`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Remove user from group
   */
  async removeUser(id: string, userId: string): Promise<void> {
    const body = {
      data: { type: 'users', id: userId },
    };

    await this.client.request(`groups/${id}/relationships/users`, {
      method: 'DELETE',
      body,
    });
  }

  /**
   * Add license to group
   */
  async addLicense(id: string, licenseId: string): Promise<KeygenResponse<any>> {
    const body = {
      data: { type: 'licenses', id: licenseId },
    };

    return this.client.request(`groups/${id}/relationships/licenses`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Remove license from group
   */
  async removeLicense(id: string, licenseId: string): Promise<void> {
    const body = {
      data: { type: 'licenses', id: licenseId },
    };

    await this.client.request(`groups/${id}/relationships/licenses`, {
      method: 'DELETE',
      body,
    });
  }
}