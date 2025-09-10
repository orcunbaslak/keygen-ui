# Keygen

Keygen is a fair source JSON HTTP API for software licensing and distribution. It supports license key management, activations, entitlements, concurrency and usage tracking, as well as secure artifact distribution with automatic upgrades.

The API is largely based on the JSON:API specification, but includes deviations to improve developer experience (e.g. embedded relationships). As a result, generic JSON:API client libraries may not work without customization.

Developers should use official or community-supported SDKs where available, or standard HTTP clients otherwise. Always integrate against the latest API version.

This `llms.txt` file provides essential context to enable LLMs to integrate Keygen successfully and securely.

Full API reference: https://keygen.sh/docs/api/

  ---

## Authentication

Keygen's API supports two authentication methods: license key authentication for client-side operations, and API token authentication for server-side integrations. All requests must use HTTPS and include the appropriate `Authorization` header (or `auth` query parameter). Unauthorized or expired credentials will result in `401` or `403` errors.

### License Authentication

Authenticate as a license by providing its key in the `Authorization` header using the `License` scheme. This works only if your license policy's authentication strategy is `LICENSE` or `MIXED`. You can also use `Basic` (`license:<key>`) or `?auth=license:<key>`. License auth is intended for client-side machine activation, deactivation, heartbeats, and validation.

```
POST /v1/accounts/<accountId>/machines
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<accountId>/machines \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: License <key>' \
  -d '{
        "data": {
          "type": "machines",
          "attributes": {
            "fingerprint": "4d:Eq:UV:D3:XZ:tL:WN:Bz:mA:Eg:E6:Mk:YX:dK:NC",
            "platform": "macOS",
            "name": "Office MacBook Pro"
          },
          "relationships": {
            "license": {
              "data": { "type": "licenses", "id": "<licenseId>" }
            }
          }
        }
      }'
```

### Token Authentication

Authenticate using an API token in the `Authorization` header with either `Bearer` or `Token` schemes. You can also use `Basic` (`token:<token>`) or `?auth=token:<token>`. Tokens include:

  - Environment tokens: near-full environment management, non-expiring by default.
  - Product tokens: full product management, non-expiring by default.
  - License tokens: client-side machine activation/deactivation and validation.
  - User tokens: scoped to a user's permissions, expiring by default.
  - Admin tokens: full account management, auto-revoked on password or role changes (not recommended for integrations).

Expired tokens return `401 Unauthorized`. Treat tokens like passwords and keep them secret.

```
POST /v1/accounts/<accountId>/machines
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<accountId>/machines \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
        "data": {
          "type": "machines",
          "attributes": {
            "fingerprint": "4d:Eq:UV:D3:XZ:tL:WN:Bz:mA:Eg:E6:Mk:YX:dK:NC",
            "platform": "macOS",
            "name": "Office MacBook Pro"
          },
          "relationships": {
            "license": {
              "data": { "type": "licenses", "id": "<licenseId>" }
            }
          }
        }
      }'
```

## Authorization

Keygen uses role-based access control (RBAC) to scope API access according to the token bearer's role. Tokens may represent a license, user, product, environment, or admin -- each granting progressively broader access. Authentication is typically done client-side for license- or user-scoped operations, and server-side (or in CI/CD) for product, environment, or admin tasks.

Never hard-code admin, environment, or product tokens in client-facing code. Embed these only in secure server-side contexts or your local CLI.

