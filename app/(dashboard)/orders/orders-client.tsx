"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Filter } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { OrderDetails } from "./order-details"
import { formatCurrency } from "@/lib/utils"
import { getValidStatuses } from "./actions"

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

type OrdersClientProps = {
  initialOrders: Order[]
}

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [filteredOrders, setFilteredOrders] = useState(initialOrders)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [validStatuses, setValidStatuses] = useState<string[]>([])
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true)

  // Debug log for initial orders
  useEffect(() => {
    console.log("Initial orders in client:", initialOrders);
  }, [initialOrders]);

  // Fetch valid statuses when component mounts
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const statuses = await getValidStatuses()
        setValidStatuses(statuses)
      } catch (error) {
        console.error("Failed to fetch valid statuses:", error)
      } finally {
        setIsLoadingStatuses(false)
      }
    }
    
    fetchStatuses()
  }, [])

  const handleStatusChange = (status: string) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const applyFilters = () => {
    let result = initialOrders
    if (selectedStatuses.length > 0) {
      result = result.filter((order) => selectedStatuses.includes(order.status))
    }
    if (searchTerm) {
      result = result.filter(
        (order) =>
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
          order.id.toString().includes(searchTerm),
      )
    }
    setFilteredOrders(result)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const updateOrderStatus = (orderId: string | number, newStatus: string) => {
    // Update the orders in the local state
    const updatedOrders = filteredOrders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order,
    )
    setFilteredOrders(updatedOrders)
    
    // Also update initialOrders to keep things in sync
    const updatedInitialOrders = initialOrders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order,
    )
    initialOrders.splice(0, initialOrders.length, ...updatedInitialOrders);
    
    // If we have an order selected, update its status too
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    }
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

  // Format the display of status (capitalize first letter)
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          {!isLoadingStatuses && validStatuses.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Filter <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {validStatuses.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => handleStatusChange(status)}
                  >
                    {formatStatus(status)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Input placeholder="Search orders..." value={searchTerm} onChange={handleSearch} className="max-w-sm" />
          <Button onClick={applyFilters}>
            <Filter className="mr-2 h-4 w-4" /> Apply Filters
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Order ID</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No orders found. Create some orders to see them here.
              </TableCell>
            </TableRow>
          ) : (
            filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.customerEmail || "-"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {formatStatus(order.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                <TableCell>{format(new Date(order.date), "PP")}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {selectedOrder && (
        <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={updateOrderStatus} />
      )}
    </>
  )
}

