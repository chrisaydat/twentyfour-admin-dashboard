export const runtime = 'edge'

import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getCustomersFromOrders } from "./actions";
import { EmailDialog } from "./email-dialog";

export default async function CustomersPage() {
  try {
    const customers = await getCustomersFromOrders();

    return (
      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Customers</h1>
          <Badge variant="outline">{customers.length} customers</Badge>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-right">Last Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.email}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || "—"}</TableCell>
                  <TableCell className="text-right">{customer.orderCount}</TableCell>
                  <TableCell className="text-right">${customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {customer.lastOrderDate 
                      ? format(new Date(customer.lastOrderDate), "MMM d, yyyy")
                      : "—"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <EmailDialog 
                      customerName={customer.name} 
                      customerEmail={customer.email} 
                    />
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return (
      <Card className="p-4">
        <h1 className="text-xl font-semibold mb-4">Customers</h1>
        <div className="text-center p-4">
          <p className="text-destructive">Failed to load customer data</p>
        </div>
      </Card>
    );
  }
}
