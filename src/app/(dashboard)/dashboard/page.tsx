import { ProtectedRoute } from "@/components/auth/protected-route"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={[]} />
    </ProtectedRoute>
  )
}