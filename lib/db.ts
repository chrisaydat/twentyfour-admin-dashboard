import 'server-only';

import { supabase } from './supabase';
import { Product, Category, Inventory, Order } from './types';

// Products
export async function getProducts(
  search: string,
  offset: number = 0
): Promise<{ products: Product[]; newOffset: number | null; totalProducts: number }> {
  let query = supabase
    .from('products')
    .select('*, inventory(*)', { count: 'exact' });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data: products, count, error } = await query
    .range(offset, offset + 4)
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  return {
    products: products || [],
    newOffset: products?.length === 5 ? offset + 5 : null,
    totalProducts: count || 0
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, inventory(*), categories(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    throw error;
  }

  return data;
}

export async function createProduct(product: Omit<Product, 'id'>) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }

  return data;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw error;
  }

  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
}

// Orders
export async function getOrders(page: number = 1): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('order_date', { ascending: false })
    .range((page - 1) * 10, page * 10 - 1);

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  return data || [];
}

// Inventory
export async function updateInventory(productId: string, quantity: number) {
  const { error } = await supabase
    .from('inventory')
    .update({ 
      quantity,
      last_updated: new Date().toISOString()
    })
    .eq('product_id', productId);

  if (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
}