Common roles and scopes:

  - **anon**: create a new user profile, access public releases, validate license keys.
  - **user**: access endpoints scoped to that user's resources (e.g., list only their licenses).
  - **license**: access endpoints scoped to that license (e.g., list only machines tied to it).
  - **product**: access resources tied to that product (e.g., list that product's licenses).
  - **env**: access resources within that environment.
  - **admin**: full access to all account resources.

Attributes or relationships marked "protected" can only be set by admin or owning product; "read only" fields (timestamps, computed attributes) cannot be modified. Unauthorized access returns 403 Forbidden, and repeated 403s may trigger rate limiting.

## Rate Limiting

Rate limits protect the API from abuse by enforcing request quotas per token + IP. Client-side tokens (unauthenticated, user or license) may burst up to 60 requests/30 s and 500 requests/5 min. Server-side tokens (admin, environment, product) have higher limits. Exceeding a limit returns HTTP 429 and headers that show:

  - X-RateLimit-Window: current window name (e.g. "30s")
  - X-RateLimit-Count: requests made in this window
  - X-RateLimit-Limit: max requests in this window
  - X-RateLimit-Remaining: requests left in this window
  - X-RateLimit-Reset: UTC epoch seconds when window resets
  - Retry-After: seconds to wait before trying again (only on 429)

### Use

When bulk-validating licenses (e.g. provisioning hundreds of machines), monitor `X-RateLimit-Remaining` and throttle your requests -- add a small delay (10–200 ms) or random jitter between calls. If you get a 429, read `Retry-After` and pause for that many seconds before retrying to avoid blacklisting.

## Versioning

Keygen uses a major-minor versioning scheme: major versions introduce breaking changes, minor versions introduce backwards-compatible changes with a compatibility layer. Only the major version appears in the URL. For example:

```
GET /v1/licenses
```

When you make your first API request, your account is pinned to the then-current major version (e.g. 1.8). You can override this per request by sending a `Keygen-Version` header:

```
Keygen-Version: 1.1
```

Keygen guarantees that breaking changes are only introduced with a version bump. Non-breaking changes include:

  - Adding new endpoints, request parameters, resource attributes
  - Adding optional properties to existing resources
  - Reordering properties in responses
  - Changing opaque ID formats (up to 255 characters)
  - Adding new webhook event types

Breaking changes include:

  - Removing or restructuring API resources or endpoints
  - Deprecating or removing resource properties
  - Any other change that alters an existing API contract

## Security

Below you will find various security tips you may find useful.

### Secret API Tokens

Do not embed your admin, environment or product API tokens in client-side code or version control. Instead:

  - Perform machine and license operations using user-scoped or license tokens.
  - Store secret tokens server-side and in environment variables that aren't committed.

### Public IDs and Keys

It's safe to inline public resource IDs and keys in client code. For example:

```text
// v4 UUID resource ID
1fddcec8-8dd3-4d8d-9b16-215cac0f9b52
```

```text
// RSA public key
  -----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzPAseDYupK78ZUaSbGw7
YyUCCeKo/1XqTACOcmTTHHGgeHacLK2j9UrbTlhW5h8Vyo0iUEHrY1Kgf4wwiGgF
h0Yc+oDWDhq1bIertI03AE420LbpUf6OTioX+nY0EInxXF3J7aAdx/R/nYgRJrLZ
9ATWaQVSgf3vtxCtCwUeKxKZI41GA/9KHTcCmd3BryAQ1piYPr+qrEGf2NDJgr3W
vVrMtnjeoordAaCTyYKtfm56WGXeXr43dfdejBuIkI5kqSzwVyoxhnjE/Rj6xks8
ffH+dkAPNwm0IpxXJerybjmPWyv7iyXEUN8CKG+6430D7NoYHp/c991ZHQBUs59g
vwIDAQAB
  -----END PUBLIC KEY-----
```

```text
// Ed25519 public key (hex)
e8601e48b69383ba520245fd07971e983d06d22c4257cfd82304601479cee788
```

### Account Permissions

By default your account is unprotected -- users can self-register and manage resources. To require admin authentication for user, license or machine creation:

  - Set your account to `protected` in account settings.
  - Or set individual policies or licenses to `protected` to block only those resources.

### Validation Permissions

You can validate a license key without authentication via the `validate-key` action. For any other client-side operations (e.g. per-user license listing or machine tracking), use API authentication. Leverage policy scopes to enforce parameters like machine fingerprints during validation.

### Crack Prevention

– Checksum Verification
  Use checksum assertions to detect binary tampering during license checks (requires Keygen for distribution).

– Signature Verification
  Verify response signatures to guard against MITM, replay or proxy attacks. For offline use, distribute signed (and optionally encrypted) license files as tamper-proof snapshots.

– Custom User-Agent Header
  Include a descriptive User-Agent on all API requests. For example:

  ```
  Application-Name/1.33.7 (Org-Name) darwin/10.15.5 (macOS Catalina) Apache-HttpClient/4.5.5 (Java/1.8.0_201)
  ```

### Clock Tampering

Offline devices can spoof their system clock. No offline solution is 100% reliable -- only our API, verified via cryptographic signatures, is trusted. To mitigate:

  - Require periodic online validation against the API.
  - Optionally track a local timestamp file or registry key and flag unexpected jumps.
  - At minimum, ensure the clock never falls before the license's creation time.

## Response Codes

Our API uses standard HTTP response codes to indicate the success or failure of a request.
2xx codes signal success, 4xx codes indicate a client error (e.g., missing parameters or validation failures), and 5xx codes point to server-side issues.

| Code | Status               | Meaning                                                                                          |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------ |
| 200  | OK                   | Everything worked as expected.                                                                   |
| 201  | Created              | The resource was created successfully.                                                           |
| 202  | Accepted             | The request has been accepted for processing.                                                    |
| 204  | No Content           | Everything worked as expected, but there was no content to return.                               |
| 303  | See Other            | The request was successful. Follow the Location header via GET for more information.             |
| 307  | Temporary Redirect   | The request was successful. Follow the Location header and repeat the request.                   |
| 400  | Bad Request          | The request was unacceptable, often due to missing or invalid parameters.                        |
| 401  | Unauthorized         | No valid API token provided.                                                                     |
| 403  | Forbidden            | The authenticated entity does not have permission to complete the request.                       |
| 404  | Not Found            | The requested resource does not exist.                                                           |
| 409  | Conflict             | The request could not be completed because the resource already exists.                          |
| 422  | Unprocessable Entity | A validation error occurred on the resource.                                                     |
| 429  | Too Many Requests    | You've sent too many requests in a short period. Implement exponential backoff and retry.        |
| 5xx  | Server Errors        | Something went wrong on our end. These are rare.                                                 |

## Errors

Below you will find the attributes returned in an error response. When one or more errors occur, the response includes an `errors` array and omits the `data` property.

### Error

```json
{
  "title": "string",
  "detail": "string",
  "code": "string",
  "source": {
    "pointer": "string",
    "parameter": "string"
  }
}
```

Example error response:

```json
{
  "errors": [
    {
      "title": "Unprocessable entity",
      "detail": "must be a valid email",
      "code": "EMAIL_INVALID",
      "source": {
        "pointer": "/data/attributes/email"
      }
    }
  ]
}
```

## Metadata

Metadata is a free-form key-value store available on many resources (for example licenses, users, machines, products). You can attach strings, numbers, booleans, arrays or one level of nested objects, up to 64 keys per resource. All metadata keys are converted to lower camelcase (for example example_key becomes exampleKey).

### Use

In a real-world scenario you might tag a license with customerEmail, customerId or feature flags for billing and lookup in your system.

### Update metadata

This request overwrites the entire metadata object on a license. Be sure to fetch and merge existing metadata before sending updates.

```
PATCH /v1/accounts/<account>/licenses/<license>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/licenses/<license> \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
        "data": {
          "type": "licenses",
          "attributes": {
            "metadata": {
              "customerEmail": "foobar@example.com",
              "customerId": "cust_a7e3ca415298f0",
              "isPro": true
            }
          }
        }
      }'
```

## Pagination

All list endpoints across the API support page-based pagination via the `page[size]` and `page[number]` query parameters. Results are returned in reverse chronological order and you can fetch up to 100 items per page.

### Use

Fetch large sets of resources in manageable chunks. For example, get the second page of 25 users.

### Page

```json
{
  "page": {
    "size": integer,    // number between 1 and 100
    "number": integer   // page index starting at 1
  }
}
```

### List users

Retrieve users with pagination.

```
GET /v1/accounts/<account>/users?page[size]=<size>&page[number]=<number>
```

```curl
curl 'https://api.keygen.sh/v1/accounts/<account>/users?page[size]=25&page[number]=2' -g \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

## Connectivity

Detect if Keygen's licensing servers are reachable by sending a simple ping request. A successful check returns HTTP 200.

### Use

At application startup or before validating a license, ping the server to ensure network connectivity and avoid runtime failures.

### Ping

Send a GET request to the ping endpoint. Returns HTTP 200 if reachable. If it fails, try these steps:

  - Verify general internet connectivity
  - Whitelist `api.keygen.sh` in your firewall (no static IPs available)
  - Update your OS's certificate bundle
  - Switch to a reliable DNS provider
  - Consider using a custom domain for Keygen

```
GET https://api.keygen.sh/v1/ping
```

```curl
curl -X GET https://api.keygen.sh/v1/ping
```

## Cryptographic license files

License files (`.lic`) are signed (and optionally encrypted) JSON snapshots of a license or machine at checkout time. They include a time-to-live (TTL) for eventual consistency -- ideal for air-gapped or offline distribution.

### Use

Distribute `.lic` files via email or USB. In your application, always verify the file's signature and expiry before enabling licensed features.

### License file payload

```json
{
  "data": { /* license or machine snapshot */ },
  "included": [ /* related resources */ ],
  "meta": {
    "issued": "2025-05-28T12:00:00.000Z",
    "expiry": "2025-06-27T12:00:00.000Z",
    "ttl": 2592000
  }
}
```

### Checkout license file

Request a signed (and optional encrypted) license file with a custom TTL:

```
POST /v1/accounts/:accountId/licenses/:licenseId/actions/check-out?encrypt=true&ttl=<seconds>
```

```shell
curl -X POST \
  -H "Authorization: Bearer $KEYGEN_API_TOKEN" \
  "https://api.keygen.sh/v1/accounts/$ACCOUNT_ID/licenses/$LICENSE_ID/actions/check-out?encrypt=true&ttl=2592000" \
  --output license.lic
```

### Verify and decrypt

```shell
# 1. Strip header/footer, base64 decode, parse JSON
payload=$(sed -ne '/BEGIN LICENSE FILE/,/END LICENSE FILE/p' license.lic \
  | sed '1d;$d' | tr -d '\n' | base64 -d)

enc=$(echo "$payload" | jq -r .enc)
sig=$(echo "$payload" | jq -r .sig | base64 -D)

# 2. Verify Ed25519 signature (replace PUBLIC_KEY with your hex-encoded key)
ed25519_verify \
  --pubkey PUBLIC_KEY \
  --message "license/$enc" \
  --signature "$sig"

# 3. If encrypted: split enc into ciphertext, iv, tag; base64-decode each part
#    Decrypt with AES-256-GCM using SHA256(licenseKey) as secret
```

## Signatures

Use your account's public key to verify that API responses, license keys, and webhook events all originate from Keygen. This ensures authenticity, prevents tampering, and allows offline validation without calling our API.

### Use

Prevent man-in-the-middle, spoofing, and replay attacks; verify cached or offline data hasn't been altered; and confirm webhooks are genuine before processing.

### License Signatures

Verify a license key's authenticity offline by decoding its base64url-encoded signature and checking it against your public key using your chosen cryptographic library.

```
# no HTTP request
```

```curl
# use your library to decode and verify the license key signature
```

### Response Signatures

Ensure API responses truly come from Keygen by reconstructing signing data -- combining the lowercased request target, host, date, and SHA-256 digest of the raw response body -- and verifying the `Keygen-Signature` header with your public key.

```
# no HTTP request
```

```curl
# use your library to reconstruct signing data and verify the response signature
```

### Webhook Signatures

Every webhook event includes a `Keygen-Signature` header. Verify it just like a response signature, but use your webhook endpoint's hostname as the host component in the signing data.

```
# no HTTP request
```

```curl
# use your library to reconstruct signing data and verify the webhook signature
```

## Testing

When implementing a testing strategy for your licensing integration, we recommend fully mocking Keygen's APIs. Mocking prevents unnecessary load on CI/CD systems and helps you stay within your account's daily request limits. If mocking isn't possible, you can run tests against an isolated sandbox environment -- just choose a subscription tier that supports your expected request volume.

### Use

In a CI pipeline, mock the license validation endpoints to simulate check-out, renewal, and suspension flows. This keeps tests fast, predictable, and free from production API side effects.

## Sandbox

Use an isolated environment for safe testing by creating an environment with the code `sandbox`. All requests including this header will run against your sandbox, keeping production data untouched.

### Use

Run integration tests, validate licensing flows, and experiment without impacting live data.

### List licenses

Retrieve all licenses in your sandbox environment.

```
GET https://api.keygen.sh/v1/accounts/<account>/licenses
```

```curl
curl 'https://api.keygen.sh/v1/accounts/<account>/licenses' -g \
  -H 'Keygen-Environment: sandbox' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

## Tokens

Manage API tokens for authenticating with Keygen. Use user-tokens for client flows and admin, environment, or product tokens server-side. Never expose server-side tokens in client code.

### Use

Generate a user-token when a user logs in, then use it to call protected endpoints like machine activation.

### Token

```json
{
  "data": {
    "id": "6a7562be-b302-43d2-a550-30d6026247aa",
    "type": "tokens",
    "attributes": {
      "kind": "user-token",
      "token": "user-<token_secret>v3",
      "expiry": "2022-03-15T19:27:50.440Z",
      "permissions": ["license.read", "license.validate"],
      "created": "2017-01-02T20:26:53.464Z",
      "updated": "2017-01-02T20:26:53.464Z"
    },
    "relationships": {
      "account": {
        "data": { "type": "accounts", "id": "<account>" }
      },
      "bearer": {
        "data": { "type": "users", "id": "<user>" }
      }
    }
  }
}
```

### List all tokens

Returns tokens scoped to the authenticated bearer, newest first.

```
GET /v1/accounts/<account>/tokens
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/tokens \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Generate a token

Creates a new user token. The raw `token` is only returned once -- store it securely.

```
POST /v1/accounts/<account>/tokens
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/tokens \
  -H 'Accept: application/vnd.api+json' \
  -u "<email>:<password>"
```

### Retrieve a token

Fetch details for an existing token.

```
GET /v1/accounts/<account>/tokens/<id>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/tokens/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Regenerate a token

Rotate a token's secret and extend its expiry by two weeks.

```
PUT /v1/accounts/<account>/tokens/<id>
```

```curl
curl -X PUT https://api.keygen.sh/v1/accounts/<account>/tokens/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Revoke a token

Permanently invalidate a token; all sessions using it are revoked.

```
DELETE /v1/accounts/<account>/tokens/<id>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/tokens/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

## Environments

Environments let you segment your Keygen resources (licenses, users, etc.) into isolated or shared buckets. By default, API requests target the global environment; use the `Keygen-Environment` header or `?environment=<code>` query parameter to switch contexts. Invalid or missing environment identifiers result in a 400 error.

### Use

Create a sandbox environment to test license issuance without affecting production, or share global policies in a QA environment.

### Environment

```json
{
  "data": {
    "id": "b3ee7987-5309-4c61-9df1-c156a216db7a",
    "type": "environments",
    "attributes": {
      "name": "Sandbox Environment",
      "code": "sandbox",
      "isolationStrategy": "ISOLATED",
      "created": "2017-01-02T20:26:53.464Z",
      "updated": "2017-01-02T20:26:53.464Z"
    },
    "relationships": {
      "account": {
        "data": { "type": "accounts", "id": "<account>" }
      }
    },
    "links": {
      "self": "/v1/accounts/<account>/environments/<id>"
    }
  }
}
```

### Create an environment

Creates a new isolated or shared environment. For `ISOLATED`, embed at least one admin user.

```
POST https://api.keygen.sh/v1/accounts/<account>/environments
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/environments \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "environments",
      "attributes": {
        "name": "Sandbox Environment",
        "code": "sandbox",
        "isolationStrategy": "ISOLATED"
      },
      "relationships": {
        "admins": {
          "data": [
            { "type": "users", "attributes": { "email": "admin+isolated@example.com" } }
          ]
        }
      }
    }
  }'
```

### Retrieve an environment

Get details for an existing environment by ID or code.

```
GET https://api.keygen.sh/v1/accounts/<account>/environments/<id>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/environments/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Update an environment

Modify name or code. Changing `code` in use may break existing requests.

```
PATCH https://api.keygen.sh/v1/accounts/<account>/environments/<id>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/environments/<id> \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "environments",
      "attributes": { "code": "production" }
    }
  }'
