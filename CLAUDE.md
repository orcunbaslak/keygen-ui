# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keygen-UI is a comprehensive frontend interface for Keygen API licensing management. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS v4, it provides complete CRUD operations for licenses, machines, products, policies, and users.

**Status**: 98% Complete - Production Ready ✅
**API Integration**: Connected to Keygen instance at `https://lms.pvx.ai/v1`
**Authentication**: Fully implemented with protected routes

## Development Commands

**IMPORTANT: This project uses PNPM as the package manager. Always use pnpm commands.**

```bash
# Development server with Turbopack
pnpm dev

# Production build with Turbopack
pnpm build

# Start production server
pnpm start

# Run ESLint
pnpm lint

# TypeScript type checking
pnpm typecheck

# Install new dependencies
pnpm add <package-name>

# Install shadcn/ui components (REQUIRED for UI work)
npx shadcn@latest add <component-name>
```

## Architecture & Structure

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **UI**: React 19 + Tailwind CSS v4 + shadcn/ui (New York style)
- **Language**: TypeScript with strict mode
- **Package Manager**: PNPM (REQUIRED - never use npm or yarn)
- **API Client**: Custom TypeScript client with full type safety
- **Authentication**: React Context + localStorage with protected routes
- **State Management**: React Context + SWR for data fetching
- **Icons**: Lucide React
- **Notifications**: Sonner toast notifications

### Key Configuration
- **Path Aliases**: `@/*` maps to `./src/*`
- **shadcn/ui**: Configured with components.json for New York style, CSS variables, and component installation
- **Tailwind CSS v4**: Using new PostCSS-based configuration
- **Utilities**: `cn()` function in `src/lib/utils.ts` for className merging

### Project Structure
```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (dashboard)/        # Dashboard layout group
│   │   ├── dashboard/      # Main dashboard page
│   │   ├── licenses/       # License management
│   │   ├── machines/       # Machine monitoring
│   │   ├── products/       # Product management
│   │   ├── policies/       # Policy management (placeholder)
│   │   ├── users/          # User administration
│   │   └── layout.tsx      # Dashboard layout with sidebar
│   ├── login/              # Authentication pages
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/                    # Utility functions and shared code
│   ├── api/                # Keygen API client
│   │   ├── client.ts       # Main API client
│   │   ├── index.ts        # API exports
│   │   └── resources/      # Resource-specific API methods
│   ├── auth/               # Authentication context and utilities
│   ├── types/              # TypeScript type definitions
│   └── utils.ts            # Utility functions
└── components/             # React components
    ├── ui/                 # shadcn/ui components
    ├── auth/               # Authentication components
    ├── licenses/           # License management components
    ├── machines/           # Machine management components
    ├── products/           # Product management components
    └── users/              # User management components
```

## Implementation Guidelines

### MANDATORY Requirements

1. **Package Manager**: ALWAYS use `pnpm` - never npm or yarn
2. **UI Components**: MUST use shadcn/ui for all UI components
3. **TypeScript**: All code must be fully typed
4. **API Integration**: Use existing Keygen API client (`src/lib/api/`)
5. **Authentication**: Use existing auth context (`src/lib/auth/context.tsx`)

### shadcn/ui Component Installation

**REQUIRED for all UI work:**
```bash
npx shadcn@latest add [component-name]
```

Components are installed to `@/components/ui/` with New York style and CSS variables.

### Coding Standards

1. **File Naming**: Use kebab-case for files (e.g., `license-management.tsx`)
2. **Component Naming**: Use PascalCase for components (e.g., `LicenseManagement`)
3. **Client Components**: Add `'use client'` directive when using hooks or browser APIs
4. **Error Handling**: Always implement proper error handling with toast notifications
5. **Loading States**: Always show loading states during API calls
6. **Form Validation**: Use proper form validation for all user inputs

### API Integration Pattern

```typescript
// Use existing API client
import { getKeygenApi } from '@/lib/api'

const api = getKeygenApi()

// Example API call with error handling
try {
  const response = await api.licenses.list({ limit: 50 })
  setData(response.data || [])
} catch (error: any) {
  console.error('Failed to load data:', error)
  toast.error('Failed to load data')
}
```

### Component Structure

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ExampleComponent() {
  const [loading, setLoading] = useState(true)
  const api = getKeygenApi()
  
  // Implementation...
}
```

## Environment Configuration

The application is configured to work with Keygen instance at `https://lms.pvx.ai/v1`:

```env
KEYGEN_API_URL=https://lms.pvx.ai/v1
KEYGEN_ACCOUNT_ID=aca05a24-461a-4db5-8ed1-c12b6040d1c6
KEYGEN_ADMIN_EMAIL=orcun@pvx.ai
KEYGEN_ADMIN_PASSWORD=[configured]
```

## Implemented Features

