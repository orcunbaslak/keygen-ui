# Agents Guide and Index

This file orients agentic tools (LLMs) to this repository. It provides reading order, doc index, conventions, and high‑signal context to make precise, minimal, and correct changes.

## Start Here

- Read these, in order:
  1) `docs/project-documentation.md` — architecture, setup, conventions
  2) `docs/implementation-plan.md` — canonical implementation plan and priorities
  3) `docs/keygen-api-configuration.md` — Keygen API integration guide
  4) `README.md` — public, high‑level overview and features
  5) Resource‑specific docs (if present) under `docs/`

## File Map (essentials)

- App routes: `src/app/(dashboard)/*`, `src/app/(auth)/*`
- Components: `src/components/*` (feature directories)
- API client: `src/lib/api/*` with resource classes in `src/lib/api/resources/*`
- Types/utilities: `src/lib/types/*`, `src/lib/utils/*`
- Docs: `docs/*` (see above reading order)

## Conventions

- TypeScript strict; avoid `any`
- UI with shadcn/ui; follow existing component patterns (create/edit/delete/details breakdown)
- Keep changes minimal and focused; do not rename or move files without a strong reason
- Add loading and error states for async flows; use Sonner for toasts
- Follow folder naming and route patterns already present

## When Implementing Features

- Update docs: reflect changes in `docs/project-documentation.md` and, if scope changes, in `docs/implementation-plan.md`
- Add navigation and protect routes consistently
- Prefer resource class pattern for API additions

## Validate Locally

- Commands:
  - `pnpm install`
  - `pnpm dev`
  - `pnpm typecheck`

## Security & Secrets

- Never commit or inline real API tokens or passwords
- Respect environment variables from `.env.local` (not committed)

## Notes

- This AGENTS.md serves as the index for where to look and what to follow. If the repository evolves, keep this file as the authoritative entry point for agents.
