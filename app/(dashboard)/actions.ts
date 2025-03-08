'use server';

import { deleteProduct as deleteProductFromDb, updateProduct as updateProductInDb, updateProductPrice as updateProductPriceDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Define the return type for all server actions
type ServerActionResult = {
  success: boolean;
  error?: string;
};

export async function deleteProduct(formData: FormData): Promise<ServerActionResult> {
  try {
    const id = formData.get('id') as string;
    
    if (!id) {
      return { success: false, error: 'Product ID is required' };
    }
    
    await deleteProductFromDb(id);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function updateProduct(formData: FormData): Promise<ServerActionResult> {
  try {
    const id = formData.get('id') as string;
    
    console.log('=== UPDATE PRODUCT SERVER ACTION ===');
    console.log('Raw formData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    // Extract all fields with their values
    const fields: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      // Skip the ID field as it's not something we update
      if (key !== 'id') {
        fields[key] = value;
      }
    }
    
    // Remove restricted fields if they somehow made it into the form data
    delete fields.category_id;
    delete fields.image_url;
    
    // Log the fields we're updating
    console.log(`Updating product ${id} with fields:`, fields);
    
    // Check if we have any fields to update
    if (Object.keys(fields).length === 0) {
      console.warn('No fields to update were provided');
      return { 
        success: false, 
        error: 'No fields provided for update' 
      };
    }
    
    // Parse numeric values - numeric fields need special handling
    if ('price' in fields) {
      const price = parseFloat(fields.price);
      if (isNaN(price)) {
        console.error('Invalid price format:', fields.price);
        return { success: false, error: 'Price must be a valid number' };
      }
      console.log(`Parsed price: ${fields.price} (string) -> ${price} (number)`);
      fields.price = price;
    }
    
    // Call the database function to update the product
    try {
      console.log('Calling updateProductInDb with:', { id, fields });
      const updatedProduct = await updateProductInDb(id, fields);
      console.log('Product successfully updated:', updatedProduct);
      revalidatePath('/');
      return { success: true };
    } catch (dbError: any) {
      console.error('Database error during update:', dbError);
      return { 
        success: false, 
        error: dbError.message || 'Database error during update' 
      };
    }
  } catch (error) {
    console.error('Error in updateProduct action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Simple action just for updating price
export async function updateProductPrice(formData: FormData): Promise<ServerActionResult> {
  try {
    const id = formData.get('id') as string;
    const priceStr = formData.get('price') as string;
    
    console.log('Direct price update received:', { id, price: priceStr });
    
    if (!id) {
      return { success: false, error: 'Product ID is required' };
    }
    
    if (!priceStr) {
      return { success: false, error: 'Price is required' };
    }
    
    // Parse price to number
    const price = parseFloat(priceStr);
    if (isNaN(price)) {
      return { success: false, error: 'Invalid price format' };
    }
    
    // Call the specialized function
    await updateProductPriceDb(id, price);
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating product price:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