### ✅ Complete Features
- **Authentication System** (`/login`) - Full login/logout with protected routes
- **Dashboard** (`/dashboard`) - Real-time analytics with Keygen API data
- **License Management** (`/dashboard/licenses`) - Complete CRUD with professional dialogs, token generation
- **Machine Management** (`/dashboard/machines`) - Monitor and manage devices
- **Product Management** (`/dashboard/products`) - Product lifecycle management
- **Policy Management** (`/dashboard/policies`) - Complete policy management with smart API-compliant creation
- **User Management** (`/dashboard/users`) - User administration with roles

### Available API Resources
- `api.licenses` - License management operations
- `api.machines` - Machine monitoring operations  
- `api.products` - Product management operations
- `api.policies` - Policy management operations
- `api.users` - User administration operations

## Important Notes

- **Production Ready**: 98% complete, fully functional for license management
- **Real API Integration**: Connected to live Keygen instance
- **Type Safety**: Complete TypeScript coverage with strict mode
- **Performance**: Optimized with Turbopack bundling
- **Responsive Design**: Mobile-first approach with Tailwind CSS v4
- **Error Handling**: Comprehensive error management throughout

## 🤖 Agentic Development Patterns & Troubleshooting

### Critical Implementation Lessons Learned

#### 1. **Keygen API Parameter Constraints**
**Issue**: Policy creation failed with "unpermitted parameter" errors
**Root Cause**: Sending advanced strategy parameters during creation
**Solution**: Use minimal approach - only send `name`, `duration` (optional), and product relationship
**Pattern**: Always start with minimal required fields, then add optional ones incrementally

```typescript
// ✅ CORRECT - Minimal policy creation
const policyData = {
  name: formData.name.trim()
}
// Add duration only if specified
if (formData.duration) {
  policyData.duration = parseInt(formData.duration)
}
```

#### 2. **Professional Dialog Patterns**
**Anti-Pattern**: Using browser `confirm()` and `alert()` popups
**Best Practice**: Always use shadcn dialogs with proper error handling

```typescript
// ✅ CORRECT - Professional delete dialog
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
const [selectedItem, setSelectedItem] = useState<Item | null>(null)

const handleDelete = (item: Item) => {
  setSelectedItem(item)
  setDeleteDialogOpen(true)
}
```

#### 3. **API Error Handling Patterns**
**Critical**: Always handle specific HTTP status codes with user-friendly messages

```typescript
catch (error: any) {
  if (error.status === 404) {
    toast.error('Item not found - it may have been deleted')
    onItemDeleted() // Refresh list
  } else if (error.status === 422) {
    toast.error('Cannot delete - item may be in use')
  } else if (error.status === 403) {
    toast.error('Permission denied')
  } else {
    toast.error(`Operation failed: ${error.message || 'Unknown error'}`)
  }
}
```

#### 4. **Empty Response Handling**
**Issue**: JSON parsing errors on DELETE requests (empty responses)
**Solution**: Handle empty responses gracefully in client

```typescript
// In client.ts - handle empty responses
try {
  data = await response.json()
} catch (jsonError) {
  if (response.ok && method === 'DELETE') {
    data = null // DELETE often returns empty body
  }
}
```

### Development Workflow Patterns

#### 1. **API-First Development**
1. Test API endpoint with minimal data using console/script
2. Implement API resource method
3. Build UI component with proper error handling
4. Add professional dialogs and loading states

#### 2. **Error-Driven Development**  
1. Implement basic functionality
2. Test with edge cases and invalid data
3. Handle all error scenarios with specific messages
4. Add loading states and success feedback

#### 3. **Progressive Enhancement**
1. Start with minimal required fields
2. Add optional fields incrementally
3. Test each addition separately
4. Maintain backwards compatibility

### Common Debugging Techniques

#### 1. **API Request Debugging**
```typescript
// Temporary logging for debugging
console.log('Sending data:', requestData)
console.log('API response:', response)
// Remove after debugging is complete
```

#### 2. **Authentication Debugging**
```typescript
// Check token presence and format
console.log('Token:', api.getToken()?.substring(0, 20) + '...')
// Verify token is being sent in requests
```

#### 3. **Form Data Debugging**
```typescript  
// Log form data before API call
console.log('Form data before processing:', formData)
console.log('Processed API payload:', processedData)
```

### Performance Optimization Patterns

#### 1. **Conditional Rendering**
```typescript
// Only render dialogs when needed
{selectedItem && (
  <DeleteDialog
    item={selectedItem}
    open={deleteDialogOpen}
    onOpenChange={setDeleteDialogOpen}
  />
)}
```

#### 2. **Efficient State Management**
```typescript
// Use single handler for multiple similar actions
const handleAction = (action: string, item: Item) => {
  switch (action) {
    case 'edit': handleEdit(item); break;
    case 'delete': handleDelete(item); break;
  }
}
```

### Testing Strategies

#### 1. **Console Testing Pattern**
Create isolated test scripts for complex API operations before implementing in UI:

```javascript
// Test in browser console first
async function testOperation() {
  const api = getKeygenApi()
  const result = await api.resource.operation(data)
  console.log('Result:', result)
}
```

#### 2. **Error Scenario Testing**
- Test with invalid data
- Test with missing required fields  
- Test with network failures
- Test with expired tokens