```

### Delete an environment

Permanently remove an environment and queue its resources for deletion. This action cannot be undone.

```
DELETE https://api.keygen.sh/v1/accounts/<account>/environments/<id>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/environments/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### List all environments

Returns environments sorted by creation date (newest first). Supports `limit` (1–100) and `page[size]`/`page[number]`.

```
GET https://api.keygen.sh/v1/accounts/<account>/environments?limit=15&page[size]=15&page[number]=2
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/environments?limit=15 \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Generate an environment token

Creates a non-expiring token scoped to the current environment. Include `Keygen-Environment: <code>` in your headers. Store tokens securely; they grant full access.

```
POST https://api.keygen.sh/v1/accounts/<account>/environments/<id>/tokens
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/environments/<id>/tokens \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Keygen-Environment: sandbox'
```

## Products

Products represent the software applications you sell. They define distribution strategies, supported platforms, and permissions, and link to releases, licenses, machines, users, and tokens.

### Use

Create a product for your desktop app before issuing and managing licenses for it.

### Product

```json
{
  "data": {
    "id": "31339351-f7f5-4bdd-8346-5d8399a1ac07",
    "type": "products",
    "attributes": {
      "name": "Example App",
      "code": "example",
      "distributionStrategy": "OPEN",
      "url": "https://example.com",
      "platforms": ["Windows", "macOS"],
      "permissions": ["license.create", "machine.create"],
      "metadata": {},
      "created": "2025-05-28T12:34:56.789Z",
      "updated": "2025-05-28T12:34:56.789Z"
    },
    "relationships": {
      "account": { "data": { "type": "accounts", "id": "<account>" } },
      "policies": { "links": { "related": "/v1/accounts/<account>/products/<id>/policies" } },
      "licenses": { "links": { "related": "/v1/accounts/<account>/products/<id>/licenses" } },
      "machines": { "links": { "related": "/v1/accounts/<account>/products/<id>/machines" } },
      "users": { "links": { "related": "/v1/accounts/<account>/products/<id>/users" } },
      "tokens": { "links": { "related": "/v1/accounts/<account>/products/<id>/tokens" } }
    }
  }
}
```

### Create a product

Creates a new product resource.

```
POST /v1/accounts/<account>/products
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/products \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "products",
      "attributes": {
        "name": "Example App",
        "code": "example",
        "distributionStrategy": "LICENSED",
        "platforms": ["Windows", "macOS"],
        "metadata": {}
      }
    }
  }'
```

### Retrieve a product

Retrieves details of an existing product.

```
GET /v1/accounts/<account>/products/<id>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/products/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Update a product

Updates attributes of a product. Only provided fields are changed.

```
PATCH /v1/accounts/<account>/products/<id>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/products/<id> \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "products",
      "attributes": {
        "platforms": ["Windows", "macOS", "Linux"]
      }
    }
  }'
```

### Delete a product

Permanently deletes a product and its associated policies, licenses, and machines.

```
DELETE /v1/accounts/<account>/products/<id>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/products/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### List all products

Lists products sorted by creation date, most recent first.

```
GET /v1/accounts/<account>/products
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/products?limit=15 \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Generate a product token

Creates a long-lived token with full product scope. Store this token securely; it is only shown once.

```
POST /v1/accounts/<account>/products/<id>/tokens
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/products/<id>/tokens \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

## entitlements

Entitlements grant named "permissions" (for example, feature flags) that you can attach to policies, licenses, or releases.
Policies' entitlements apply to all licenses under them, while license-specific entitlements only affect that license.

### Use

Enable or disable application features for specific customers. For example, attach an entitlement with code `ADV_REPORT` to a license to unlock advanced reporting.

### Entitlement

```json
{
  "data": {
    "id": "db1ff21b-f42f-4623-952b-ca7f2600bded",
    "type": "entitlements",
    "attributes": {
      "name": "Example Feature",
      "code": "EXAMPLE_FEATURE",
      "metadata": {},
      "created": "2017-01-02T20:26:53.464Z",
      "updated": "2017-01-02T20:26:53.464Z"
    },
    "relationships": {
      "account": {
        "links": {
          "related": "/v1/accounts/<account>"
        },
        "data": {
          "type": "accounts",
          "id": "<account>"
        }
      }
    },
    "links": {
      "self": "/v1/accounts/<account>/entitlements/db1ff21b-f42f-4623-952b-ca7f2600bded"
    }
  }
}
```

### Create

Creates a new entitlement.

```
POST https://api.keygen.sh/v1/accounts/<account>/entitlements
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/entitlements \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "entitlements",
      "attributes": {
        "name": "Example Feature",
        "code": "EXAMPLE_FEATURE"
      }
    }
  }'
```

### Retrieve

Retrieves an existing entitlement by its ID.

```
GET https://api.keygen.sh/v1/accounts/<account>/entitlements/<id>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/entitlements/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Update

Updates the specified entitlement. Only provided attributes are changed.

```
PATCH https://api.keygen.sh/v1/accounts/<account>/entitlements/<id>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/entitlements/<id> \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "entitlements",
      "attributes": {
        "code": "NEW_ENTITLEMENT_CODE"
      }
    }
  }'
```

### Delete

Permanently removes an entitlement. This cannot be undone.

```
DELETE https://api.keygen.sh/v1/accounts/<account>/entitlements/<id>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/entitlements/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### List

Lists all entitlements for your account, sorted by creation date (newest first).

```
GET https://api.keygen.sh/v1/accounts/<account>/entitlements
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/entitlements?limit=15 -g \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

## Groups

Groups let you bundle users, licenses, and machines under a single umbrella -- ideal for team licenses. For example, you might create an "ACME Co." group so all of a customer's licenses share usage limits and policies across that group.

### Use

Assign each team license to a group to enforce both per-license and collective limits. For instance, cap each license at 3 activations but the entire group at 15 activations.

### Group

