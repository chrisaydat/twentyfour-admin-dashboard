import type React from "react"
import { Activity, DollarSign, Package, ShoppingCart, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

type ActivityItem = {
  id: string;
  action: string;
  orderId?: string;
  customer?: string;
  amount?: number;
  date: Date;
  time: string;
}

interface RecentActivityProps extends React.ComponentProps<typeof Card> {
  activities: ActivityItem[];
}

// Use different icons based on action type
const getActivityIcon = (action: string) => {
  if (action.includes("paid")) {
    return <DollarSign className="mr-4 h-4 w-4 text-green-500" />;
  } else if (action.includes("delivered")) {
    return <Package className="mr-4 h-4 w-4 text-blue-500" />;
  } else if (action.includes("order")) {
    return <ShoppingCart className="mr-4 h-4 w-4 text-orange-500" />;
  } else if (action.includes("user")) {
    return <User className="mr-4 h-4 w-4 text-purple-500" />;
  } else {
    return <Activity className="mr-4 h-4 w-4 text-muted-foreground" />;
  }
};

export function RecentActivity({ className, activities }: RecentActivityProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>You have {activities.length} recent activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center">
                {getActivityIcon(activity.action)}
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.action} {activity.customer && `from ${activity.customer}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.orderId}
                    {activity.amount !== undefined && ` - ${formatCurrency(activity.amount)}`}
                  </p>
                </div>
                <div className="ml-auto font-medium">{activity.time}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

