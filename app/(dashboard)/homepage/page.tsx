import type { Metadata } from "next"
import DashboardShell from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { SalesChart } from "@/components/sales-chart"
import { DashboardCards } from "@/components/dashboard-cards"
import { RecentActivity } from "@/components/recent-activity"
import { 
  getTotalRevenue, 
  getSalesTotal, 
  getActiveUsers, 
  getRecentActivities,
  getMonthlySalesData 
} from "./actions"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Admin dashboard overview.",
}

export default async function HomePage() {
  try {
    // Fetch all data concurrently
    const [totalRevenue, salesTotal, activeUsers, recentActivities, salesData] = await Promise.all([
      getTotalRevenue(),
      getSalesTotal(),
      getActiveUsers(),
      getRecentActivities(5),  // Get 5 most recent activities
      getMonthlySalesData()
    ]);

    return (
      <DashboardShell>
        <DashboardHeader heading="Dashboard" text="Welcome to your dashboard">
          <Button>Create new</Button>
        </DashboardHeader>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCards 
            totalRevenue={totalRevenue}
            salesTotal={salesTotal}
            activeUsers={activeUsers}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <SalesChart className="col-span-4" salesData={salesData} />
          <RecentActivity className="col-span-3" activities={recentActivities} />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error rendering dashboard:", error);
    
    // Fallback to a simplified dashboard with default values
    return (
      <DashboardShell>
        <DashboardHeader heading="Dashboard" text="Welcome to your dashboard">
          <Button>Create new</Button>
        </DashboardHeader>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCards 
            totalRevenue={0}
            salesTotal={0}
            activeUsers={0}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <SalesChart className="col-span-4" salesData={[]} />
          <RecentActivity className="col-span-3" activities={[]} />
        </div>
      </DashboardShell>
    );
  }
}

