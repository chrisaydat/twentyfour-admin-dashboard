import type { Metadata } from "next"
import DashboardShell from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import OrdersClient from "./orders-client"
import { getOrders } from "./actions"

export const metadata: Metadata = {
  title: "Orders",
  description: "Manage your orders and shipments.",
}

export default async function OrdersPage() {
  // Fetch orders from the database
  const orders = await getOrders();
  
  // The orders are already formatted by the getOrders function, 
  // so we can pass them directly to the client
  return (
    <DashboardShell>
      <DashboardHeader heading="Orders" text="Manage your orders and shipments">
        <Button>Create order</Button>
      </DashboardHeader>
      <OrdersClient initialOrders={orders} />
    </DashboardShell>
  )
}

