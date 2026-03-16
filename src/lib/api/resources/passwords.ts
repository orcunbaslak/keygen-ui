import { KeygenClient } from '../client';
import { KeygenResponse } from '../../types/keygen';

export class PasswordResource {
  constructor(private client: KeygenClient) {}

  /**
   * Request a password reset for a user by email
   */
  async resetRequest(email: string, deliver = true): Promise<KeygenResponse<unknown>> {
    const body = {
      meta: {
        email,
        deliver,
      },
    };

    return this.client.request('passwords', {
      method: 'POST',
      body,
    });
  }
}