```json
{
  "data": {
    "id": "<id>",
    "type": "groups",
    "attributes": {
      "name": "<name>",
      "maxUsers": <integer or null>,
      "maxLicenses": <integer or null>,
      "maxMachines": <integer or null>,
      "metadata": {},
      "created": "<timestamp>",
      "updated": "<timestamp>"
    },
    "relationships": {
      "account": { "data": { "type": "accounts", "id": "<account>" } },
      "owners": { "links": { "related": "/v1/accounts/<account>/groups/<id>/owners" } },
      "users": { "links": { "related": "/v1/accounts/<account>/groups/<id>/users" } },
      "licenses": { "links": { "related": "/v1/accounts/<account>/groups/<id>/licenses" } },
      "machines": { "links": { "related": "/v1/accounts/<account>/groups/<id>/machines" } }
    },
    "links": {
      "self": "/v1/accounts/<account>/groups/<id>"
    }
  }
}
```

### Create a group

Creates a new group resource.

```
POST /v1/accounts/<account>/groups
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/groups \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "groups",
      "attributes": {
        "name": "Example Group",
        "maxUsers": null,
        "maxLicenses": null,
        "maxMachines": null,
        "metadata": {}
      }
    }
  }'
```

### Retrieve a group

Retrieves details of an existing group.

```
GET /v1/accounts/<account>/groups/<id>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/groups/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Update a group

Updates fields of an existing group. Omitted fields remain unchanged.

```
PATCH /v1/accounts/<account>/groups/<id>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/groups/<id> \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "groups",
      "attributes": {
        "name": "Updated Group Name",
        "maxLicenses": 10
      }
    }
  }'
```

### Delete a group

Permanently deletes a group and removes it from all associated resources.

```
DELETE /v1/accounts/<account>/groups/<id>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/groups/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### List all groups

Lists groups accessible to the token, sorted by creation date (newest first).

```
GET /v1/accounts/<account>/groups?limit=<limit>&page[size]=<size>&page[number]=<number>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/groups?limit=15&page[size]=15&page[number]=2 -g \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

## Policies

Policies define how licenses behave -- including duration, machine limits, validation strategies, heartbeats, and access controls. Use policies to create different license types (e.g., free trials, annual subscriptions, perpetual-fallback licenses) and enforce rules across all licenses that implement them.

### Use

Offer a 14-day trial policy that only allows a single machine activation:

```bash
curl -X POST https://api.keygen.sh/v1/accounts/<account>/policies \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "policies",
      "attributes": {
        "name": "14-Day Trial",
        "duration": 1209600,
        "maxMachines": 1
      },
      "relationships": {
        "product": {
          "data": { "type": "products", "id": "<product_id>" }
        }
      }
    }
  }'
```

### policy

```json
{
  "data": {
    "type": "policies",
    "id": "UUID",
    "attributes": {
      "name": "string",
      "duration": "integer|null",
      "strict": "boolean",
      "floating": "boolean",
      "maxMachines": "integer|null",
      "expirationStrategy": "string",
      "authenticationStrategy": "string"
    },
    "relationships": {
      "product": {
        "data": { "type": "products", "id": "UUID" }
      }
    }
  }
}
```

### Create a policy

Creates a new policy resource.

```
POST /v1/accounts/<account>/policies
```

```bash
curl -X POST https://api.keygen.sh/v1/accounts/<account>/policies \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "policies",
      "attributes": {
        "name": "Basic",
        "duration": null,
        "maxMachines": 1
      },
      "relationships": {
        "product": { "data": { "type": "products", "id": "<product_id>" } }
      }
    }
  }'
```

### Retrieve a policy

Fetches details of an existing policy.

```
GET /v1/accounts/<account>/policies/<id>
```

```bash
curl https://api.keygen.sh/v1/accounts/<account>/policies/<id> \
  -H 'Authorization: Bearer <token>'
```

### Update a policy

Modifies fields on a policy. Unspecified attributes remain unchanged.

```
PATCH /v1/accounts/<account>/policies/<id>
```

```bash
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/policies/<id> \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "policies",
      "attributes": {
        "maxMachines": 5
      }
    }
  }'
```

### Delete a policy

Permanently deletes a policy and all associated licenses.

```
DELETE /v1/accounts/<account>/policies/<id>
```

```bash
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/policies/<id> \
  -H 'Authorization: Bearer <token>'
```

### List policies

Lists all policies for an account or scoped product. Sorted by creation date (newest first).

```
GET /v1/accounts/<account>/policies?limit=<n>&page[number]=<n>
```

```bash
curl https://api.keygen.sh/v1/accounts/<account>/policies?limit=10 \
  -H 'Authorization: Bearer <token>'
```

### Pop key from pool

Deletes and returns one key from a policy's finite key pool. Does not create a license.

```
DELETE /v1/accounts/<account>/policies/<id>/pool
```

```bash
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/policies/<id>/pool \
  -H 'Authorization: Bearer <token>'
```

### Attach entitlements

Adds feature entitlements to a policy. All future license validations inherit these.

```
POST /v1/accounts/<account>/policies/<id>/entitlements
```

```bash
curl -X POST https://api.keygen.sh/v1/accounts/<account>/policies/<id>/entitlements \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": [
      { "type": "entitlements", "id": "<entitlement_id>" }
    ]
  }'
```

### Detach entitlements

Removes feature entitlements from a policy.

```
DELETE /v1/accounts/<account>/policies/<id>/entitlements
```

```bash
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/policies/<id>/entitlements \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": [
      { "type": "entitlements", "id": "<entitlement_id>" }
    ]
  }'
```

### List entitlements

Lists all entitlements attached to a policy.

```
GET /v1/accounts/<account>/policies/<id>/entitlements
```

```bash
curl https://api.keygen.sh/v1/accounts/<account>/policies/<id>/entitlements \
  -H 'Authorization: Bearer <token>'
```

## Select programming language for code examples

Toggle the language of all code snippets in the documentation to match your preferred development stack. Available options:

  - Shell
  - Node
  - Python
  - Swift
  - C#
  - Kotlin
  - Java
  - C++

Switching the language updates every example on the page, ensuring you see request and response samples in the syntax you use every day.

## Licenses

Manages software licenses -- creating, retrieving, updating, deleting, listing, validating, and performing lifecycle actions like suspend, renew, and revoke. Use license tokens for machine activation and manage relationships with users and entitlements.

### Use

After a customer purchases, create a license for them and validate the license key at application startup to unlock features and enforce usage limits.

### License object

```json
{
  "data": {
    "id": "<license_id>",
    "type": "licenses",
    "attributes": {
      "key": "<license_key>",
      "expiry": "2022-03-15T19:27:50.440Z",
      "status": "ACTIVE",
      "uses": 0,
      "maxMachines": 5,
      "metadata": {}
    }
  }
}
```

### Create a license

Creates a new license.

```
POST /v1/accounts/<account>/licenses
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/licenses \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
        "data": {
          "type": "licenses",
          "relationships": {
            "policy": { "data": { "type": "policies", "id": "<policy_id>" } }
          }
        }
      }'
```

### Retrieve a license

Fetches details of an existing license.

```
GET /v1/accounts/<account>/licenses/<license_id>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/licenses/<license_id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Update a license

Updates attributes of a license.

```
PATCH /v1/accounts/<account>/licenses/<license_id>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/licenses/<license_id> \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
        "data": {
          "type": "licenses",
          "attributes": {
            "expiry": "2023-01-01T00:00:00.000Z"
          }
        }
      }'
```

### Delete a license

Permanently removes a license.

```
DELETE /v1/accounts/<account>/licenses/<license_id>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/licenses/<license_id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### List all licenses

Returns a paginated list of licenses.

```
GET /v1/accounts/<account>/licenses
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/licenses?limit=15 \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Validate by license ID

Validates a license against its policy rules and scopes.

```
POST /v1/accounts/<account>/licenses/<license_id>/actions/validate
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/licenses/<license_id>/actions/validate \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
        "meta": {
          "scope": {
            "fingerprint": "<machine_fingerprint>"
          }
        }
      }'
```

### Validate by license key

Validates a license by key without prior authentication.

```
POST /v1/accounts/<account>/licenses/actions/validate-key
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/licenses/actions/validate-key \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -d '{
        "meta": { "key": "<license_key>" }
      }'
```

## Machines

Manage and track devices ("machines") where your licensed software runs. Machines can enforce per-device licensing rules, support heartbeat monitoring for leases, and enable offline licensing via machine file certificates.

### Use

A software vendor issues licenses tied to individual workstations. Each installation activates a machine record using a unique fingerprint. You can then check out a machine file for offline use or require periodic heartbeats to automatically reclaim unused leases.

### Machine

```json
{
  "data": {
    "id": "<machine_id>",
    "type": "machines",
    "attributes": {
      "fingerprint": "unique-device-fingerprint",
      "cores": 4,
      "name": "Office MacBook Pro",
      "platform": "macOS",
      "requireHeartbeat": false,
      "metadata": {},
      "created": "2023-05-01T12:00:00Z",
      "updated": "2023-05-01T12:00:00Z"
    },
    "relationships": {
      "license": { "data": { "type": "licenses", "id": "<license_id>" } },
      "owner":   { "data": { "type": "users",    "id": "<user_id>"    } },
      "group":   { "data": { "type": "groups",   "id": "<group_id>"   } }
    }
  }
}
```

