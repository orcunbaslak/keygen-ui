# 🔐 Keygen UI

<div align="center">

**A beautiful, modern frontend interface for Keygen API licensing management**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-black?style=for-the-badge)](https://ui.shadcn.com/)

[Features](#-features) •
[Demo](#-demo) •
[Quick Start](#-quick-start) •
[Documentation](#-documentation) •
[Contributing](#-contributing)

</div>

---

## 🌟 Overview

Keygen UI is a comprehensive, production-ready frontend application that provides a beautiful interface for managing software licensing through the Keygen API. Built with modern web technologies, it offers complete CRUD operations for licenses, machines, products, policies, and users.

### ✨ Why Keygen UI?

- 🎨 **Beautiful Design**: Modern, responsive interface built with shadcn/ui components
- 🚀 **Production Ready**: Fully functional with real API integration
- 📱 **Mobile First**: Responsive design that works on all devices
- ⚡ **Fast & Modern**: Built with Next.js 15, React 19, and Turbopack
- 🔒 **Secure**: Complete authentication system with protected routes
- 🛠 **Developer Friendly**: Full TypeScript support with comprehensive type safety

---

## 🎯 Features

### 🔐 Authentication & Security
- **Secure Login System** - Email/password authentication with session management
- **Protected Routes** - Role-based access control throughout the application
- **User Profiles** - Integrated user management with logout functionality

### 📊 Dashboard & Analytics
- **Real-time Overview** - Live statistics from your Keygen instance
- **Interactive Charts** - Visual data representation with responsive design
- **Quick Actions** - Easy access to common management tasks

### 🎫 License Management
- **Complete CRUD Operations** - Create, read, update, delete licenses with professional dialogs
- **Advanced Search & Filtering** - Find licenses by status, user, or policy
- **License Actions** - Suspend, reinstate, renew licenses with one click
- **Edit License Properties** - Update name, expiry, usage limits, and metadata
- **Activation Token Generation** - Generate secure tokens for license activation
- **License Key Management** - Copy keys, view detailed usage statistics

### 💻 Machine Management
- **Device Monitoring** - Real-time heartbeat status tracking
- **Machine Details** - Hardware information and activation history
- **Fingerprint Management** - Unique device identification
- **Status Controls** - Activate, deactivate, and manage machine states

### 📦 Product Management
- **Product Catalog** - Comprehensive product lifecycle management
- **Distribution Strategies** - Licensed, Open, and Closed distribution models
- **Platform Support** - Multi-platform configuration and management
- **Metadata Management** - Custom product information and settings

### 🛡️ Policy Management
- **Smart Policy Creation** - API-compliant minimal parameter approach
- **Policy Templates** - Floating, strict, protected, and timed policies
- **Search & Filter** - Find policies by type and configuration
- **Professional Dialogs** - Beautiful delete confirmations with proper warnings

### 👥 User Administration
- **User Directory** - Complete user account management
- **Role-Based Access** - Admin, Developer, Sales Agent, Support roles
- **User Moderation** - Ban/unban functionality with audit trails
- **Profile Management** - User information and account settings

---

## 🖼️ Screenshots

<div align="center">

### 📊 Dashboard Overview
*Real-time analytics and comprehensive license management at a glance*

![Dashboard](./public/screenshots/Dashboard.png)

### 🎫 License Management
*Complete license lifecycle with professional dialogs*

![License Management](./public/screenshots/LicensesOverview.png)

### ➕ Create New License
*Intuitive license creation with policy and user selection*

![Create License](./public/screenshots/CreateNewLicense.png)

### 🛡️ Policy Management
*Smart policy creation with API-compliant minimal parameters*

![Create Policy](./public/screenshots/CreatePolicy.png)

### 🗑️ Professional Delete Dialogs
*Beautiful confirmation dialogs with proper warnings - no ugly browser popups!*

![Delete License](./public/screenshots/DeleteLicense.png)

</div>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **PNPM** (recommended package manager)
- **Keygen Account** with API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/orcunbaslak/keygen-ui.git
   cd keygen-ui
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Keygen instance details:
   ```env
   KEYGEN_API_URL=https://api.keygen.sh/v1
   KEYGEN_ACCOUNT_ID=your-account-id
   KEYGEN_ADMIN_EMAIL=your-email@example.com
   KEYGEN_ADMIN_PASSWORD=your-secure-password
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### 🎉 That's it!

You should now have a fully functional Keygen UI running locally.

---

## 🛠️ Technology Stack

<div align="center">

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 15 | React framework with App Router |
| **UI Library** | React | 19 | User interface library |
| **Language** | TypeScript | 5 | Type-safe JavaScript |
| **Styling** | Tailwind CSS | 4 | Utility-first CSS framework |
| **Components** | shadcn/ui | Latest | Beautiful, accessible components |
| **Bundler** | Turbopack | Latest | Fast development builds |
| **Icons** | Lucide React | Latest | Beautiful icon library |
| **Notifications** | Sonner | Latest | Toast notifications |

</div>

---

## 📖 Documentation

### API Integration

Keygen UI comes with a fully typed API client that handles all interactions with the Keygen API:

```typescript
import { getKeygenApi } from '@/lib/api'

const api = getKeygenApi()

// Example: List licenses
const licenses = await api.licenses.list({ limit: 50 })

// Example: Create a new license
const newLicense = await api.licenses.create({
  policyId: 'policy-123',
  userId: 'user-456'
})
```

### Component Architecture

All components follow consistent patterns and use shadcn/ui:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ExampleComponent() {
  const [loading, setLoading] = useState(false)
  
  return (
    <Button 
      onClick={() => toast.success('Hello World!')}
      disabled={loading}
    >
      Click Me
    </Button>
  )
}
```

### Available Routes

- `/login` - Authentication page
- `/dashboard` - Main dashboard with analytics
- `/dashboard/licenses` - License management
- `/dashboard/machines` - Machine monitoring
- `/dashboard/products` - Product management
- `/dashboard/policies` - Policy management
- `/dashboard/users` - User administration

---

## 🎨 Customization

### Theming

Keygen UI uses Tailwind CSS with CSS variables for easy theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... more variables */
}
```

### Adding Components

Use the shadcn/ui CLI to add new components:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add data-table
```

### API Resources

Extend the API client by adding new resources:

```typescript
// src/lib/api/resources/custom.ts
export class CustomResource {
  constructor(private client: KeygenClient) {}
  
  async customMethod() {
    return this.client.request('/custom-endpoint')
  }
}
```

---

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript type checking

# Dependencies
pnpm add <package>     # Add new dependency
```

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (dashboard)/     # Dashboard routes
│   └── login/           # Authentication
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── licenses/       # License management
│   ├── machines/       # Machine management
│   └── users/          # User management
├── lib/                # Utilities and API
│   ├── api/            # Keygen API client
│   ├── auth/           # Authentication
│   └── types/          # TypeScript types
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 1. Fork & Clone
```bash
git clone https://github.com/your-username/keygen-ui.git
```

### 2. Create a Branch
```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 4. Commit & Push
```bash
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

### 5. Open a Pull Request
Describe your changes and link any related issues.

### Development Guidelines

- **Use PNPM** for package management
- **Follow TypeScript** strict mode
- **Use shadcn/ui** components for UI
- **Add proper error handling** with toast notifications
- **Include loading states** for async operations

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Keygen](https://keygen.sh/)** - For providing an excellent software licensing API
- **[shadcn/ui](https://ui.shadcn.com/)** - For beautiful, accessible UI components
- **[Next.js Team](https://nextjs.org/)** - For the amazing React framework
- **[Tailwind CSS](https://tailwindcss.com/)** - For the utility-first CSS framework

---

## 📞 Support

- **Documentation**: Check out our [documentation](#-documentation)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/orcunbaslak/keygen-ui/issues)
- **Discussions**: Join conversations in [GitHub Discussions](https://github.com/orcunbaslak/keygen-ui/discussions)

---

<div align="center">

**Built with ❤️ by Orçun Başlak**

[⭐ Star this repository](https://github.com/orcunbaslak/keygen-ui) if you find it helpful!

</div>
