import { ProtectedRoute } from "@/components/auth/protected-route"
import { EntitlementManagement } from '@/components/entitlements/entitlement-management'

export default function EntitlementsPage() {
  return (
    <ProtectedRoute>
      <EntitlementManagement />
    </ProtectedRoute>
  )
}