### Activate a machine

Create a new machine under a license to begin tracking usage.

```
POST /v1/accounts/<account>/machines
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/machines \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "machines",
      "attributes": {
        "fingerprint": "ABC123",
        "platform": "Windows"
      },
      "relationships": {
        "license": { "data": { "type": "licenses", "id": "<license_id>" } }
      }
    }
  }'
```

### Retrieve a machine

Fetch details for a specific machine.

```
GET /v1/accounts/<account>/machines/<machine_id>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/machines/<machine_id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Update a machine

Modify machine attributes like name or metadata.

```
PATCH /v1/accounts/<account>/machines/<machine_id>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/machines/<machine_id> \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "machines",
      "attributes": {
        "name": "Warehouse Linux Server",
        "metadata": { "rack": "B12" }
      }
    }
  }'
```

### Deactivate a machine

Permanently delete a machine and its associated records.

```
DELETE /v1/accounts/<account>/machines/<machine_id>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/machines/<machine_id> \
  -H 'Authorization: Bearer <token>'
```

### List all machines

Retrieve a paginated list of machines, filtered by query parameters.

```
GET /v1/accounts/<account>/machines?limit=20
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/machines?limit=20 \
  -H 'Authorization: Bearer <token>'
```

### Check-out machine

Generate an offline machine file certificate for air-gapped environments.

```
POST /v1/accounts/<account>/machines/<machine_id>/actions/check-out
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/machines/<machine_id>/actions/check-out \
  -H 'Authorization: Bearer <token>'
```

### Ping heartbeat

Start or maintain a heartbeat monitor to enforce lease expirations.

```
POST /v1/accounts/<account>/machines/<machine_id>/actions/ping
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/machines/<machine_id>/actions/ping \
  -H 'Authorization: Bearer <token>'
```

### Reset heartbeat

Stop the heartbeat monitor without deactivating the machine.

```
POST /v1/accounts/<account>/machines/<machine_id>/actions/reset
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/machines/<machine_id>/actions/reset \
  -H 'Authorization: Bearer <token>'
```

### Change owner

Reassign the machine to a different user.

```
PUT /v1/accounts/<account>/machines/<machine_id>/owner
```

```curl
curl -X PUT https://api.keygen.sh/v1/accounts/<account>/machines/<machine_id>/owner \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": { "type": "users", "id": "<new_user_id>" }
  }'
```

### Change group

Move the machine to a different group for policy segmentation.

```
PUT /v1/accounts/<account>/machines/<machine_id>/group
```

```curl
curl -X PUT https://api.keygen.sh/v1/accounts/<account>/machines/<machine_id>/group \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": { "type": "groups", "id": "<new_group_id>" }
  }'
```

## Components

Manage hardware or virtual components (CPU serials, motherboard IDs, MAC addresses, etc.) for machines. Use policies to require a percentage of valid components for license validation, reducing cloning issues and false activations.

### Use

Fingerprint hardware components to prevent license fraud when cloned machines reuse the same device GUID but differ in underlying hardware.

### Component

```json
{
  "data": {
    "id": "cbfe3e6e-9076-4abe-b23a-60ebba3f6d88",
    "type": "components",
    "attributes": {
      "fingerprint": "7FC5BC17B8944F078539BC7F933F63DA",
      "name": "MOBO",
      "created": "2022-04-18T16:39:28.410Z",
      "updated": "2022-04-18T16:39:28.410Z",
      "metadata": {}
    },
    "relationships": {
      "account": {
        "data": { "type": "accounts", "id": "<account>" }
      },
      "product": {
        "data": { "type": "products", "id": "e0856109-ad5f-414e-01951346f957" }
      },
      "license": {
        "data": { "type": "licenses", "id": "defd49e7-f850-4acb-bb2d-fcd5693f22ce" }
      },
      "machine": {
        "data": { "type": "machines", "id": "79c95ba5-a7bc-474e-ad1b-af12f7736efd" }
      }
    },
    "links": {
      "self": "/v1/accounts/<account>/components/cbfe3e6e-9076-4abe-b23a-60ebba3f6d88"
    }
  }
}
```

### Add a component

Adds a new component to a machine.

```
POST https://api.keygen.sh/v1/accounts/<account>/components
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/components \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "components",
      "attributes": {
        "fingerprint": "7FC5BC17B8944F078539BC7F933F63DA",
        "name": "GPU"
      },
      "relationships": {
        "machine": {
          "data": {
            "type": "machines",
            "id": "79c95ba5-a7bc-474e-ad1b-af12f7736efd"
          }
        }
      }
    }
  }'
```

### Retrieve a component

Retrieves details of an existing component.

```
GET https://api.keygen.sh/v1/accounts/<account>/components/<id>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/components/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Update a component

Updates a component's attributes without affecting unspecified fields.

```
PATCH https://api.keygen.sh/v1/accounts/<account>/components/<id>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/components/<id> \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "components",
      "attributes": {
        "name": "CPU"
      }
    }
  }'
```

### Remove a component

Permanently deletes a component.

```
DELETE https://api.keygen.sh/v1/accounts/<account>/components/<id>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/components/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### List all components

Lists components scoped to the bearer, sorted by creation date.

```
GET https://api.keygen.sh/v1/accounts/<account>/components?limit=15
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/components?limit=15 \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

## Processes

Manage application concurrency per machine by spawning processes that send regular heartbeat pings. Missed pings mark a process as dead and subject to automatic culling.

### Use

Limit the number of concurrent app instances on each machine. For example, a desktop application can spawn worker processes at startup; each must ping regularly to signal liveness, and "zombie" processes are cleaned up after missed heartbeats.

### Process

```json
{
  "data": {
    "id": "3b4b4688-99e9-48d0-8b7e-14e4dcb025e3",
    "type": "processes",
    "attributes": {
      "pid": "1337",
      "status": "ALIVE",
      "interval": 600,
      "lastHeartbeat": "2022-04-18T16:39:28.323Z",
      "nextHeartbeat": "2022-04-18T16:49:28.323Z",
      "metadata": {},
      "created": "2022-04-18T16:39:28.410Z",
      "updated": "2022-04-18T16:39:28.410Z"
    },
    "relationships": {
      "machine": {
        "data": { "type": "machines", "id": "79c95ba5-a7bc-474e-ad1b-af12f7736efd" }
      }
    }
  }
}
```

### Spawn a process

Create a new process that must maintain heartbeat pings to stay alive.

```
POST /v1/accounts/<account>/processes
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/processes \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "processes",
      "attributes": { "pid": "1337" },
      "relationships": {
        "machine": { "data": { "type": "machines", "id": "<machine>" } }
      }
    }
  }'
```

### Retrieve a process

Fetch details of an existing process by its ID.

```
GET /v1/accounts/<account>/processes/<id>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/processes/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Update a process

Modify only the metadata of a process; other attributes remain unchanged.

```
PATCH /v1/accounts/<account>/processes/<id>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/processes/<id> \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "processes",
      "attributes": { "metadata": { "hostname": "node-42" } }
    }
  }'
```

### Kill a process

Permanently delete a process; this action cannot be undone.

```
DELETE /v1/accounts/<account>/processes/<id>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/processes/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### List processes

Retrieve a list of processes, sorted by creation date, with optional filters (limit, page, machine, license, owner, user, product).

```
GET /v1/accounts/<account>/processes?limit=15
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/processes?limit=15 \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Ping

Send a heartbeat to keep a process alive; missed pings cause automatic culling.

```
POST /v1/accounts/<account>/processes/<id>/actions/ping
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/processes/<id>/actions/ping \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

## Auto-updates

Implement automatic upgrades for your product using Keygen's release upgrade endpoint. Choose your framework below and follow the configuration examples.

### Auto-updates for Go programs

Integrate Keygen's Go SDK to activate licenses and install upgrades by replacing the running binary. Use either a license key or license token for authentication based on your policy.

```go
package main

import (
  "os"
  "github.com/keygen-sh/keygen-go"
)

func main() {
  cfg := keygen.Config{
    Account:    os.Getenv("KEYGEN_ACCOUNT"),
    Product:    os.Getenv("KEYGEN_PRODUCT"),
    LicenseKey: os.Getenv("KEYGEN_LICENSE_KEY"),  // or Token
    Token:      os.Getenv("KEYGEN_TOKEN"),
  }

  client := keygen.NewClient(cfg)

  // Validate license
  license, err := client.Licenses.Validate(cfg.LicenseKey)
  if err != nil {
    panic(err)
  }

  // Check for upgrade
  release, err := client.Releases.Upgrade(license.Key, license.Version)
  if err == nil && release != nil {
    // Download and replace current binary with release.Asset.URL
  }
}
```

### Auto-updates for Tauri apps

