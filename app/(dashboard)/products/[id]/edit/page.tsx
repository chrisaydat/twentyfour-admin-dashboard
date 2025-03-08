import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default async function EditProductPage({ params }: any) {
  // Get the product ID from params
  const id = params.id;
  
  // Create Supabase client
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch the product
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  
  // Handle errors or missing product
  if (error || !product) {
    redirect('/products');
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <Link href="/products">
          <Button variant="outline" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
        </Link>
      </div>
      
      <div className="bg-white rounded-md border p-6 shadow-sm">
        <form action="/api/update-product" method="POST" className="space-y-4">
          <input type="hidden" name="id" value={product.id} />
          
          <div className="space-y-2">
            <label className="font-medium">Name</label>
            <Input id="name" name="name" defaultValue={product.name} required />
          </div>
          
          <div className="space-y-2">
            <label className="font-medium">Description</label>
            <Textarea 
              id="description" 
              name="description" 
              defaultValue={product.description} 
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <label className="font-medium">Price</label>
            <Input 
              id="price" 
              name="price" 
              type="number" 
              step="0.01" 
              defaultValue={product.price} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="font-medium">Category ID (read-only)</label>
            <div className="text-gray-600 text-sm">{product.category_id}</div>
            <input type="hidden" name="category_id" value={product.category_id} />
          </div>
          
          <div className="space-y-2">
            <label className="font-medium">Image URL (read-only)</label>
            <div className="text-gray-600 text-sm truncate">{product.image_url}</div>
            <input type="hidden" name="image_url" value={product.image_url} />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Link href="/products">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}