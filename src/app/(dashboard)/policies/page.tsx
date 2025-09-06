import { ProtectedRoute } from "@/components/auth/protected-route"
import { PolicyManagement } from "@/components/policies/policy-management"

export default function PoliciesPage() {
  return (
    <ProtectedRoute>
      <PolicyManagement />
    </ProtectedRoute>
  )
}