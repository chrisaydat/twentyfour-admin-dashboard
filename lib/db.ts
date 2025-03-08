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
  console.log(`Starting updateProduct for id=${id} with updates:`, JSON.stringify(updates, null, 2));

  // Convert string ID to integer (Supabase expects int8)
  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    throw new Error(`Invalid product ID: ${id}`);
  }

  // If there are no updates provided, return early
  if (!updates || Object.keys(updates).length === 0) {
    console.warn('No updates provided for product update');
    throw new Error('No fields to update were provided');
  }

  // Format updates to match expected types
  const formattedUpdates: Record<string, any> = {};
  
  // Handle text fields
  if (updates.name !== undefined) formattedUpdates.name = String(updates.name);
  if (updates.description !== undefined) formattedUpdates.description = String(updates.description);
  if (updates.image_url !== undefined) formattedUpdates.image_url = String(updates.image_url);
  
  // Handle numeric fields
  if (updates.category_id !== undefined) {
    const categoryId = typeof updates.category_id === 'string' 
      ? parseInt(updates.category_id) 
      : updates.category_id;
    
    if (isNaN(categoryId)) {
      throw new Error('Invalid category_id value');
    }
    formattedUpdates.category_id = categoryId;
  }
  
  // Special handling for price to ensure it's a valid numeric value
  if (updates.price !== undefined) {
    // If it's a string (which it might be from FormData), convert to number
    const numericPrice = typeof updates.price === 'string' 
      ? parseFloat(updates.price) 
      : updates.price;
    
    if (isNaN(numericPrice)) {
      throw new Error('Invalid price value');
    }
    
    // Ensure price is a number, not a string
    formattedUpdates.price = numericPrice;
  }
  
  console.log('Formatted updates for Supabase:', JSON.stringify(formattedUpdates, null, 2));
  console.log('Query params - table: products, id:', numericId);
  
  // Now perform the update
  try {
    console.log('Sending update to Supabase...');
    
    // First try to see if the product exists
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('id', numericId)
      .single();
      
    if (checkError) {
      console.error('Error checking if product exists:', checkError);
      throw new Error(`Failed to find product with ID ${numericId}: ${checkError.message}`);
    }
    
    if (!existingProduct) {
      console.error(`Product with ID ${numericId} does not exist`);
      throw new Error(`Product with ID ${numericId} does not exist`);
    }
    
    console.log('Product exists, proceeding with update...');
    
    // Now try the update operation
    const { data, error } = await supabase
      .from('products')
      .update(formattedUpdates)
      .eq('id', numericId)
      .select();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    console.log('Supabase update response:', data);
    
    // If no data was returned but there was no error, the update probably succeeded
    if (!data || data.length === 0) {
      console.warn('Update succeeded but no data was returned');
      
      // Fetch the updated product to return complete data
      const { data: updatedProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', numericId)
        .single();
        
      if (fetchError) {
        console.warn('Could not fetch updated product:', fetchError);
      } else {
        console.log('Fetched updated product:', updatedProduct);
      }
      
      return updatedProduct || { id: numericId, ...formattedUpdates };
    }

    console.log('Update successful, returned data:', data[0]);
    return data[0]; // Return the first item from the array
  } catch (error) {
    console.error('Supabase update error:', error);
    throw error;
  }
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

// Simple function just to update a product's price
export async function updateProductPrice(id: string, price: number) {
  console.log(`Attempting to update product ${id} price to ${price}`);
  
  // Convert ID to number
  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    throw new Error(`Invalid product ID: ${id}`);
  }
  
  // Validate price
  if (isNaN(price) || price < 0) {
    throw new Error(`Invalid price: ${price}`);
  }
  
  // Direct simple query
  const { data, error } = await supabase
    .from('products')
    .update({ price })  // Only update the price
    .eq('id', numericId)
    .select('id, price');
  
  if (error) {
    console.error('Error updating product price:', error);
    throw error;
  }
  
  console.log('Price update result:', data);
  return data;
}
