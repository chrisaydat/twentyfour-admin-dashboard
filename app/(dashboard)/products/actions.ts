'use server';

import { deleteProduct as deleteProductFromDb, updateProduct as updateProductInDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteProduct(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    
    if (!id) {
      throw new Error('Product ID is required');
    }
    
    // Delete the product
    await deleteProductFromDb(id);
    
    // Revalidate the path to refresh data
    revalidatePath('/products');
    
    // Redirect back to products
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete product' };
  }
}

export async function updateProduct(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const image_url = formData.get('image_url') as string;
  const category_id = parseInt(formData.get('category_id') as string);
  const stock = parseInt(formData.get('stock') as string || '0');
  const status = formData.get('status') as 'active' | 'inactive' | 'archived' || 'active';
  
  if (!id) {
    throw new Error('Product ID is required');
  }
  
  if (!name || !price || !image_url) {
    throw new Error('Name, price, and image URL are required');
  }
  
  try {
    await updateProductInDb(id, {
      name,
      description,
      price,
      image_url,
      category_id,
      stock,
      status
    });
    
    revalidatePath('/products');
    redirect('/products');
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product. Please try again.');
  }
} 