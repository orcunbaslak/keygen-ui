# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keygen-UI is a Next.js 15 application using React 19, TypeScript, and Tailwind CSS v4. The project is configured with shadcn/ui components and uses Turbopack for fast development builds.

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# TypeScript type checking
npx tsc --noEmit
```

## Architecture & Structure

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 + Tailwind CSS v4 + shadcn/ui (New York style)
- **Language**: TypeScript with strict mode
- **Bundler**: Turbopack for faster builds
- **Icons**: Lucide React

### Key Configuration
- **Path Aliases**: `@/*` maps to `./src/*`
- **shadcn/ui**: Configured with components.json for New York style, CSS variables, and component installation
- **Tailwind CSS v4**: Using new PostCSS-based configuration
- **Utilities**: `cn()` function in `src/lib/utils.ts` for className merging

### Project Structure
```
src/
├── app/          # Next.js App Router pages and layouts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/          # Utility functions and shared code
│   └── utils.ts
└── components/   # React components (to be created)
    └── ui/       # shadcn/ui components
```

## shadcn/ui Component Installation

Use the shadcn/ui CLI to add components:
```bash
npx shadcn@latest add [component-name]
```

Components will be installed to `@/components/ui/` with the configured New York style and CSS variables.

## Important Notes

- Turbopack is enabled for both development and production builds
- The project uses Tailwind CSS v4 with the new PostCSS plugin configuration
- ESLint is configured with Next.js recommended rules and TypeScript support
- No test framework is currently configured