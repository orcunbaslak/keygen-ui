import { KeygenClient, getKeygenClient } from './client';
import { LicenseResource } from './resources/licenses';
import { MachineResource } from './resources/machines';
import { UserResource } from './resources/users';
import { PolicyResource } from './resources/policies';
import { ProductResource } from './resources/products';
import { GroupResource } from './resources/groups';
import { EntitlementResource } from './resources/entitlements';
import { RequestLogResource } from './resources/request-logs';
import { WebhookResource } from './resources/webhooks';
import { EventLogResource } from './resources/event-logs';
import { PasswordResource } from './resources/passwords';

export class KeygenApi {
  public licenses: LicenseResource;
  public machines: MachineResource;
  public users: UserResource;
  public policies: PolicyResource;
  public products: ProductResource;
  public groups: GroupResource;
  public entitlements: EntitlementResource;
  public requestLogs: RequestLogResource;
  public webhooks: WebhookResource;
  public eventLogs: EventLogResource;
  public passwords: PasswordResource;

  constructor(private client: KeygenClient) {
    this.licenses = new LicenseResource(client);
    this.machines = new MachineResource(client);
    this.users = new UserResource(client);
    this.policies = new PolicyResource(client);
    this.products = new ProductResource(client);
    this.groups = new GroupResource(client);
    this.entitlements = new EntitlementResource(client);
    this.requestLogs = new RequestLogResource(client);
    this.webhooks = new WebhookResource(client);
    this.eventLogs = new EventLogResource(client);
    this.passwords = new PasswordResource(client);
  }

  /**
   * Get the underlying client instance
   */
  getClient(): KeygenClient {
    return this.client;
  }

  /**
   * Authenticate with email and password
   */
  async authenticate(email: string, password: string, tokenName = 'Keygen UI Token'): Promise<string> {
    return this.client.authenticate(email, password, tokenName);
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.client.setToken(token);
  }

  /**
   * Get current token
   */
  getToken(): string | undefined {
    return this.client.getToken();
  }

  /**
   * Get current user information (Who Am I?)
   */
  async me() {
    return this.client.me();
  }
}

// Create and export a singleton instance
let apiInstance: KeygenApi | null = null;

export function getKeygenApi(): KeygenApi {
  if (!apiInstance) {
    const client = getKeygenClient();
    apiInstance = new KeygenApi(client);
  }
  return apiInstance;
}

// Re-export types and classes for convenience
export * from './client';
export * from '../types/keygen';
export { LicenseResource } from './resources/licenses';
export { MachineResource } from './resources/machines';
export { UserResource } from './resources/users';
export { PolicyResource } from './resources/policies';
export { ProductResource } from './resources/products';
export { GroupResource } from './resources/groups';
export { EntitlementResource } from './resources/entitlements';
export { RequestLogResource } from './resources/request-logs';
export { WebhookResource } from './resources/webhooks';
export { EventLogResource } from './resources/event-logs';
export { PasswordResource } from './resources/passwords';
