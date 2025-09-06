import { ProtectedRoute } from "@/components/auth/protected-route"
import { MachineManagement } from "@/components/machines/machine-management"

export default function MachinesPage() {
  return (
    <ProtectedRoute>
      <MachineManagement />
    </ProtectedRoute>
  )
}