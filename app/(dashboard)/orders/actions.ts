'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Default valid statuses as fallback
const validStatuses = ["pending", "paid", "failed", "shipped", "delivered"];

// In the future, when you update your database enum, you can add these:
// const allPotentialStatuses = ["pending", "active", "completed", "cancelled"];

// Function to get valid statuses from the database
export async function getValidStatuses() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    // Try to get enum values directly from the column
    const { data, error } = await supabase
      .from('orders')
      .select('status')
      .not('status', 'is', null);
    
    if (error || !data || data.length === 0) {
      console.error('Error fetching status values:', error);
      return validStatuses; // Fall back to default list
    }
    
    // Extract unique status values
    const uniqueStatuses = [...new Set(data.map(order => order.status))];
    console.log('Unique statuses from DB:', uniqueStatuses);
    
    // Return both existing statuses from DB plus our predefined valid statuses
    // to ensure we always have all options available even if no orders have that status yet
    const allValidStatuses = [...new Set([...uniqueStatuses, ...validStatuses])];
    console.log('All valid statuses:', allValidStatuses);
    
    return allValidStatuses;
  } catch (error) {
    console.error('Error in getValidStatuses:', error);
    return validStatuses; // Fall back to default list
  }
}

// Get all orders from the database
export async function getOrders() {
  try {
    // Fix: properly await cookies to avoid synchronous access error
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    let { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    console.log('Raw order data from DB:', orders[0]);

    // Map database fields to client-side expected fields
    const formattedOrders = orders.map((order) => {
      return {
        id: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        status: order.status || "pending",
        total: order.total_amount, // Fixed: Using total_amount instead of total
        date: order.order_date,
        phone: order.phone,
        shippingAddress: order.shipping_address
      };
    });

    return formattedOrders;
  } catch (error) {
    console.error('Error in getOrders:', error);
    return [];
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    // Get valid statuses first
    const validStatusList = await getValidStatuses();
    
    // Validate status is in the allowed list
    if (!validStatusList.includes(status)) {
      console.error(`Invalid status: ${status}. Valid statuses are: ${validStatusList.join(", ")}`);
      throw new Error(`Invalid status: ${status}`);
    }
    
    // Debug log to track the update attempt
    console.log(`Attempting to update order ${orderId} to status: ${status}`);
    
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .match({ id: orderId })
      .select();

    if (error) {
      console.error('Error updating order status:', error);
      
      // More descriptive error for database constraints
      if (error.code === '23514' || (error.message && error.message.includes('violates'))) {
        throw new Error(`Database constraint error: "${status}" is not allowed in your database schema. You may need to update your enum type.`);
      }
      
      throw new Error(`Error updating order status: ${error.message || JSON.stringify(error)}`);
    }

    console.log('Update successful:', data);
    revalidatePath('/orders');
    return { success: true, data };
  } catch (error: any) {
    console.error('Error in updateOrderStatus:', error);
    throw error;
  }
} 