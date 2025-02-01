"use client"

import { useState } from "react"
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

import { OrderDetails } from "./order-details"

const statuses = ["Pending", "Shipped", "Delivered", "Cancelled"]

type Order = {
  id: number
  customerName: string
  status: string
  total: number
  date: string
}

type OrdersClientProps = {
  initialOrders: Order[]
}

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [filteredOrders, setFilteredOrders] = useState(initialOrders)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

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
          order.id.toString().includes(searchTerm),
      )
    }
    setFilteredOrders(result)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    const updatedOrders = filteredOrders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order,
    )
    setFilteredOrders(updatedOrders)
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Filter <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statuses.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={() => handleStatusChange(status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>{order.customerName}</TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell className="text-right">₵{order.total.toFixed(2)}</TableCell>
              <TableCell>{format(new Date(order.date), "PP")}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedOrder && (
        <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={updateOrderStatus} />
      )}
    </>
  )
}

