import type React from "react"
import { Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const recentActivities = [
  { id: 1, action: "New order placed", orderId: "#12345", amount: "$250.00", time: "2 minutes ago" },
  { id: 2, action: "Payment received", orderId: "#12344", amount: "$1,000.00", time: "1 hour ago" },
  { id: 3, action: "Product restocked", productId: "SKU-789", quantity: 50, time: "3 hours ago" },
  { id: 4, action: "Customer support ticket resolved", ticketId: "T-456", time: "5 hours ago" },
  { id: 5, action: "New user registered", userId: "U-101", time: "1 day ago" },
]

export function RecentActivity({ className }: React.ComponentProps<typeof Card>) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>You have {recentActivities.length} notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center">
              <Activity className="mr-4 h-4 w-4 text-muted-foreground" />
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.action}</p>
                <p className="text-sm text-muted-foreground">
                  {activity.orderId || activity.productId || activity.ticketId || activity.userId}
                  {activity.amount && ` - ${activity.amount}`}
                  {activity.quantity && ` - Qty: ${activity.quantity}`}
                </p>
              </div>
              <div className="ml-auto font-medium">{activity.time}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

