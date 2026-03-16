import { KeygenClient } from '../client';
import { KeygenListResponse } from '@/lib/types/keygen';

export type SearchableType =
  | 'licenses'
  | 'machines'
  | 'users'
  | 'products'
  | 'policies'
  | 'entitlements'
  | 'groups'
  | 'releases'
  | 'request-logs';

export type SearchOp = 'AND' | 'OR';

export interface SearchParams {
  type: SearchableType;
  query: Record<string, string | Record<string, string>>;
  op?: SearchOp;
  page?: { size?: number; number?: number };
}

export class SearchResource {
  constructor(private client: KeygenClient) {}

  /**
   * Search across Keygen resources using POST /search
   *
   * Supports server-side search with ILIKE matching.
   * Searchable fields vary by type — e.g. licenses support:
   *   id, key (exact), name, metadata, owner, user, product, policy
   */
  async search<T = unknown>(params: SearchParams): Promise<KeygenListResponse<T>> {
    const queryParams: Record<string, unknown> = {};
    if (params.page) {
      queryParams.page = params.page;
    }

    return this.client.request<T[]>('search', {
      method: 'POST',
      body: {
        meta: {
          type: params.type,
          query: params.query,
          ...(params.op && { op: params.op }),
        },
      },
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });
  }
}
