import { ProtectedRoute } from "@/components/auth/protected-route"
import { WebhookManagement } from '@/components/webhooks/webhook-management'

export default function WebhooksPage() {
  return (
    <ProtectedRoute>
      <WebhookManagement />
    </ProtectedRoute>
  )
}