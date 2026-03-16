import { KeygenClient } from '../client';
import { RequestLog, RequestLogFilters, KeygenResponse, KeygenListResponse } from '../../types/keygen';

export class RequestLogResource {
  constructor(private client: KeygenClient) {}

  /**
   * List request logs with filtering
   */
  async list(filters: RequestLogFilters = {}): Promise<KeygenListResponse<RequestLog>> {
    const params: Record<string, unknown> = {};

    // Add pagination
    if (filters.limit) params.limit = filters.limit;
    if (filters.page) params.page = filters.page;

    // Add filter parameters
    if (filters.url) params.url = filters.url;
    if (filters.ip) params.ip = filters.ip;
    if (filters.method) params.method = filters.method;
    if (filters.status) params.status = filters.status;

    // Date range filtering
    if (filters.date?.start) {
      params['date[start]'] = filters.date.start;
    }
    if (filters.date?.end) {
      params['date[end]'] = filters.date.end;
    }

    // Requestor filtering
    if (filters.requestor?.type) {
      params['requestor[type]'] = filters.requestor.type;
    }
    if (filters.requestor?.id) {
      params['requestor[id]'] = filters.requestor.id;
    }

    return this.client.request<RequestLog[]>('request-logs', { params });
  }

  /**
   * Get a specific request log by ID
   */
  async get(id: string): Promise<KeygenResponse<RequestLog>> {
    return this.client.request<RequestLog>(`request-logs/${id}`);
  }
}
