'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Type definitions
export type Customer = {
  name: string;
  email: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
};

type EmailResponse = {
  success: boolean;
  message: string;
};

// Get Supabase client with anonymous key
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables for Supabase');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Retrieves unique customers from the orders table
 */
export async function getCustomersFromOrders(): Promise<Customer[]> {
  try {
    const supabase = getSupabaseClient();
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('customer_name, customer_email, phone, order_date, id, status, total_amount');
    
    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
    
    // Add null check before accessing orders
    if (!orders) {
      console.log('No orders data returned from database');
      return [];
    }
    
    // Create a map to store unique customers by email
    const customersMap = new Map<string, Customer>();
    
    orders.forEach(order => {
      if (!order.customer_email) return;
      
      const email = order.customer_email;
      const existingCustomer = customersMap.get(email);
      
      if (existingCustomer) {
        // Update existing customer data
        existingCustomer.orderCount += 1;
        existingCustomer.totalSpent += parseFloat(order.total_amount) || 0;
        
        // Update last order date if this order is more recent
        const orderDate = order.order_date;
        if (orderDate && (!existingCustomer.lastOrderDate || orderDate > existingCustomer.lastOrderDate)) {
          existingCustomer.lastOrderDate = orderDate;
        }
      } else {
        // Create new customer entry
        customersMap.set(email, {
          name: order.customer_name || 'Unknown',
          email: email,
          phone: order.phone,
          orderCount: 1,
          totalSpent: parseFloat(order.total_amount) || 0,
          lastOrderDate: order.order_date
        });
      }
    });
    
    // Convert map to array and sort by most recent order
    return Array.from(customersMap.values())
      .sort((a, b) => {
        if (!a.lastOrderDate) return 1;
        if (!b.lastOrderDate) return -1;
        return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      });
      
  } catch (error) {
    console.error('Failed to get customers:', error);
    return [];
  }
}

/**
 * Simulates sending an email to a customer
 * In a real application, this would connect to an email service
 */
export async function sendCustomerEmail(
  email: string, 
  subject: string, 
  message: string
): Promise<EmailResponse> {
  try {
    // Log the email details
    console.log(`Sending email to ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    
    // Simulate delay (would be an actual API call in production)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, you would use an email service like SendGrid, Mailchimp, etc.
    // Example: await emailService.sendEmail(email, subject, message);
    
    // Return success response
    return {
      success: true,
      message: `Email sent to ${email} successfully!`
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 