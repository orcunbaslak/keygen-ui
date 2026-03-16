import { ProtectedRoute } from "@/components/auth/protected-route"
import { GroupManagement } from '@/components/groups/group-management'

export default function GroupsPage() {
  return (
    <ProtectedRoute>
      <GroupManagement />
    </ProtectedRoute>
  )
}