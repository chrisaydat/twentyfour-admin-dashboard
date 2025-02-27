"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { updateOrderStatus, getValidStatuses } from "./actions"

type Order = {
  id: string | number
  customerName: string
  customerEmail?: string
  status: string
  total: number
  date: string
  phone?: string
  shippingAddress?: string
}

interface OrderDetailsProps {
  order: Order
  onClose: () => void
  onUpdateStatus: (orderId: string | number, status: string) => void
}

// Format the status display (capitalize first letter)
const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// Helper function to get status badge variant
const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'default'
    case 'shipped':
      return 'secondary'
    case 'delivered':
      return 'success'
    case 'failed':
      return 'destructive'
    default:
      return 'outline'
  }
}

// Next status in sequence - used for the "Update Status" button
const getNextStatus = (currentStatus: string): string => {
  const statusSequence = ["pending", "paid", "shipped", "delivered", "failed"];
  const currentIndex = statusSequence.indexOf(currentStatus);
  
  // If current status isn't in our sequence or is the last one, cycle back to first
  if (currentIndex === -1 || currentIndex === statusSequence.length - 1) {
    return statusSequence[0];
  }
  
  return statusSequence[currentIndex + 1];
};

export function OrderDetails({ order, onClose, onUpdateStatus }: OrderDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(order.status)
  const [validStatuses, setValidStatuses] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debug log to see what data we're getting
  useEffect(() => {
    console.log("Order details in component:", order);
  }, [order]);

  // Fetch valid statuses when component mounts
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const statuses = await getValidStatuses()
        setValidStatuses(statuses)
      } catch (error) {
        console.error("Failed to fetch valid statuses:", error)
        // Default to just using current status if we can't fetch valid ones
        setValidStatuses([order.status])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStatuses()
  }, [order.status])

  const handleStatusChange = async (value: string) => {
    // Clear any previous errors
    setError(null)
    
    // Only proceed if the status is actually changing
    if (value === selectedStatus) return
    
    try {
      setIsUpdating(true)
      
      console.log(`Updating order ${order.id} status from ${selectedStatus} to ${value}`)
      
      // Update on the server
      const result = await updateOrderStatus(order.id.toString(), value)
      
      if (result.success) {
        // Update locally
        setSelectedStatus(value)
        
        // Update in the parent component
        onUpdateStatus(order.id, value)
        
        console.log(`Successfully updated order ${order.id} status to ${value}`)
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error: any) {
      console.error("Failed to update order status:", error)
      setError(error.message || "Failed to update status. Please try again.")
      // Don't change the selected status if there was an error
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Order #{order.id} - {format(new Date(order.date), "PPP")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Customer Information</h3>
              <div className="bg-muted/50 p-3 rounded-md space-y-1">
                <p className="font-medium">{order.customerName}</p>
                {order.customerEmail && <p className="text-sm">{order.customerEmail}</p>}
                {order.phone && <p className="text-sm">Phone: {order.phone}</p>}
              </div>
              
              {order.shippingAddress && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Shipping Address:</h4>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm whitespace-pre-line">{order.shippingAddress}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Order Status</h3>
              {isLoading ? (
                <div>Loading status options...</div>
              ) : validStatuses.length > 1 ? (
                <>
                  <Select
                    value={selectedStatus}
                    onValueChange={handleStatusChange}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        <Badge variant={getStatusVariant(selectedStatus)}>
                          {formatStatus(selectedStatus)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {validStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          <Badge variant={getStatusVariant(status)} className="mr-2">
                            {formatStatus(status)}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isUpdating && <p className="text-sm text-muted-foreground">Updating status...</p>}
                  {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                </>
              ) : (
                <div>
                  <Badge variant={getStatusVariant(selectedStatus)}>
                    {formatStatus(selectedStatus)}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    The status cannot be changed at this time. Only "pending" is currently a valid status.
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Order Total</h3>
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                <p className="text-sm text-muted-foreground">
                  Ordered on {format(new Date(order.date), "PPp")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {validStatuses.length > 1 && (
              <Button 
                disabled={isUpdating} 
                onClick={() => handleStatusChange(getNextStatus(selectedStatus))}
              >
                {isUpdating ? "Updating..." : `Change to ${formatStatus(getNextStatus(selectedStatus))}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

