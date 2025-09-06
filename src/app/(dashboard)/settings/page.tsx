import { ProtectedRoute } from "@/components/auth/protected-route"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6 px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings, API keys, and Keygen configuration.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
          <p className="text-muted-foreground">
            Settings management features are coming soon. Configure account preferences, API tokens, and webhooks.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}