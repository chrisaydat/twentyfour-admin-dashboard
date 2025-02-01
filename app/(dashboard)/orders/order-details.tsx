"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

type Order = {
  id: number
  customerName: string
  status: string
  total: number
  date: string
}

type OrderDetailsProps = {
  order: Order
  onClose: () => void
  onUpdateStatus: (orderId: number, newStatus: string) => void
}

export function OrderDetails({ order, onClose, onUpdateStatus }: OrderDetailsProps) {
  const handleStatusUpdate = (newStatus: string) => {
    onUpdateStatus(order.id, newStatus)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Order #{order.id} - {order.customerName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold">Status:</span>
            <span className="col-span-3">{order.status}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold">Total:</span>
            <span className="col-span-3">₵{order.total.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold">Date:</span>
            <span className="col-span-3">{format(new Date(order.date), "PP")}</span>
          </div>
        </div>
        <div className="flex justify-between">
          <Button onClick={() => handleStatusUpdate("Shipped")} disabled={order.status === "Shipped"}>
            Mark as Shipped
          </Button>
          <Button
            onClick={() => handleStatusUpdate("Cancelled")}
            disabled={order.status === "Cancelled"}
            variant="destructive"
          >
            Cancel Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

