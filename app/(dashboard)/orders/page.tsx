import type { Metadata } from "next"
import DashboardShell from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import OrdersClient from "./orders-client"

export const metadata: Metadata = {
  title: "Orders",
  description: "Manage your orders and shipments.",
}

// This dummy data would typically come from a database or API call
const orders = [
  { id: 1, customerName: "John Doe", status: "Pending", total: 99.99, date: "2023-05-01" },
  { id: 2, customerName: "Jane Smith", status: "Shipped", total: 149.99, date: "2023-05-02" },
  { id: 3, customerName: "Bob Johnson", status: "Delivered", total: 79.99, date: "2023-05-03" },
  { id: 4, customerName: "Alice Brown", status: "Cancelled", total: 199.99, date: "2023-05-04" },
  { id: 5, customerName: "Charlie Wilson", status: "Pending", total: 59.99, date: "2023-05-05" },
]

export default function OrdersPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Orders" text="Manage your orders and shipments">
        <Button>Create order</Button>
      </DashboardHeader>
      <OrdersClient initialOrders={orders} />
    </DashboardShell>
  )
}

