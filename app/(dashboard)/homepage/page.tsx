import type { Metadata } from "next"
import DashboardShell from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { SalesChart } from "@/components/sales-chart"
import { DashboardCards } from "@/components/dashboard-cards"
import { RecentActivity } from "@/components/recent-activity"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Admin dashboard overview.",
}

export default function HomePage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Welcome to your dashboard">
        <Button>Create new</Button>
      </DashboardHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCards />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <SalesChart className="col-span-4" />
        <RecentActivity className="col-span-3" />
      </div>
    </DashboardShell>
  )
}