Enable Tauri's built-in updater and point it at Keygen's engine endpoint. The public key ensures only signed releases are applied.

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://api.keygen.sh/v1/accounts/<account>/engines/tauri/app?platform={{target}}&arch={{arch}}&version={{current_version}}"
      ],
      "dialog": false,
      "pubkey": "<public_key>"
    }
  }
}
```

### Auto-updates for Electron apps

Use electron-builder's official Keygen provider. Set `KEYGEN_TOKEN` to a product token in your CI/CD, then configure publish in `package.json`.

```bash
# Set product token
export KEYGEN_TOKEN="<PRODUCT_TOKEN>"
```

```json
{
  "build": {
    "publish": {
      "provider": "keygen",
      "account": "<account>",
      "product": "<product>",
      "channel": "stable"
    }
  }
}
```

### Auto-updates for Mac apps

For Sparkle, host an appcast XML generated by your tooling at Keygen's artifacts endpoint. For Squirrel, upload a static JSON artifact following Squirrel's schema. Authenticate updates using a license token.

```xml
<!-- Example appcast.xml -->
<rss version="2.0">
  <channel>
    <item>
      <enclosure
        url="https://api.keygen.sh/v1/accounts/<account>/artifacts/appcast.xml"
        sparkle:version="1.2.3"
      />
      <sparkle:releaseNotesLink>
        https://example.com/release-notes/1.2.3.html
      </sparkle:releaseNotesLink>
    </item>
  </channel>
</rss>
```

## Engines

Keygen engines expose read-only endpoints for distributing packages and artifacts across formats like OCI (Docker), npm, PyPI, raw binaries, and more. Engines are auto-populated; to enable one, create a package with the matching engine key (e.g. `pypi`, `npm`, `oci`).

### Use

Pull container images, install private npm or Python packages, or generate signed download links for installers, all scoped to your Keygen account.

### Engine

```json
{
  "data": {
    "id": "606e5384-6beb-446c-90ab-38b147ecae1f",
    "type": "engines",
    "attributes": {
      "name": "PyPI",
      "key": "pypi",
      "created": "2023-07-26T15:16:43.455Z",
      "updated": "2023-07-26T15:16:43.455Z"
    },
    "relationships": {
      "account": {
        "data": { "type": "accounts", "id": "<account>" }
      }
    }
  }
}
```

### Retrieve an engine

Fetch details for a specific engine.

```
GET /v1/accounts/<account>/engines/<engine>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/engines/pypi \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

### List all engines

List available engines, sorted by creation date (newest first).

```
GET /v1/accounts/<account>/engines?limit=15&page[size]=15&page[number]=2
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/engines?limit=15 -g \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

### OCI engine

Keygen's pull-only OCI registry compatible with Docker, Helm, Skopeo.

```
GET /v1/accounts/<account>/engines/oci
```

```bash
docker login oci.pkg.keygen.sh --username license --password <key>
docker pull oci.pkg.keygen.sh/<account>/my-image
```

### npm engine

Install private npm packages under a scope.

```
GET /v1/accounts/<account>/engines/npm/<package>
```

```bash
npm config set @scope:registry https://npm.pkg.keygen.sh/<account>
npm config set //npm.pkg.keygen.sh/:username license
npm config set //npm.pkg.keygen.sh/:_password <encoded-key>
npm install @scope/my-package
```

### PyPI engine

Install private Python packages via pip using a pass-through index.

```
GET /v1/accounts/<account>/engines/pypi/simple/<package>
```

```bash
pip install my-package \
  --index-url https://license:<key>@pypi.pkg.keygen.sh/<account>/simple
```

### Raw engine

Generate dynamic download URLs for raw artifacts (binaries, installers).

```
GET /v1/accounts/<account>/engines/raw/<product>/@<package>/<release>/<artifact>
```

```curl
curl https://raw.pkg.keygen.sh/<account>/my-product/@my-package/latest/install.sh \
  -H 'Authorization: Bearer <token>'
```

## Packages

Packages let you group and distribute multiple releases under a single product -- such as a CLI tool, desktop app, and add-ons all versioned separately.

### Use

Distribute a PyPI library alongside a Tauri desktop app under one product, each as its own package for independent versioning and updates.

### Package

```json
{
  "data": {
    "id": "ff1b4222-19d9-400b-8ffd-be5dfdadbc08",
    "type": "packages",
    "attributes": {
      "name": "machineid",
      "key": "machineid",
      "engine": "pypi",
      "metadata": {},
      "created": "2023-07-26T15:16:43.455Z",
      "updated": "2023-07-26T15:16:43.455Z"
    },
    "relationships": {
      "account": { "data": { "type": "accounts", "id": "<account>" } },
      "product": { "data": { "type": "products", "id": "<product>" } }
    },
    "links": {
      "self": "/v1/accounts/<account>/packages/ff1b4222-19d9-400b-8ffd-be5dfdadbc08"
    }
  }
}
```

### Create a package

Creates a new package under a product, optionally enabling an engine for auto-updates or artifact handling.

POST https://api.keygen.sh/v1/accounts/<account>/packages

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/packages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/vnd.api+json" \
  -d '{
    "data": {
      "type": "packages",
      "attributes": {
        "name": "machineid",
        "key": "machineid",
        "engine": "pypi"
      },
      "relationships": {
        "product": {
          "data": { "type": "products", "id": "<product>" }
        }
      }
    }
  }'
```

### Retrieve a package

Fetches details for an existing package by its ID or key.

GET https://api.keygen.sh/v1/accounts/<account>/packages/<package>

```curl
curl https://api.keygen.sh/v1/accounts/<account>/packages/<package> \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/vnd.api+json"
```

### Update a package

Modifies one or more attributes of a package; unset fields remain unchanged.

PATCH https://api.keygen.sh/v1/accounts/<account>/packages/<package>

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/packages/<package> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/vnd.api+json" \
  -d '{
    "data": {
      "type": "packages",
      "attributes": {
        "engine": "tauri"
      }
    }
  }'
```

### Delete a package

Permanently removes a package and all its associated releases and artifacts.

DELETE https://api.keygen.sh/v1/accounts/<account>/packages/<package>

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/packages/<package> \
  -H "Authorization: Bearer <token>"
```

### List all packages

Retrieves all packages for an account, optionally filtered by product or engine, with pagination support.

GET https://api.keygen.sh/v1/accounts/<account>/packages?limit=15&page[number]=2&engine=pypi

```curl
curl "https://api.keygen.sh/v1/accounts/<account>/packages?limit=15" \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/vnd.api+json"
```

## Releases

Releases are versioned buckets for distributing artifacts of your products to licensed users. They support statuses (DRAFT, PUBLISHED, YANKED), channels (stable, rc, beta, alpha, dev), and semantic versioning. Use releases to control your software update flow and license-based access.

### Use

Automate your CI/CD to publish new releases, enforce entitlement constraints for downloads, and let clients check for and upgrade to the latest eligible version.

### Release

```json
{
  "id": "30c64dcd-a74d-4f0d-8479-8745172a4817",
  "type": "releases",
  "attributes": {
    "name": "Keygen CLI v2.0.0-beta.2",
    "version": "2.0.0-beta.2",
    "channel": "beta",
    "status": "PUBLISHED",
    "tag": "latest",
    "metadata": {},
    "created": "2022-05-31T14:26:09.319Z",
    "updated": "2022-05-31T14:48:33.913Z",
    "backdated": null,
    "yanked": null
  },
  "relationships": {
    "product": {
      "data": { "type": "products", "id": "<product>" }
    },
    "artifacts": {
      "links": { "related": "/v1/accounts/<account>/releases/<release>/artifacts" }
    }
  }
}
```

### Create a release

Creates a new release (initially DRAFT). Upload artifacts before publishing.

```
POST /v1/accounts/<account>/releases
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/releases \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/vnd.api+json' \
  -d '{
    "data": {
      "type": "releases",
      "attributes": {
        "version": "2.0.0-alpha.1",
        "channel": "alpha",
        "tag": "latest"
      },
      "relationships": {
        "product": {
          "data": { "type": "products", "id": "<product>" }
        }
      }
    }
  }'
```

### Retrieve a release

Returns details of an existing release by ID, version, or tag.

```
GET /v1/accounts/<account>/releases/<release>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/releases/<release> \
  -H 'Accept: application/vnd.api+json'
```

### Update a release

Updates release attributes (e.g. tag, metadata). Unspecified fields remain unchanged.

```
PATCH /v1/accounts/<account>/releases/<release>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/releases/<release> \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/vnd.api+json' \
  -d '{
    "data": {
      "type": "releases",
      "attributes": {
        "tag": "latest"
      }
    }
  }'
```

### Delete a release

Permanently deletes a release. To temporarily delist without deletion, use yank.

```
DELETE /v1/accounts/<account>/releases/<release>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/releases/<release> \
  -H 'Authorization: Bearer <token>'
```

### List all releases

Returns a sorted list of releases. Supports pagination and filters (product, package, engine, channel, entitlements, status).

