import { ProtectedRoute } from "@/components/auth/protected-route"
import { LicenseManagement } from "@/components/licenses/license-management"

export default function LicensesPage() {
  return (
    <ProtectedRoute>
      <LicenseManagement />
    </ProtectedRoute>
  )
}