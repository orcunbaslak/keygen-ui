import { KeygenClient } from '../client';
import { Webhook, WebhookFilters, KeygenResponse, KeygenListResponse } from '../../types/keygen';

// Common webhook events in Keygen
export const WEBHOOK_EVENTS = [
  'account.updated',
  'license.created',
  'license.updated',
  'license.deleted',
  'license.suspended',
  'license.reinstated',
  'license.renewed',
  'license.expired',
  'machine.created',
  'machine.updated',
  'machine.deleted',
  'machine.heartbeat.ping',
  'machine.heartbeat.dead',
  'machine.heartbeat.resurrected',
  'product.created',
  'product.updated',
  'product.deleted',
  'policy.created',
  'policy.updated',
  'policy.deleted',
  'user.created',
  'user.updated',
  'user.deleted',
  'group.created',
  'group.updated',
  'group.deleted',
  'entitlement.created',
  'entitlement.updated',
  'entitlement.deleted',
  'release.created',
  'release.updated',
  'release.deleted',
  'release.published',
  'release.yanked',
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

export class WebhookResource {
  constructor(private client: KeygenClient) {}

  /**
   * List all webhooks
   */
  async list(filters: WebhookFilters = {}): Promise<KeygenListResponse<Webhook>> {
    const params: Record<string, unknown> = {};
    
    // Add pagination
    if (filters.limit) params.limit = filters.limit;
    if (filters.page) params.page = filters.page;
    
    // Add filter parameters
    if (filters.enabled !== undefined) params.enabled = filters.enabled;
    if (filters.endpoint) params.endpoint = filters.endpoint;
    if (filters.events && filters.events.length > 0) {
      params.events = filters.events.join(',');
    }

    return this.client.request<Webhook[]>('webhooks', { params });
  }

  /**
   * Get a specific webhook by ID
   */
  async get(id: string): Promise<KeygenResponse<Webhook>> {
    return this.client.request<Webhook>(`webhooks/${id}`);
  }

  /**
   * Create a new webhook
   */
  async create(webhookData: {
    endpoint: string;
    events: string[];
    enabled?: boolean;
  }): Promise<KeygenResponse<Webhook>> {
    const body = {
      data: {
        type: 'webhooks',
        attributes: {
          endpoint: webhookData.endpoint.trim(),
          events: webhookData.events,
          enabled: webhookData.enabled !== false, // Default to true
        },
      },
    };

    return this.client.request<Webhook>('webhooks', {
      method: 'POST',
      body,
    });
  }

  /**
   * Update a webhook
   */
  async update(id: string, updates: {
    endpoint?: string;
    events?: string[];
    enabled?: boolean;
  }): Promise<KeygenResponse<Webhook>> {
    const body = {
      data: {
        type: 'webhooks',
        id,
        attributes: {
          ...(updates.endpoint && { endpoint: updates.endpoint.trim() }),
          ...(updates.events && { events: updates.events }),
          ...(updates.enabled !== undefined && { enabled: updates.enabled }),
        },
      },
    };

    return this.client.request<Webhook>(`webhooks/${id}`, {
      method: 'PATCH',
      body,
    });
  }

  /**
   * Delete a webhook
   */
  async delete(id: string): Promise<void> {
    await this.client.request(`webhooks/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Enable a webhook
   */
  async enable(id: string): Promise<KeygenResponse<Webhook>> {
    return this.update(id, { enabled: true });
  }

  /**
   * Disable a webhook
   */
  async disable(id: string): Promise<KeygenResponse<Webhook>> {
    return this.update(id, { enabled: false });
  }

  /**
   * Test a webhook by sending a test event
   */
  async test(id: string, eventType = 'webhook.test'): Promise<KeygenResponse<any>> {
    const body = {
      data: {
        type: 'webhook-events',
        attributes: {
          event: eventType,
        },
      },
    };

    return this.client.request(`webhooks/${id}/actions/test`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Get webhook delivery logs
   */
  async getDeliveries(id: string, options: {
    limit?: number;
    page?: number;
  } = {}): Promise<KeygenResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (options.limit) params.limit = options.limit;
    if (options.page) params.page = options.page;

    return this.client.request(`webhooks/${id}/webhook-events`, { params });
  }

  /**
   * Get available webhook events
   */
  getAvailableEvents(): string[] {
    return [...WEBHOOK_EVENTS];
  }

  /**
   * Get webhook events grouped by resource
   */
  getEventsByCategory(): Record<string, string[]> {
    const categories: Record<string, string[]> = {};
    
    WEBHOOK_EVENTS.forEach(event => {
      const [resource] = event.split('.');
      if (!categories[resource]) {
        categories[resource] = [];
      }
      categories[resource].push(event);
    });

    return categories;
  }
}