```
GET /v1/accounts/<account>/releases
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/releases?limit=15 \
  -H 'Accept: application/vnd.api+json'
```

### Upgrade a release

Returns the latest eligible release by semantic version within channel and optional constraints.

```
GET /v1/accounts/<account>/releases/<release>/upgrade
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/releases/<release>/upgrade \
  -H 'Accept: application/vnd.api+json'
```

### Publish a release

Publishes a DRAFT release, making it available to entitled users.

```
POST /v1/accounts/<account>/releases/<release>/actions/publish
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/releases/<release>/actions/publish \
  -H 'Authorization: Bearer <token>'
```

### Yank a release

Yanks (delists) a published release. It can be republished later.

```
POST /v1/accounts/<account>/releases/<release>/actions/yank
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/releases/<release>/actions/yank \
  -H 'Authorization: Bearer <token>'
```

### Download an artifact

Redirects to an S3 URL for the artifact file. Use in a script after an upgrade to fetch platform-specific binaries.

```
GET /v1/accounts/<account>/releases/<release>/artifacts/<artifact>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/releases/<release>/artifacts/install.sh \
  -H 'Authorization: Bearer <token>' -L
```

### List artifacts

Lists artifacts for a release. Use to enumerate available files (e.g. installers, binaries).

```
GET /v1/accounts/<account>/releases/<release>/artifacts
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/releases/<release>/artifacts \
  -H 'Authorization: Bearer <token>'
```

### Attach entitlement constraints

Require license entitlements for download and upgrade. Licenses must have all constraints.

```
POST /v1/accounts/<account>/releases/<release>/constraints
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/releases/<release>/constraints \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/vnd.api+json' \
  -d '{
    "data": [{
      "type": "constraints",
      "relationships": {
        "entitlement": {
          "data": { "type": "entitlements", "id": "<entitlement>" }
        }
      }
    }]
  }'
```

### Detach entitlement constraints

Remove entitlement requirements from a release.

```
DELETE /v1/accounts/<account>/releases/<release>/constraints
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/releases/<release>/constraints \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/vnd.api+json' \
  -d '{
    "data": [{ "type": "constraints", "id": "<constraint>" }]
  }'
```

### List entitlement constraints

Lists constraints attached to a release.

```
GET /v1/accounts/<account>/releases/<release>/constraints
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/releases/<release>/constraints \
  -H 'Authorization: Bearer <token>'
```

### Change package

Switch the package associated with a release (same product only).

```
PUT /v1/accounts/<account>/releases/<release>/package
```

```curl
curl -X PUT https://api.keygen.sh/v1/accounts/<account>/releases/<release>/package \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/vnd.api+json' \
  -d '{
    "data": { "type": "packages", "id": "<package>" }
  }'
```

## Artifacts

Manage binary files (installers, archives, etc.) for your product releases. Upload artifacts to AWS S3, generate secure download links for licensees, update metadata, delete, or list artifacts.

### Use

Upload an installer (e.g. `App-Installer.dmg`) for a macOS release so licensees can download it via a secure, time-limited URL.

### Artifact

```json
{
  "data": {
    "id": "0dad8516-f071-4573-bcea-d774e81c4a37",
    "type": "artifacts",
    "attributes": {
      "filename": "install.sh",
      "filetype": "sh",
      "filesize": 3097,
      "platform": null,
      "arch": null,
      "signature": "<base64-encoded-signature>",
      "checksum": "<base64-encoded-checksum>",
      "status": "UPLOADED",
      "metadata": {},
      "created": "2022-05-30T13:28:01.592Z",
      "updated": "2022-05-30T13:28:31.786Z"
    },
    "relationships": {
      "release": {
        "data": { "type": "releases", "id": "<release>" }
      }
    },
    "links": {
      "redirect": "<s3-upload-url>",
      "self": "/v1/accounts/<account>/artifacts/<artifact>"
    }
  }
}
```

### Upload an artifact

Create a new artifact; you'll receive a `307 Temporary Redirect` to an S3 upload URL. The artifact stays in `WAITING` status (max 1 hour) until you upload the file, then changes to `UPLOADED`.

```
POST https://api.keygen.sh/v1/accounts/<account>/artifacts
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/artifacts \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/vnd.api+json' \
  -d '{
    "data": {
      "type": "artifacts",
      "attributes": {
        "filename": "App-Installer.dmg",
        "filesize": 209715200,
        "filetype": "dmg",
        "platform": "darwin",
        "arch": "amd64"
      },
      "relationships": {
        "release": {
          "data": { "type": "releases", "id": "<release>" }
        }
      }
    }
  }'
```

### Download an artifact

Retrieve an artifact; if uploaded and published, you'll get a `303 See Other` redirect to the S3 download URL. Follow the `Location` header to download the file.

```
GET https://api.keygen.sh/v1/accounts/<account>/artifacts/<artifact>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/artifacts/install.sh \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

### Update an artifact

Patch metadata fields (e.g. checksum or signature) on an existing artifact. Unspecified attributes remain unchanged.

```
PATCH https://api.keygen.sh/v1/accounts/<account>/artifacts/<artifact>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/artifacts/<artifact> \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/vnd.api+json' \
  -d '{
    "data": {
      "type": "artifacts",
      "attributes": {
        "checksum": "<new-checksum>"
      }
    }
  }'
```

### Yank an artifact

Permanently delete an artifact and its files. This cannot be undone.

```
DELETE https://api.keygen.sh/v1/accounts/<account>/artifacts/<artifact>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/artifacts/<artifact> \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

### List all artifacts

List artifacts sorted by creation date (newest first). Supports filtering by product, release, platform, arch, status, etc.

```
GET https://api.keygen.sh/v1/accounts/<account>/artifacts
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/artifacts?limit=15 \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

## Platforms

Platforms are automatically populated by the current releases and their artifacts. They represent supported operating systems or environments and are read-only.

### Use

Use this API to fetch available platforms (e.g., macOS, Windows, Linux) before allowing users to download platform-specific release artifacts.

### Platform object

```json
{
  "data": {
    "id": "dc355100-2d5e-4b3c-a638-a96a4b162052",
    "type": "platforms",
    "attributes": {
      "name": "macOS",
      "key": "darwin",
      "created": "2021-05-14T15:16:21.898Z",
      "updated": "2021-05-14T15:16:21.898Z"
    },
    "relationships": {
      "account": {
        "data": {
          "type": "accounts",
          "id": "<account>"
        }
      }
    }
  }
}
```

### Retrieve a platform

Retrieves details of an existing platform by its UUID.

```
GET /v1/accounts/<account>/platforms/<platform>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/platforms/<platform> \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

### List all platforms

Returns a list of platforms sorted by creation date, with the most recent first.

```
GET /v1/accounts/<account>/platforms?limit=<number>&page[size]=<size>&page[number]=<number>
```

```curl
curl "https://api.keygen.sh/v1/accounts/<account>/platforms?limit=15&page[size]=15&page[number]=2" \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

## Architectures

Architectures are CPU architectures automatically populated by releases and their artifacts. These resources are read-only.

### The arch object

```json
{
  "id": "86e4cfd9-b470-4a9a-aa2d-89a6c1e52bdf",
  "type": "arches",
  "attributes": {
    "name": null,
    "key": "amd64",
    "created": "2021-05-19T15:12:25.602Z",
    "updated": "2021-05-19T15:12:25.602Z"
  },
  "relationships": {
    "account": {
      "links": {
        "related": "/v1/accounts/<account>"
      },
      "data": {
        "type": "accounts",
        "id": "<account>"
      }
    }
  },
  "links": {
    "related": "/v1/accounts/<account>/arches/86e4cfd9-b470-4a9a-aa2d-89a6c1e52bdf"
  }
}
```

### Retrieve an arch

Retrieves the details of a single arch by ID.

```
GET /v1/accounts/<account>/arches/<arch>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/arches/<arch> \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

### List all arches

Returns all arches for an account, sorted by creation date (newest first). Supports `limit` (1–100) and pagination via `page[size]` and `page[number]`.

```
GET /v1/accounts/<account>/arches
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/arches?limit=15 \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

## Channels

Channels are read-only resources automatically populated with current releases and their artifacts. They let you group and label release tracks such as "stable" or "beta."

### Use

Fetch channels to display release tracks in your updater UI or dashboard.

### Channel

```json
{
  "data": {
    "id": "4332f8c7-29cf-46d9-8912-36da685d4291",
    "type": "channels",
    "attributes": {
      "name": "Stable",
      "key": "stable",
      "created": "2021-05-14T15:16:43.455Z",
      "updated": "2021-05-14T15:16:43.455Z"
    },
    "relationships": {
      "account": {
        "data": { "type": "accounts", "id": "<account>" },
        "links": { "related": "/v1/accounts/<account>" }
      }
    },
    "links": {
      "related": "/v1/accounts/<account>/channels/4332f8c7-29cf-46d9-8912-36da685d4291"
    }
  }
}
```

### Retrieve a channel

Retrieves details of a single channel by its identifier.

```
GET /v1/accounts/<account>/channels/<channel>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/channels/<channel> \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

