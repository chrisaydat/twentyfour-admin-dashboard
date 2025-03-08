'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  stock: number;
  status: 'active' | 'inactive' | 'archived';
}

type Category = {
  id: number;
  name: string;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  // Fetch product and categories on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()
          
        if (productError) {
          console.error('Error fetching product:', productError)
          setError('Failed to load product. Please try again.')
          return
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name')
          
        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError)
          // Continue with product data even if categories failed
        }
        
        setProduct(productData)
        if (categoriesData) {
          setCategories(categoriesData)
        }
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUpdating(true)
    setUpdateError(null)

    try {
      const formData = new FormData(e.currentTarget)
      
      const name = formData.get('name') as string
      const description = formData.get('description') as string
      const price = parseFloat(formData.get('price') as string)
      const image_url = formData.get('image_url') as string
      const category_id = parseInt(formData.get('category_id') as string)
      const stock = parseInt(formData.get('stock') as string || '0')
      const status = formData.get('status') as 'active' | 'inactive' | 'archived' || 'active'
      
      // Validate required fields
      if (!name || !price || !image_url) {
        setUpdateError('Name, price, and image URL are required')
        return
      }
      
      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name,
          description,
          price,
          image_url,
          category_id,
          stock,
          status
        })
        .eq('id', id)
        
      if (updateError) {
        console.error('Error updating product:', updateError)
        setUpdateError(updateError.message)
        return
      }
      
      // Redirect back to products page
      router.push('/products')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setUpdateError('An unexpected error occurred. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading product data...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center gap-4 h-64 justify-center">
        <p className="text-red-500">{error || 'Product not found'}</p>
        <Link href="/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <Link href="/products">
          <Button variant="outline" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit {product.name}</CardTitle>
          <CardDescription>Make changes to your product here</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="id" value={product.id} />
            
            <div className="space-y-2">
              <div className="font-medium">Product Name</div>
              <Input id="name" name="name" defaultValue={product.name} required />
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">Description</div>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={product.description} 
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Price</div>
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
                <div className="font-medium">Stock</div>
                <Input 
                  id="stock" 
                  name="stock" 
                  type="number" 
                  defaultValue={product.stock || 0} 
                  required 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Category</div>
                <Select name="category_id" defaultValue={String(product.category_id)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="font-medium">Status</div>
                <Select name="status" defaultValue={product.status || 'active'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">Image URL</div>
              <Input 
                id="image_url" 
                name="image_url" 
                type="url" 
                defaultValue={product.image_url} 
                required 
              />
            </div>

            {updateError && (
              <div className="text-red-500 text-sm">{updateError}</div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Link href="/products">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" form="edit-product-form" disabled={updating}>
            {updating ? 'Updating...' : 'Update Product'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 