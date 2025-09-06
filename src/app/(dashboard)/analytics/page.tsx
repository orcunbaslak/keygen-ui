import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6 px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            View usage analytics and insights for your licenses and products.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
          <p className="text-muted-foreground">
            Analytics features are coming soon. Track license usage, machine activations, and user engagement metrics.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}