### List channels

Returns all channels for an account, sorted by newest first. Supports pagination via `limit` and `page[size]`/`page[number]`.

```
GET /v1/accounts/<account>/channels?limit=15&page[size]=15&page[number]=2
```

```curl
curl "https://api.keygen.sh/v1/accounts/<account>/channels?limit=15" \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

## Webhooks

Webhook endpoints let you receive asynchronous events (like license.created or machine.heartbeat.ping) over HTTPS. Events are retried on failure (up to 15 times over 3 days) with exponential backoff. Use webhooks to trigger downstream workflows -- e.g., update your CRM when a new license is issued -- but avoid relying on them for time-sensitive operations.

### Use

When a customer activates a license in your app, Keygen can POST a license.created event to your backend webhook. You might then update your user database or send a welcome email automatically.

### Webhook endpoint

```json
{
  "data": {
    "id": "<id>",
    "type": "webhook-endpoints",
    "attributes": {
      "url": "https://api.example.com/webhooks",
      "subscriptions": ["*"],
      "created": "<iso8601>",
      "updated": "<iso8601>"
    },
    "relationships": {
      "account": { "data": { "type": "accounts", "id": "<account>" } },
      "product": { "data": null }
    }
  }
}
```

### Create endpoint

Creates a new webhook endpoint.

```
POST /v1/accounts/<account>/webhook-endpoints
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/webhook-endpoints \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "webhook-endpoints",
      "attributes": {
        "url": "https://api.example.com/webhooks",
        "subscriptions": ["license.created"]
      }
    }
  }'
```

### Retrieve endpoint

Fetch details of an existing endpoint.

```
GET /v1/accounts/<account>/webhook-endpoints/<id>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/webhook-endpoints/<id> \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

### Update endpoint

Modify an endpoint's URL or event subscriptions.

```
PATCH /v1/accounts/<account>/webhook-endpoints/<id>
```

```curl
curl -X PATCH https://api.keygen.sh/v1/accounts/<account>/webhook-endpoints/<id> \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "data": {
      "type": "webhook-endpoints",
      "attributes": {
        "url": "https://api.example.com/v2/webhooks"
      }
    }
  }'
```

### Delete endpoint

Permanently remove an endpoint.

```
DELETE /v1/accounts/<account>/webhook-endpoints/<id>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/webhook-endpoints/<id> \
  -H 'Authorization: Bearer <token>'
```

### List endpoints

List all webhook endpoints for your account.

```
GET /v1/accounts/<account>/webhook-endpoints?limit=10
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/webhook-endpoints?limit=10 \
  -H 'Authorization: Bearer <token>'
```

### Webhook event

```json
{
  "data": {
    "id": "<id>",
    "type": "webhook-events",
    "attributes": {
      "event": "license.created",
      "payload": "{...}",
      "status": "DELIVERING",
      "created": "<iso8601>"
    }
  }
}
```

### Retrieve event

Fetch a stored webhook event by ID.

```
GET /v1/accounts/<account>/webhook-events/<id>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/webhook-events/<id> \
  -H 'Authorization: Bearer <token>'
```

### Delete event

Permanently delete a stored event.

```
DELETE /v1/accounts/<account>/webhook-events/<id>
```

```curl
curl -X DELETE https://api.keygen.sh/v1/accounts/<account>/webhook-events/<id> \
  -H 'Authorization: Bearer <token>'
```

### List events

List recent webhook events for your account.

```
GET /v1/accounts/<account>/webhook-events?limit=10
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/webhook-events?limit=10 \
  -H 'Authorization: Bearer <token>'
```

### Retry event

Manually retry delivery of a failed event.

```
POST /v1/accounts/<account>/webhook-events/<id>/actions/retry
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/webhook-events/<id>/actions/retry \
  -H 'Authorization: Bearer <token>'
```

## Request logs

Request logs are generated for every API call to your Keygen account, capturing request and response details for monitoring and debugging.

### Use

Inspect past requests to troubleshoot errors such as failed license activations or invalid payloads.

### The request log object

```json
{
  "data": {
    "id": "<uuid>",
    "type": "request-logs",
    "attributes": {
      "url": "/v1/accounts/<account>/machines",
      "method": "POST",
      "status": "422",
      "userAgent": "Mozilla/5.0 (...)",
      "ip": "192.168.1.1",
      "requestHeaders": {
        "Host": "api.keygen.sh",
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      "requestBody": "{...}",
      "responseHeaders": {
        "Date": "2024-06-04T16:18:36 GMT",
        "Content-Type": "application/json; charset=utf-8"
      },
      "responseBody": "{...}",
      "responseSignature": "keyid=\"<account>\", algorithm=\"ed25519\", signature=\"...\"",
      "created": "2024-06-04T16:18:36.789Z",
      "updated": "2024-06-04T16:18:36.829Z"
    },
    "relationships": {
      "account": { "data": { "type": "accounts", "id": "<account>" } },
      "environment": { "data": null },
      "requestor": { "data": { "type": "licenses", "id": "<license>" } }
    }
  }
}
```

### Retrieve a request log

Fetch details of a specific request log by its ID.

```
GET /v1/accounts/<account>/request-logs/<request>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/request-logs/<request> \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

### List request logs

List recent request logs, sorted by creation date. Note: `requestBody` and `responseBody` will be null in the list; retrieve individual logs for full details.

```
GET /v1/accounts/<account>/request-logs
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/request-logs?limit=15 \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

## Event logs

Event logs capture actions performed in your Keygen account -- such as license validations, updates, and configuration changes -- for auditing and debugging. This beta feature is available to Keygen Cloud and EE customers.

### Use

When troubleshooting a customer's license issue, retrieve the related event log to see what happened, for example an expired license validation.

### Event log

```json
{
  "data": {
    "id": "ce7d8015-7216-4274-9b08-c201f8c5eda4",
    "type": "event-logs",
    "attributes": {
      "event": "license.updated",
      "metadata": {
        "diff": {
          "expiry": [
            "2023-09-26T16:08:27.575Z",
            "2016-09-05T22:53:37.000Z"
          ]
        }
      },
      "created": "2023-09-12T16:08:27.999Z",
      "updated": "2023-09-12T16:08:27.999Z"
    },
    "relationships": {
      "account":        { "data": { "type": "accounts",       "id": "<account>" } },
      "environment":    { "data": null },
      "request":        { "data": { "type": "request-logs",   "id": "<request>" } },
      "whodunnit":      { "data": { "type": "users",         "id": "<user>" } },
      "resource":       { "data": { "type": "licenses",      "id": "<license>" } }
    },
    "links": {
      "self": "/v1/accounts/<account>/event-logs/ce7d8015-7216-4274-9b08-c201f8c5eda4"
    }
  }
}
```

### Retrieve an event log

Fetch the details of a single event log. Requires `event-log.read` permission. Supports optional Bearer token auth.

```
GET https://api.keygen.sh/v1/accounts/<account>/event-logs/<event>
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/event-logs/<event> \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

### List event logs

Returns a list of event logs, sorted by creation date (newest first). Requires `event-log.read` permission.

```
GET https://api.keygen.sh/v1/accounts/<account>/event-logs
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/event-logs?limit=15 -g \
  -H 'Authorization: Bearer <token>' \
  -H 'Accept: application/vnd.api+json'
```

## Profiles

Retrieves details of the currently authenticated bearer (the resource tied to the API token). Use this to determine who made the API request and what permissions they have.

### Use

Identify the active user or token context for audit, reporting, or conditional logic in your application.

### Who am I?

Fetches the current token bearer's user resource, including attributes like fullName, email, status, and role.

```
GET /v1/accounts/<account>/me
```

```curl
curl https://api.keygen.sh/v1/accounts/<account>/me \
  -H 'Accept: application/vnd.api+json' \
  -H 'Authorization: Bearer <token>'
```

## Passwords

Reset or invite users to set their account password. Sends an email with a secure link hosted by Keygen.

### Use

Onboarding new team members by sending them a link to create or reset their password.

### Forgot password

Request a password reset; if the user has no password and the account is protected, set a temporary password first or unprotect the account. For custom emails and domains, set `meta.deliver` to false and handle the `user.password-reset` webhook.

```
POST https://api.keygen.sh/v1/accounts/<account>/passwords
```

```curl
curl -X POST https://api.keygen.sh/v1/accounts/<account>/passwords \
  -H 'Content-Type: application/vnd.api+json' \
  -H 'Accept: application/vnd.api+json' \
  -d '{
    "meta": {
      "email": "user@example.com",
      "deliver": false
    }
  }'
```

  ---

This text was generated by an LLM. Because of this, it may contain mistakes.

When in doubt, refer to the docs: https://keygen.sh/docs/api/
