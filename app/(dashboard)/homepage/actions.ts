'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create a Supabase client with the anon key
function getSupabaseClient() {
  const cookieStore = cookies();
  
  // Required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing required environment variables for Supabase');
  }
  
  // Create the client with anon key
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Get total revenue (sum of total_amount from all delivered orders)
export async function getTotalRevenue() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'delivered');

    if (error) {
      console.error('Error fetching total revenue:', error);
      return 0;
    }

    // Sum up all total_amount values
    const totalRevenue = data.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    return totalRevenue;
  } catch (error) {
    console.error('Error in getTotalRevenue:', error);
    return 0;
  }
}

// Get sales total (sum of total_amount from all paid orders)
export async function getSalesTotal() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'paid');

    if (error) {
      console.error('Error fetching sales total:', error);
      return 0;
    }

    // Sum up all total_amount values
    const salesTotal = data.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    return salesTotal;
  } catch (error) {
    console.error('Error in getSalesTotal:', error);
    return 0;
  }
}

// Get count of active users
export async function getActiveUsers() {
  try {
    // For this function, we'll return a static number since accessing auth might 
    // require different permissions
    return 10; // Replace with actual implementation when permissions are set up
  } catch (error) {
    console.error('Error in getActiveUsers:', error);
    return 0;
  }
}

// Get recent activities
export async function getRecentActivities(limit = 5) {
  try {
    const supabase = getSupabaseClient();

    // Get recent orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, customer_name, total_amount, order_date, status')
      .order('order_date', { ascending: false })
      .limit(limit);

    if (ordersError) {
      console.error('Error fetching recent orders:', ordersError);
      return [];
    }

    // Format the activities
    const activities = orders.map(order => ({
      id: `order-${order.id}`,
      action: `New order ${order.status === 'paid' ? '(paid)' : order.status === 'delivered' ? '(delivered)' : ''}`,
      orderId: `#${order.id}`,
      customer: order.customer_name,
      amount: order.total_amount,
      date: new Date(order.order_date),
      time: getRelativeTimeString(new Date(order.order_date))
    }));

    return activities;
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    return [];
  }
}

// Get monthly sales data for chart
export async function getMonthlySalesData() {
  try {
    const supabase = getSupabaseClient();

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Create array of month names
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    // Initialize data with zero values for all months
    const salesData = months.map(name => ({ name, total: 0 }));
    
    // Get all orders for the current year
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_amount, order_date')
      .gte('order_date', `${currentYear}-01-01`)
      .lte('order_date', `${currentYear}-12-31`)
      .in('status', ['paid', 'delivered', 'shipped']);

    if (error) {
      console.error('Error fetching monthly sales data:', error);
      return salesData;
    }

    // Sum up sales by month
    orders.forEach(order => {
      const orderDate = new Date(order.order_date);
      const monthIndex = orderDate.getMonth();
      salesData[monthIndex].total += order.total_amount || 0;
    });

    return salesData;
  } catch (error) {
    console.error('Error in getMonthlySalesData:', error);
    return [];
  }
}

// Helper function to format relative time
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);

  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDays === 1) return `1 day ago`;
  if (diffDays < 30) return `${diffDays} days ago`;
  
  // Format as date for older items
  return date.toLocaleDateString();
} 