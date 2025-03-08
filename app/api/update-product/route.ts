export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Simplified API route to avoid TypeScript errors
export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    
    // Extract field values
    const id = formData.get('id');
    const name = formData.get('name');
    const description = formData.get('description');
    const priceText = formData.get('price');
    
    // Basic validation
    if (!id || !name || !priceText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Convert price to number
    const price = parseFloat(priceText.toString());
    if (isNaN(price)) {
      return NextResponse.json(
        { error: 'Invalid price format' },
        { status: 400 }
      );
    }
    
    // Log the update
    console.log('Updating product:', { id, name, description, price });
    
    // Update in Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase
      .from('products')
      .update({
        name,
        description,
        price
      })
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Success - revalidate and redirect
    revalidatePath('/products');
    return NextResponse.redirect(new URL('/products', request.url));
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
} 