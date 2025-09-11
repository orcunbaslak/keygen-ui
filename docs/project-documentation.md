# Keygen UI — Project Documentation

This document is the comprehensive guide to architecture, setup, conventions, and feature coverage for Keygen UI. For implementation priorities, see `docs/implementation-plan.md`. For Keygen API details, see `docs/keygen-api-configuration.md`.

## Overview

- Purpose: A modern, production-ready UI for managing software licensing with Keygen
- Status: Core resources implemented (Licenses, Machines, Products, Policies, Users, Groups, Entitlements, Webhooks). Analytics UI in progress.
- Stack: Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, SWR, TanStack Table, Recharts, Sonner

## Architecture

- App Router (Next.js) with segmented routes: `(auth)`, `(dashboard)`
- Type-safe API layer under `src/lib/api` with resource classes per entity
- UI organized by feature directories under `src/components/*`
- Auth: email/password login; protected routes; session stored client-side
- Data: SWR for fetching/caching; paginated APIs; optimistic UI where safe

Project structure (abridged):

```
src/
├─ app/
│  ├─ (auth)/login/
│  ├─ (dashboard)/
│  │  ├─ dashboard/
│  │  ├─ licenses/
│  │  ├─ machines/
│  │  ├─ products/
│  │  ├─ policies/
│  │  ├─ users/
│  │  ├─ groups/
│  │  ├─ entitlements/
│  │  ├─ webhooks/
│  │  └─ layout.tsx
├─ components/
│  ├─ ui/                  # shadcn/ui
│  ├─ licenses/
│  ├─ machines/
│  ├─ products/
│  ├─ policies/
│  ├─ users/
│  ├─ groups/
│  ├─ entitlements/
│  ├─ webhooks/
│  └─ shared/
├─ lib/
│  ├─ api/
│  │  ├─ client.ts
│  │  └─ resources/*
│  ├─ auth/
│  ├─ types/
│  └─ utils/
```

## Setup

Environment variables (`.env.local`):

```
KEYGEN_API_URL=<https://api.keygen.sh/v1 or your instance>
KEYGEN_ACCOUNT_ID=<account-id>
KEYGEN_ADMIN_EMAIL=<email>
KEYGEN_ADMIN_PASSWORD=<password>
```

Commands:
- `pnpm install` — install deps
- `pnpm dev` — start dev server
- `pnpm typecheck` — TypeScript checks

## API Integration

- API client exposes resources: `licenses`, `machines`, `products`, `policies`, `users`, `groups`, `entitlements`, `webhooks`, and request logs.
- Resource pattern:

```ts
class ExampleResource {
  constructor(private client: KeygenClient) {}
  list(params?: unknown) { /* GET */ }
  get(id: string) { /* GET /:id */ }
  create(payload: unknown) { /* POST */ }
  update(id: string, payload: unknown) { /* PATCH */ }
  delete(id: string) { /* DELETE */ }
}
```

- Error handling: consistent toasts for user feedback; maps HTTP status codes to specific messages; retries where safe.

Key references:
- Canonical Keygen guide: `docs/keygen-api-configuration.md`

## Error Handling

- Typed errors: the API client throws structured objects (not `Error` instances) per `src/lib/types/errors.ts` (e.g., `KeygenApiError`, `AuthError`, `NetworkError`, `ParseError`). Use guards from `src/lib/utils/error-guards.ts` when you need to branch on error type.
- UI utilities: prefer the centralized helpers in `src/lib/utils/error-handling.ts`:
  - `handleCrudError(error, operation, resourceType, options?)` for create/update/delete actions
  - `handleLoadError(error, resourceType, options?)` for data loading
  - `handleFormError(error, formType, options?)` for submissions
- Notifications: all user-facing error feedback uses Sonner toasts. Do not use browser alert/prompt/confirm for errors. Success toasts remain inline in components.
- Parsing and network: JSON parse failures yield `ParseError`; fetch/connection failures yield `NetworkError`. Auth-related HTTP codes map to `AuthError`.
- Retry guidance: `isRetryableError` covers server and rate-limit scenarios; `getRetryDelay` provides sensible backoff hints.

## Feature Coverage

- Licenses: full CRUD, suspend/reinstate, renew, activation tokens
- Machines: list, delete, heartbeat status, identifiers
- Products: full lifecycle, distribution strategies, platforms, metadata
- Policies: CRUD with API-compliant minimal creation, type badges
- Users: directory, roles, ban/unban, CRUD
- Groups: CRUD, membership relations
- Entitlements: CRUD, code-based features, license association
- Webhooks: CRUD, enable/disable, test events, delivery history, event categories
- Analytics: request logs API integration (UI in Phase 3)

## UI/UX Patterns

- Use shadcn/ui components and styling conventions
- Tables: TanStack Table with pagination, search, filter controls
- Dialogs: create/edit/delete/details as separate components per resource
- Loading & error states: always present on async flows
- Notifications: Sonner for success/error toasts

## Security

- Never embed admin/product/environment tokens in client code
- Use HTTPS and secure CORS in production
- Validate inputs client-side and server-side (where applicable)
- Handle auth failures and token expiry gracefully

## Performance

- Pagination for large lists; SWR caching and revalidation
- Virtualize large tables where needed
- Code-splitting via Next.js; avoid unnecessary re-renders

## Testing (lightweight guidance)

- Unit: API utilities and helpers
- Integration: resource interactions and form submissions
- E2E (optional): core flows with Playwright

## Development Guidelines

- TypeScript strict; no `any` unless justified
- Consistent file naming and directory structure per existing patterns
- Keep components focused; lift shared logic into `components/shared` or hooks
- Document new resources in this file and the implementation plan

## Roadmap (summary)

- P0: Releases & Artifacts; Analytics UI
- P1: Token management; RBAC enhancements
- P2: Bulk operations; global search; UX polish
- P3: Webhook explorer; API docs viewer

## References

- Implementation plan (canonical): `docs/implementation-plan.md`
- Keygen API configuration: `docs/keygen-api-configuration.md`
