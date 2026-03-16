import { KeygenClient } from '../client';
import { EventLog, EventLogFilters, KeygenResponse, KeygenListResponse } from '../../types/keygen';

export class EventLogResource {
  constructor(private client: KeygenClient) {}

  /**
   * List event logs with filtering
   */
  async list(filters: EventLogFilters = {}): Promise<KeygenListResponse<EventLog>> {
    const params: Record<string, unknown> = {};

    if (filters.limit) params.limit = filters.limit;
    if (filters.page) params.page = filters.page;

    if (filters.event) params.event = filters.event;

    if (filters.date?.start) {
      params['date[start]'] = filters.date.start;
    }
    if (filters.date?.end) {
      params['date[end]'] = filters.date.end;
    }

    return this.client.request<EventLog[]>('event-logs', { params });
  }

  /**
   * Get a specific event log by ID
   */
  async get(id: string): Promise<KeygenResponse<EventLog>> {
    return this.client.request<EventLog>(`event-logs/${id}`);
  }
}
